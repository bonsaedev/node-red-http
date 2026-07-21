import { IONode, type Infer, type Input, type Port } from "@bonsae/nrg/server";
import type { ServerResponse } from "node:http";
import { ConfigsSchema } from "../../shared/schemas/http-out";
import { resStore } from "../lib/res-store";

type HttpOutConfig = Infer<typeof ConfigsSchema>;

/**
 * The incoming message. The live `res` to reply on can't ride a wire, so http-in
 * stashed it in the module-local `resStore` and rode only its id inside
 * `_httpIn.resId` — REQUIRED here, so the wire-check reds if a node on the path
 * drops it. The reply body/status/headers ride the accumulating record at the
 * ROOT (`msg.payload` / `msg.statusCode` / `msg.headers`) — whether an upstream
 * nrg node merged them on or a core/injected message set them.
 */
type HttpOutInput = Input<
  Port<{
    payload?: unknown;
    statusCode?: number | string;
    headers?: Record<string, string>;
    _httpIn: { resId: string };
  }>
>;

export default class HttpOut extends IONode<
  HttpOutConfig,
  never,
  HttpOutInput,
  never
> {
  static override readonly type = "http-out";
  static override readonly category = "network";
  static override readonly color = "#e7e7ae";
  static override readonly configSchema = ConfigsSchema;

  override async input(msg: HttpOutInput) {
    // Take the live res from the guarded store by the id http-in rode on the wire —
    // take-once, so a request is answered exactly once (a second http-out for the
    // same id finds nothing). A raw/injected message may lack `_httpIn`, so guard.
    const resId = msg._httpIn?.resId;
    const res = resId ? resStore.take(resId) : undefined;
    if (!res) {
      this.status({ fill: "yellow", shape: "dot", text: "no request" });
      this.warn(
        "http-out: no live response for this id — already answered, " +
          "expired, or not wired from an http-in.",
      );
      return;
    }

    // The record model: fields ride at the ROOT — whether they came from an
    // upstream nrg node's merge or a raw/injected message.
    const src = msg;
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
