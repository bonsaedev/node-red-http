import {
  IONode,
  type Infer,
  type Outputs,
  type Port,
} from "@bonsae/nrg/server";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ConfigsSchema } from "../../shared/schemas/http-in";

type Config = Infer<typeof ConfigsSchema>;

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
 * Emitted per request. The live `res` rides the off-the-wire PRIVATE channel
 * (package-scoped, keyed by the message's `_msgid`) — never on the serialized
 * message — so http-out reads it back with `msg[Channels].private.res`. The
 * public output is a clone-safe request snapshot for downstream nodes.
 */
type HttpInOutputs = Outputs<{
  out: Port<{
    payload: unknown;
    req: RequestSnapshot;
  }>;
}>;

/** 504 an unanswered request after this long so an abandoned socket never hangs.
 * The nrg channel store frees its own reference on a TTL, but the resource (the
 * socket) owns its release — so http-in ends it. */
const RESPONSE_TIMEOUT_MS = 5 * 60_000;

/** The Express app RED.httpNode exposes for user routes (loosely typed). */
interface HttpApp {
  get(path: string, ...handlers: unknown[]): void;
  post(path: string, ...handlers: unknown[]): void;
  put(path: string, ...handlers: unknown[]): void;
  delete(path: string, ...handlers: unknown[]): void;
  patch(path: string, ...handlers: unknown[]): void;
  _router?: {
    stack: Array<{
      route?: { path?: string; methods?: Record<string, boolean> };
    }>;
  };
}

/** Express-decorated request (query/params/body populated by its middleware). */
type ExpressRequest = IncomingMessage & {
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  body?: unknown;
};

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default class HttpIn extends IONode<
  Config,
  unknown,
  never,
  HttpInOutputs
> {
  static override readonly type = "http-in";
  static override readonly category = "network";
  static override readonly color = "#e7e7ae";
  static override readonly configSchema = ConfigsSchema;

  #app?: HttpApp;
  #url?: string;
  #method?: string;

  override async created() {
    const method = (this.config.method || "get").toLowerCase();
    const url = normalizePath(this.config.url);
    if (!url) {
      this.status({ fill: "red", shape: "dot", text: "missing path" });
      throw new Error("http-in: no url path configured");
    }

    const app = this.RED.httpNode as unknown as HttpApp | undefined;
    const register = app?.[method as keyof HttpApp] as
      ((path: string, ...handlers: unknown[]) => void) | undefined;
    if (typeof register !== "function") {
      this.status({ fill: "red", shape: "dot", text: "no HTTP server" });
      throw new Error("http-in: RED.httpNode is not available");
    }

    register.call(app, url, (req: IncomingMessage, res: ServerResponse) => {
      void this.#onRequest(req as ExpressRequest, res);
    });

    this.#app = app;
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

    // The live `res` rides the PRIVATE channel — off the wire, scoped to this
    // package, keyed by the `_msgid` nrg mints for this source send and carries
    // forward. http-out reads it back with `msg[Channels].private.res` from
    // anywhere downstream; the public output carries only a clone-safe snapshot.
    this.send(
      "out",
      {
        payload: method === "GET" ? query : body,
        req: {
          method,
          url: req.url ?? "",
          headers: req.headers,
          query,
          params: req.params ?? {},
          body,
        },
      },
      { private: { res } },
    );

    // The socket owns its own release: end an unanswered request with 504 so an
    // abandoned request never hangs the client. Cleared once the reply is sent.
    const timeout = setTimeout(() => {
      if (!res.writableEnded) {
        res.statusCode = 504;
        res.end();
      }
    }, RESPONSE_TIMEOUT_MS);
    timeout.unref?.();
    res.on("close", () => clearTimeout(timeout));
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
