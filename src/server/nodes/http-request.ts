import {
  IONode,
  type Infer,
  type Input,
  type Outputs,
  type Port,
} from "@bonsae/nrg/server";
import {
  ConfigsSchema,
  CredentialsSchema,
} from "../../shared/schemas/http-request";

type Config = Infer<typeof ConfigsSchema>;
type Credentials = Infer<typeof CredentialsSchema>;

/**
 * Incoming message. Like the core node, a handful of msg properties override the
 * configured values at runtime (msg.method / msg.url / msg.headers / msg.payload).
 */
type HttpRequestInput = Input<
  Port<{
    payload?: unknown;
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  }>
>;

/**
 * The response, delivered under `msg.output` (nrg's envelope convention). `payload`
 * is a string (ret=txt), a Buffer (ret=bin), or parsed JSON (ret=obj).
 */
type HttpRequestOutputs = Outputs<{
  out: Port<{
    statusCode: number;
    headers: Record<string, string>;
    payload: string | Buffer | unknown;
    responseUrl: string;
  }>;
}>;

/** Methods that never carry a request body. */
const BODYLESS = new Set(["GET", "HEAD"]);

export default class HttpRequest extends IONode<
  Config,
  Credentials,
  HttpRequestInput,
  HttpRequestOutputs
> {
  static override readonly type = "http-request";
  static override readonly category = "network";
  static override readonly color = "#e7e7ae";
  static override readonly configSchema = ConfigsSchema;
  static override readonly credentialsSchema = CredentialsSchema;

  override async input(msg: HttpRequestInput) {
    const method = (
      this.config.method === "use" ? (msg.method ?? "GET") : this.config.method
    ).toUpperCase();

    // URL: msg.url wins, else the configured typed input, then {{mustache}} it.
    const configuredUrl = await this.config.url.resolve(msg);
    let url = renderMustache(
      String(msg.url ?? configuredUrl ?? ""),
      msg,
    ).trim();
    if (!url) {
      throw new Error("No url specified");
    }
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    // Headers: configured headers first, then msg.headers overrides.
    const headers: Record<string, string> = {
      ...normalizeHeaders(await this.config.headers.resolve(msg)),
      ...normalizeHeaders(msg.headers),
    };
    this.applyAuth(headers);

    // Payload → query string or body, per `paytoqs`.
    let body: string | Buffer | Uint8Array | undefined;
    const hasPayload = msg.payload !== undefined && msg.payload !== null;
    if (
      this.config.paytoqs === "query" &&
      hasPayload &&
      typeof msg.payload === "object"
    ) {
      const u = new URL(url);
      for (const [key, value] of Object.entries(
        msg.payload as Record<string, unknown>,
      )) {
        u.searchParams.append(key, String(value));
      }
      url = u.toString();
    } else if (
      hasPayload &&
      (this.config.paytoqs === "body" ||
        (this.config.paytoqs === "ignore" && !BODYLESS.has(method)))
    ) {
      body = this.serializeBody(msg.payload, headers);
    }

    this.status({ fill: "blue", shape: "dot", text: `${method} ...` });

    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        keepalive: this.config.persist,
      });

      const payload = await this.readBody(res);
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      this.status({
        fill: res.ok ? "green" : "yellow",
        shape: "dot",
        text: `${res.status}`,
      });
      this.send("out", {
        statusCode: res.status,
        headers: responseHeaders,
        payload,
        responseUrl: res.url,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.status({ fill: "red", shape: "dot", text: message });
      // `senderr`: surface the failure as a normal message instead of throwing.
      if (this.config.senderr) {
        this.send("out", {
          statusCode: 0,
          headers: {},
          payload: message,
          responseUrl: url,
        });
        return;
      }
      throw error instanceof Error ? error : new Error(message);
    }
  }

  /** Attach the Authorization header for the configured auth scheme. */
  private applyAuth(headers: Record<string, string>): void {
    const creds = this.credentials;
    switch (this.config.authType) {
      case "basic": {
        const token = Buffer.from(
          `${creds?.user ?? ""}:${creds?.password ?? ""}`,
        ).toString("base64");
        headers.Authorization = `Basic ${token}`;
        break;
      }
      case "bearer": {
        if (creds?.bearerToken) {
          headers.Authorization = `Bearer ${creds.bearerToken}`;
        }
        break;
      }
      case "digest": {
        // Digest is a 401-challenge/response handshake fetch doesn't do natively.
        throw new Error(
          "digest authentication is not supported yet — use basic or bearer",
        );
      }
    }
  }

  /** Turn msg.payload into a fetch body, defaulting JSON for plain objects. */
  private serializeBody(
    payload: unknown,
    headers: Record<string, string>,
  ): string | Buffer | Uint8Array {
    if (
      typeof payload === "string" ||
      payload instanceof Buffer ||
      payload instanceof Uint8Array
    ) {
      return payload;
    }
    if (!hasHeader(headers, "content-type")) {
      headers["Content-Type"] = "application/json";
    }
    return JSON.stringify(payload);
  }

  /** Read the response body in the shape `ret` asks for. */
  private async readBody(res: Response): Promise<string | Buffer | unknown> {
    if (this.config.ret === "bin") {
      return Buffer.from(await res.arrayBuffer());
    }
    if (this.config.ret === "obj") {
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return text; // not JSON — hand back the raw text rather than fail
      }
    }
    return res.text();
  }
}

/** Substitute `{{a.b.c}}` tags from the message (empty string when unresolved). */
function renderMustache(template: string, msg: object): string {
  return template.replace(/{{\s*([\w.$]+)\s*}}/g, (_match, path: string) => {
    const value = path
      .split(".")
      .reduce<unknown>(
        (acc, key) =>
          acc == null ? undefined : (acc as Record<string, unknown>)[key],
        msg,
      );
    return value == null ? "" : String(value);
  });
}

function normalizeHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined && val !== null) out[key] = String(val);
  }
  return out;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
}
