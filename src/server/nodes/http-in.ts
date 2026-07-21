import {
  IONode,
  type Infer,
  type Outputs,
  type Port,
  type RED,
} from "@bonsae/nrg/server";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ConfigsSchema } from "../../shared/schemas/http-in";
import { resStore } from "../lib/res-store";

type HttpInConfig = Infer<typeof ConfigsSchema>;

/** A plain, clone-safe snapshot of the request for downstream nodes to read. */
type RequestSnapshot = {
  method: string;
  url: string;
  headers: IncomingMessage["headers"];
  query: Record<string, unknown>;
  params: Record<string, string>;
  body: unknown;
};

/**
 * Emitted per request. The live `res` can't ride a wire (it wouldn't survive a
 * fan-out clone), so http-in stashes it in the module-local `resStore` under a
 * freshly-minted id and rides ONLY that id on the wire — TYPED, inside
 * `_httpIn`. http-out reads `_httpIn.resId` back and looks the socket up. The
 * id is a declared wire field, so the wire-check reds http-out if a node between
 * them drops it. The public output also carries a clone-safe request snapshot.
 */
type HttpInOutputs = Outputs<{
  out: Port<{
    payload: unknown;
    req: RequestSnapshot;
    _httpIn: { resId: string };
  }>;
}>;

/** 504 an unanswered request after this long so an abandoned socket never hangs. */
const RESPONSE_TIMEOUT_MS = 5 * 60_000;

/** `RED.httpNode` is Node-RED's user-facing Express app (typed by nrg). Express
 *  keeps its registered routes on the internal `app._router.stack`, which the
 *  public Express types don't model — the same internal core `http in` splices to
 *  drop its own route on redeploy, so re-deploying doesn't stack routes. */
type UserHttpServer = RED["httpNode"] & {
  _router?: {
    stack: Array<{
      route?: { path?: string; methods?: Record<string, boolean> };
    }>;
  };
};

/** Express-decorated request (query/params/body populated by its middleware). */
type ExpressRequest = IncomingMessage & {
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  body?: unknown;
};

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default class HttpIn extends IONode<
  HttpInConfig,
  never,
  never,
  HttpInOutputs
> {
  static override readonly type = "http-in";
  static override readonly category = "network";
  static override readonly color = "#e7e7ae";
  static override readonly configSchema = ConfigsSchema;

  #app?: UserHttpServer;
  #url?: string;
  #method?: string;

  override async created() {
    const method = (this.config.method || "get").toLowerCase();
    const url = normalizePath(this.config.url);
    if (!url) {
      this.status({ fill: "red", shape: "dot", text: "missing path" });
      throw new Error("http-in: no url path configured");
    }

    const httpNode = this.RED.httpNode;
    const handler = (req: IncomingMessage, res: ServerResponse) => {
      void this.#onRequest(req as ExpressRequest, res);
    };
    // RED.httpNode is a typed Express app — register the route on the matcher for
    // this method (the schema constrains it to these five).
    switch (method) {
      case "get":
        httpNode.get(url, handler);
        break;
      case "post":
        httpNode.post(url, handler);
        break;
      case "put":
        httpNode.put(url, handler);
        break;
      case "delete":
        httpNode.delete(url, handler);
        break;
      case "patch":
        httpNode.patch(url, handler);
        break;
      default:
        this.status({
          fill: "red",
          shape: "dot",
          text: `unsupported: ${method}`,
        });
        throw new Error(`http-in: unsupported HTTP method "${method}"`);
    }

    this.#app = httpNode;
    this.#url = url;
    this.#method = method;
    this.status({
      fill: "green",
      shape: "dot",
      text: `${method.toUpperCase()} ${url}`,
    });
  }

  override async closed() {
    // Express 4 has no public route-removal API — splice ours off the stack, the
    // same way the core http-in node does, so a redeploy doesn't stack routes.
    const stack = this.#app?._router?.stack;
    if (!stack) return;
    for (let i = stack.length - 1; i >= 0; i--) {
      const route = stack[i]?.route;
      if (route?.path === this.#url && route?.methods?.[this.#method ?? ""]) {
        stack.splice(i, 1);
      }
    }
  }

  async #onRequest(req: ExpressRequest, res: ServerResponse) {
    const method = (req.method ?? "GET").toUpperCase();
    const query =
      req.query ??
      Object.fromEntries(
        new URL(req.url ?? "/", "http://localhost").searchParams.entries(),
      );
    const body = BODY_METHODS.has(method) ? await readBody(req) : undefined;

    // The live `res` can't ride the wire — stash it in `resStore` under a minted
    // id and ride only that id, typed, inside `_httpIn`. http-out looks the socket
    // back up by it; the public output carries only a clone-safe snapshot.
    const resId = this.RED.util.generateId();
    resStore.put(resId, res);
    this.send("out", {
      payload: method === "GET" ? query : body,
      req: {
        method,
        url: req.url ?? "",
        headers: req.headers,
        query,
        params: req.params ?? {},
        body,
      },
      _httpIn: { resId },
    });

    // An unanswered request would both hang the client and leak the `resStore`
    // entry, so 504 the abandoned socket after a timeout; and on socket close
    // (normal reply, 504, or client disconnect) clear the timer and drop the
    // store entry — http-out also drops it when it takes the res, so this is the
    // safety net for a request that never reaches an http-out.
    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        res.statusCode = 504;
        res.end();
      }
    }, RESPONSE_TIMEOUT_MS);
    timeout.unref?.();
    res.on("close", () => {
      clearTimeout(timeout);
      resStore.drop(resId);
    });
  }
}

/** Normalize a configured path to a leading-slash route (`hello` → `/hello`). */
function normalizePath(url: string | undefined): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Read + parse the request body by content-type (no body-parser dependency). */
async function readBody(req: ExpressRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body; // already parsed upstream
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return undefined;
  const raw = Buffer.concat(chunks);
  const contentType = String(req.headers["content-type"] ?? "");
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw.toString("utf8"));
    } catch {
      return raw.toString("utf8");
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw.toString("utf8")));
  }
  if (contentType.startsWith("text/")) return raw.toString("utf8");
  return raw;
}
