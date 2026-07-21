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

/**
 * A parsed `multipart/form-data` file part, lowered to clone-safe plain data: the
 * bytes live in a Node `Buffer`, never a `File`/`Blob`. This rides under
 * `httpIn.request` (a normal field, so Node-RED deep-clones it with
 * `lodash.clonedeep` on every fan-out) — where a `Buffer` is copied faithfully but
 * a `Blob` would collapse to an empty `{}`. Buffer is also what the rest of
 * Node-RED speaks (debug sidebar, context storage), so it stays inspectable.
 */
type UploadedFile = {
  field: string;
  filename: string;
  type: string;
  size: number;
  data: Buffer;
};

/** A plain, clone-safe snapshot of the request for downstream nodes to read. */
type RequestSnapshot = {
  method: string;
  url: string;
  headers: IncomingMessage["headers"];
  query: Record<string, unknown>;
  params: Record<string, string>;
  body: unknown;
  /** Uploaded files — present only on a `multipart/form-data` request. */
  files?: UploadedFile[];
};

/**
 * Emitted per request. The output is split by a leading-underscore convention:
 * `httpIn` (public) holds the `request` snapshot — flow authors read and reshape
 * it freely; `_httpIn` (private) holds the internal `resId` — the correlation
 * handle a flow author must NOT touch, or response routing breaks. We deliberately
 * do NOT use Node-RED's `msg.req`/`msg.res` (those are the live Express objects,
 * clone-exempt special cases in Node-RED's message clone). The live `res` can't
 * ride a wire (it wouldn't survive a fan-out clone), so http-in stashes it in the
 * module-local `resStore` under `resId` and rides only the id; http-out reads
 * `_httpIn.resId` back and looks the socket up. `_httpIn.resId` is a declared,
 * required field, so the wire-check reds http-out if a node on the path drops it.
 */
type HttpInOutputs = Outputs<{
  out: Port<{
    payload: unknown;
    httpIn: { request: RequestSnapshot };
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
    const { body, files } = BODY_METHODS.has(method)
      ? await parseBody(req)
      : { body: undefined, files: undefined };

    // The live `res` can't ride the wire — stash it in `resStore` under a minted
    // id and ride only that id inside private `_httpIn`. http-out looks the socket
    // back up by it. Public `httpIn.request` carries the clone-safe snapshot for
    // flow authors. Nothing lands on `msg.req`/`msg.res` — we don't touch
    // Node-RED's live-object convention.
    const resId = this.RED.util.generateId();
    resStore.put(resId, res);
    this.send("out", {
      payload: method === "GET" ? query : body,
      httpIn: {
        request: {
          method,
          url: req.url ?? "",
          headers: req.headers,
          query,
          params: req.params ?? {},
          body,
          ...(files ? { files } : {}),
        },
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

/**
 * Read + parse the request body, no `body-parser`/`multer` dependency. We wrap
 * the raw bytes in a WHATWG `Response` — the same web primitive the http-request
 * node reads its fetch reply from — and let the platform parse them. That gives
 * us `multipart/form-data` (file uploads) and `application/x-www-form-urlencoded`
 * for free via `Response.formData()`; JSON, text, and unknown binary fall out of
 * the same object. Files are lowered to clone-safe `{ ...Buffer }` descriptors so
 * they survive Node-RED's message clone on a fan-out.
 */
async function parseBody(
  req: ExpressRequest,
): Promise<{ body: unknown; files?: UploadedFile[] }> {
  if (req.body !== undefined) return { body: req.body }; // parsed upstream
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return { body: undefined };
  const raw = Buffer.concat(chunks);
  const contentType = String(req.headers["content-type"] ?? "");
  const res = new Response(raw, { headers: { "content-type": contentType } });

  if (contentType.includes("application/json")) {
    try {
      return { body: await res.json() };
    } catch {
      return { body: raw.toString("utf8") }; // not JSON — hand back raw text
    }
  }
  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await res.formData();
    const fields: Record<string, unknown> = {};
    const files: UploadedFile[] = [];
    for (const [name, value] of form) {
      if (typeof value === "string") {
        fields[name] = value;
      } else {
        files.push({
          field: name,
          filename: value.name,
          type: value.type,
          size: value.size,
          data: Buffer.from(await value.arrayBuffer()),
        });
      }
    }
    return files.length ? { body: fields, files } : { body: fields };
  }
  if (contentType.startsWith("text/")) return { body: await res.text() };
  return { body: raw }; // unknown content-type → raw Buffer
}
