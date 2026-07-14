import type { Server } from "node:http";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  IONode,
  type Input,
  type Outputs,
  type Port,
} from "@bonsae/nrg/server";
import {
  startRuntime,
  type Runtime,
} from "@bonsae/nrg/test/server/integration";
import HttpIn from "../../../src/server/nodes/http-in";
import HttpOut from "../../../src/server/nodes/http-out";

/**
 * A minimal intermediate nrg node: reads the payload off the envelope and
 * re-emits it under the DEFAULT carry mode. Used to prove `_msgid` correlation
 * survives an nrg node between http-in and http-out (no trace required) —
 * which only works because nrg carries `_msgid` forward, so the PRIVATE channel
 * holding the live `res` is still recoverable downstream.
 */
type PassthroughInput = Input<Port<{ output: { payload: unknown } }>>;
class Passthrough extends IONode<
  Record<string, never>,
  unknown,
  PassthroughInput,
  Outputs<[Port<{ payload: unknown }>]>
> {
  static override readonly type = "passthrough";
  static override readonly category = "test";
  static override readonly color = "#cccccc";
  override async input(msg: PassthroughInput) {
    this.send(0, { payload: msg.output.payload });
  }
}

/**
 * An nrg node that awaits `msg.output.payload.ms` before re-emitting. Used to
 * deliberately SCRAMBLE completion order across concurrent requests — proving
 * responses are routed by each request's own `_msgid`, never by arrival/completion
 * order.
 */
type DelayInput = Input<
  Port<{ output: { payload: { id?: string; ms?: string } } }>
>;
class Delay extends IONode<
  Record<string, never>,
  unknown,
  DelayInput,
  Outputs<[Port<{ payload: unknown }>]>
> {
  static override readonly type = "delay";
  static override readonly category = "test";
  static override readonly color = "#cccccc";
  override async input(msg: DelayInput) {
    const payload = msg.output.payload;
    await new Promise((r) => setTimeout(r, Number(payload?.ms ?? 0)));
    this.send(0, { payload });
  }
}

/**
 * The real proof of the private-channel design: a live HTTP request flows through
 * Node-RED's actual server → http-in (which parks the live req/res on the
 * off-the-wire PRIVATE channel keyed by the message's `_msgid` and emits only a
 * clone-safe snapshot) → http-out (which reads the socket back off
 * `msg[Channels].private.res` and replies). If the reply reaches the client, the live
 * `res` survived the trip without ever riding a wire.
 */
describe("http-in → http-out (real HTTP round-trip)", () => {
  let runtime: Runtime;
  let baseUrl: string;

  beforeAll(async () => {
    runtime = await startRuntime({
      nodes: [HttpIn, HttpOut, Passthrough, Delay],
      // The headless harness disables user routes by default — turn them on.
      settings: { httpNodeRoot: "/" },
    });
    const mod = (await import("node-red")) as unknown as {
      default?: unknown;
    };
    const RED = (mod.default ?? mod) as {
      server?: Server & { on: (e: string, h: unknown) => void };
      httpNode?: unknown;
    };
    // The harness starts a bare server with no request handler; mount Node-RED's
    // user-route app so http-in's registered routes are actually served.
    if (RED.server && RED.httpNode) {
      RED.server.on("request", RED.httpNode);
    }
    const address = RED.server?.address();
    if (!address || typeof address === "string") {
      throw new Error("could not resolve the Node-RED server port");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await runtime?.stop();
  });

  it("GET: the reply reaches the live socket (query echoed as JSON)", async () => {
    const flow = runtime.flow();
    flow.addNode(HttpIn, { method: "get", url: "/hello" }).wire(
      flow.addNode(HttpOut, {
        statusCode: "",
        headers: { type: "json", value: "{}" },
      }),
    );
    await flow.deploy();

    const res = await fetch(`${baseUrl}/hello?name=world`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "world" });
  });

  it("correlates through an intermediate nrg node (via _msgid, no trace)", async () => {
    // http-in → passthrough (an nrg node, default carry mode) → http-out.
    // This works ONLY because nrg preserves `_msgid` across the node — the whole
    // point of the fix. The passthrough re-emits the query under the envelope.
    const flow = runtime.flow();
    const inNode = flow.addNode(HttpIn, { method: "get", url: "/via-nrg" });
    const mid = flow.addNode(Passthrough, {});
    const respNode = flow.addNode(HttpOut, {
      statusCode: "",
      headers: { type: "json", value: "{}" },
    });
    inNode.wire(mid);
    mid.wire(respNode);
    await flow.deploy();

    const res = await fetch(`${baseUrl}/via-nrg?name=world`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "world" });
  });

  it("concurrent requests never cross responses (each keyed by its own _msgid)", async () => {
    const flow = runtime.flow();
    const inNode = flow.addNode(HttpIn, { method: "get", url: "/concurrent" });
    const delay = flow.addNode(Delay, {});
    const respNode = flow.addNode(HttpOut, {
      statusCode: "",
      headers: { type: "json", value: "{}" },
    });
    inNode.wire(delay);
    delay.wire(respNode);
    await flow.deploy();

    const N = 8;
    // REVERSED delays: request 0 waits longest, request N-1 shortest — so the
    // completion order is the opposite of the arrival order. A FIFO/keyless
    // registry would answer request 0 with request (N-1)'s body. `_msgid` keying
    // must give each caller exactly its own `id` back.
    const bodies = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        fetch(`${baseUrl}/concurrent?id=${i}&ms=${(N - i) * 20}`).then(
          (r) => r.json() as Promise<{ id: string; ms: string }>,
        ),
      ),
    );

    // Every caller got ITS OWN id back (a perfect bijection, no crossing).
    expect(bodies.map((b) => b.id)).toEqual(
      Array.from({ length: N }, (_, i) => String(i)),
    );
  });

  it("POST: parses the JSON body and honors the configured status code", async () => {
    const flow = runtime.flow();
    flow.addNode(HttpIn, { method: "post", url: "/echo" }).wire(
      flow.addNode(HttpOut, {
        statusCode: "201",
        headers: { type: "json", value: "{}" },
      }),
    );
    await flow.deploy();

    const res = await fetch(`${baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hi: "there" }),
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ hi: "there" });
  });

  it("404s a path with no matching http-in route", async () => {
    const flow = runtime.flow();
    flow.addNode(HttpIn, { method: "get", url: "/present" });
    await flow.deploy();

    const res = await fetch(`${baseUrl}/absent`);
    expect(res.status).toBe(404);
  });
});
