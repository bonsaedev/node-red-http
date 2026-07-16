import {
  IONode,
  type Infer,
  type Input,
  type Port,
  Channels,
} from "@bonsae/nrg/server";
import type { ServerResponse } from "node:http";
import { ConfigsSchema } from "../../shared/schemas/http-out";

type Config = Infer<typeof ConfigsSchema>;

/**
 * The incoming message. The live `res` to reply on rides the off-the-wire PRIVATE
 * channel (`msg[Channels].private.res`), which http-in stashed keyed by the
 * message's `_msgid` — nrg carries that id across every node, so the socket is
 * recoverable from anywhere downstream without a threaded-through correlation
 * field. The reply body/status/headers ride `output` (from an nrg node) or the
 * top level (from a core/injected message).
 */
type HttpOutInput = Input<
  Port<{
    payload?: unknown;
    statusCode?: number | string;
    headers?: Record<string, string>;
    output?: {
      payload?: unknown;
      statusCode?: number | string;
      headers?: Record<string, string>;
    };
    [key: string]: unknown;
  }>
>;

export default class HttpOut extends IONode<
  Config,
  never,
  HttpOutInput,
  never
> {
  static override readonly type = "http-out";
  static override readonly category = "network";
  static override readonly color = "#e7e7ae";
  static override readonly configSchema = ConfigsSchema;

  override async input(msg: HttpOutInput) {
    const res = msg[Channels].private.res as ServerResponse | undefined;
    if (!res) {
      this.status({ fill: "yellow", shape: "dot", text: "no request" });
      this.warn(
        "http-out: no live response on the private channel — already " +
          "answered, expired, or not wired from an http-in in this package.",
      );
      return;
    }
    // Claim it up front — a request is answered exactly once, so a second
    // http-out for the same signal finds nothing (like the old registry take).
    delete msg[Channels].private.res;

    // Values ride under `output` when wired from another nrg node; fall back to
    // the top level for a raw/injected message.
    const src = msg.output ?? msg;
    const statusCode =
      Number(src.statusCode ?? this.config.statusCode) ||
      Number(this.config.statusCode) ||
      200;
    const headers = {
      ...(await this.config.headers.resolve(msg)),
      ...(src.headers ?? {}),
    };

    try {
      writeResponse(res, statusCode, headers, src.payload);
      this.status({ fill: "green", shape: "dot", text: `${statusCode}` });
    } catch (error) {
      this.status({ fill: "red", shape: "dot", text: "response failed" });
      this.error(
        `http-out: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/** Serialize + send the reply, defaulting JSON for object payloads. */
function writeResponse(
  res: ServerResponse,
  statusCode: number,
  headers: Record<string, string>,
  body: unknown,
): void {
  const outHeaders: Record<string, string> = { ...headers };
  let payload: string | Buffer;
  if (body === undefined || body === null) {
    payload = "";
  } else if (Buffer.isBuffer(body)) {
    payload = body;
  } else if (typeof body === "object") {
    payload = JSON.stringify(body);
    if (!hasHeader(outHeaders, "content-type")) {
      outHeaders["Content-Type"] = "application/json";
    }
  } else {
    payload = String(body);
  }
  res.writeHead(statusCode, outHeaders);
  res.end(payload);
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === name.toLowerCase(),
  );
}
