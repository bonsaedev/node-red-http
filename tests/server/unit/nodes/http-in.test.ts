import { describe, it, expect, vi, afterEach } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createNode } from "@bonsae/nrg/test/server/unit";
import type { MockRED } from "@bonsae/nrg/test/server/unit";
import HttpIn from "../../../../src/server/nodes/http-in";
import { resStore } from "../../../../src/server/lib/res-store";

function config(overrides: Record<string, unknown> = {}) {
  return { name: "", method: "get", url: "/hello", ...overrides };
}

/**
 * A fake Express request: an async-iterable of body chunks plus the fields
 * `#onRequest` reads. No `body` property is set, so `parseBody` parses the raw
 * chunks itself (as it does when no upstream middleware pre-parsed the body).
 */
function fakeReq(
  opts: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    query?: Record<string, unknown>;
    params?: Record<string, string>;
    raw?: string | Buffer;
  } = {},
): IncomingMessage {
  const { raw } = opts;
  const chunks =
    raw === undefined ? [] : [Buffer.isBuffer(raw) ? raw : Buffer.from(raw)];
  const req = {
    method: opts.method ?? "GET",
    url: opts.url ?? "/",
    headers: opts.headers ?? {},
    query: opts.query,
    params: opts.params,
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) yield c;
    },
  };
  return req as unknown as IncomingMessage;
}

/** A fake response that records what the 504 timer writes to it. */
function fakeRes() {
  const res = {
    writableEnded: false,
    statusCode: 200,
    end: vi.fn(() => {
      res.writableEnded = true;
    }),
    on: vi.fn(),
  };
  return res as unknown as ServerResponse & {
    end: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    statusCode: number;
    writableEnded: boolean;
  };
}

/** The request handler http-in registered on `RED.httpNode.<method>` in
 *  `created()` — the mock records it, so tests can drive a request through it. */
function captureHandler(
  RED: MockRED,
): ((req: IncomingMessage, res: ServerResponse) => void) | undefined {
  for (const m of ["get", "post", "put", "delete"] as const) {
    const calls = vi.mocked(RED.httpNode[m]).mock.calls;
    if (calls.length) {
      return calls[0][1] as (req: IncomingMessage, res: ServerResponse) => void;
    }
  }
  return undefined;
}

async function deploy(cfg: Record<string, unknown> = config()) {
  const { node, RED, error } = await createNode(HttpIn, { config: cfg });
  return { node, RED, error, handler: captureHandler(RED) };
}

/** `#onRequest` is fire-and-forget (the route handler returns void). Invoke it
 *  and flush the microtask queue so `readBody` + `send` complete. */
async function driveRequest(
  handler: ((req: IncomingMessage, res: ServerResponse) => void) | undefined,
  req: IncomingMessage,
  res: ServerResponse,
) {
  handler!(req, res);
  await new Promise((r) => setImmediate(r));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("http-in", () => {
  describe("created(): route registration", () => {
    it("registers the normalized path and shows a green status", async () => {
      const { node, RED, error } = await deploy(
        config({ method: "get", url: "hello" }),
      );

      expect(error).toBeUndefined();
      const get = vi.mocked(RED.httpNode.get);
      expect(get).toHaveBeenCalledTimes(1);
      // "hello" is normalized to a leading-slash route.
      expect(get.mock.calls[0][0]).toBe("/hello");
      expect(get.mock.calls[0][1]).toBeTypeOf("function");
      expect(node.statuses().at(-1)).toMatchObject({
        fill: "green",
        text: "GET /hello",
      });
    });

    it.each(["get", "post", "put", "delete"] as const)(
      "routes to the %s Express matcher (and no other)",
      async (method) => {
        const { RED } = await deploy(config({ method, url: "/x" }));

        expect(vi.mocked(RED.httpNode[method])).toHaveBeenCalledWith(
          "/x",
          expect.any(Function),
        );
        for (const other of ["get", "post", "put", "delete"] as const) {
          if (other !== method) {
            expect(vi.mocked(RED.httpNode[other])).not.toHaveBeenCalled();
          }
        }
      },
    );

    it("errors 'no url path configured' with a red status on an empty path", async () => {
      const { node, error } = await deploy(config({ url: "   " }));

      expect((error as Error)?.message).toMatch(/no url path configured/);
      // The node sets its specific "missing path" status before throwing; the base
      // class then stamps a generic "created() failed" status on the rejection, so
      // assert "missing path" was set (its contract), not that it is the last one.
      expect(
        node
          .statuses()
          .some((s) => s.fill === "red" && s.text === "missing path"),
      ).toBe(true);
      // No route was registered.
      const { RED } = await deploy(config({ url: "" }));
      expect(vi.mocked(RED.httpNode.get)).not.toHaveBeenCalled();
    });
  });

  describe("request handling", () => {
    it("GET: emits the query as payload + a request snapshot, res stashed in the guarded store", async () => {
      const { node, handler } = await deploy(
        config({ method: "get", url: "/hello" }),
      );
      const res = fakeRes();

      await driveRequest(
        handler,
        fakeReq({
          method: "GET",
          url: "/hello?name=world",
          headers: { "x-test": "1" },
        }),
        res,
      );

      const frame = node.sent()[0][0];
      expect(frame.payload).toEqual({ name: "world" });
      // The public request snapshot rides under `httpIn.request` (never msg.req).
      expect(frame.httpIn.request).toMatchObject({
        method: "GET",
        url: "/hello?name=world",
        query: { name: "world" },
        headers: { "x-test": "1" },
        body: undefined,
      });
      // The live socket is stashed in the guarded store under the emitted id,
      // never on the public wire; the id rides on private `_httpIn.resId`.
      expect(frame._httpIn.resId).toBeTypeOf("string");
      expect(resStore.take(frame._httpIn.resId)).toBe(res);
    });

    it("namespaces output as public `httpIn` + private `_httpIn`, with nothing on msg.req/res", async () => {
      const { node, handler } = await deploy(
        config({ method: "post", url: "/shape" }),
      );

      await driveRequest(
        handler,
        fakeReq({
          method: "POST",
          url: "/shape",
          headers: { "content-type": "application/json" },
          raw: JSON.stringify({ a: 1 }),
        }),
        fakeRes(),
      );

      const frame = node.sent()[0][0];
      // Public: the request snapshot a flow author reads/reshapes freely.
      expect(frame.httpIn.request.body).toEqual({ a: 1 });
      // Private (leading `_`): the internal socket-correlation id, hands off.
      expect(frame._httpIn.resId).toBeTypeOf("string");
      // We deliberately do NOT ride Node-RED's live-object convention.
      expect("req" in frame).toBe(false);
      expect("res" in frame).toBe(false);
    });

    it("POST: reads the parsed JSON body as payload", async () => {
      const { node, handler } = await deploy(
        config({ method: "post", url: "/echo" }),
      );

      await driveRequest(
        handler,
        fakeReq({
          method: "POST",
          url: "/echo",
          headers: { "content-type": "application/json" },
          raw: JSON.stringify({ hi: "there" }),
        }),
        fakeRes(),
      );

      const frame = node.sent()[0][0];
      expect(frame.payload).toEqual({ hi: "there" });
      expect(frame.httpIn.request.body).toEqual({ hi: "there" });
    });

    it("uses req.query when Express already populated it (no re-parse)", async () => {
      const { node, handler } = await deploy(
        config({ method: "get", url: "/q" }),
      );

      await driveRequest(
        handler,
        fakeReq({ method: "GET", url: "/q?ignored=1", query: { a: "b" } }),
        fakeRes(),
      );

      // req.query wins over the URL search params.
      expect(node.sent()[0][0].payload).toEqual({ a: "b" });
    });
  });

  describe("body parsing (POST)", () => {
    async function bodyOf(headers: Record<string, string>, raw?: string) {
      const { node, handler } = await deploy(
        config({ method: "post", url: "/b" }),
      );
      await driveRequest(
        handler,
        fakeReq({ method: "POST", url: "/b", headers, raw }),
        fakeRes(),
      );
      return node.sent()[0][0].payload;
    }

    it("parses application/json", async () => {
      expect(
        await bodyOf({ "content-type": "application/json" }, '{"a":1}'),
      ).toEqual({
        a: 1,
      });
    });

    it("falls back to the raw string on invalid JSON", async () => {
      expect(
        await bodyOf({ "content-type": "application/json" }, "{oops"),
      ).toBe("{oops");
    });

    it("parses application/x-www-form-urlencoded into an object", async () => {
      expect(
        await bodyOf(
          { "content-type": "application/x-www-form-urlencoded" },
          "a=1&b=two",
        ),
      ).toEqual({ a: "1", b: "two" });
    });

    it("returns text/* as a string", async () => {
      expect(await bodyOf({ "content-type": "text/plain" }, "hello")).toBe(
        "hello",
      );
    });

    it("returns an unknown content-type as a raw Buffer", async () => {
      const payload = await bodyOf(
        { "content-type": "application/octet-stream" },
        "raw-bytes",
      );
      expect(Buffer.isBuffer(payload)).toBe(true);
      expect((payload as Buffer).toString()).toBe("raw-bytes");
    });

    it("emits undefined for an empty body", async () => {
      expect(
        await bodyOf({ "content-type": "application/json" }),
      ).toBeUndefined();
    });
  });

  describe("multipart/form-data", () => {
    /** Serialize fields + files into real multipart bytes with the web
     *  FormData/Request the platform ships — the exact wire format a browser
     *  sends — then drive them through the node. */
    async function multipart(build: (fd: FormData) => void) {
      const fd = new FormData();
      build(fd);
      const encoded = new Request("http://x", { method: "POST", body: fd });
      const raw = Buffer.from(await encoded.arrayBuffer());
      const contentType = encoded.headers.get("content-type") ?? "";
      const { node, handler } = await deploy(
        config({ method: "post", url: "/upload" }),
      );
      await driveRequest(
        handler,
        fakeReq({
          method: "POST",
          url: "/upload",
          headers: { "content-type": contentType },
          raw,
        }),
        fakeRes(),
      );
      return node.sent()[0][0];
    }

    it("parses text fields into payload (no files)", async () => {
      const frame = await multipart((fd) => {
        fd.set("name", "world");
        fd.set("count", "2");
      });
      expect(frame.payload).toEqual({ name: "world", count: "2" });
      expect(frame.httpIn.request.files).toBeUndefined();
    });

    it("lowers uploaded files to clone-safe Buffer descriptors under req.files", async () => {
      const frame = await multipart((fd) => {
        fd.set("note", "hi");
        fd.set(
          "doc",
          new File([Buffer.from("file-bytes")], "a.txt", {
            type: "text/plain",
          }),
        );
      });
      // Non-file fields still land in payload...
      expect(frame.payload).toEqual({ note: "hi" });
      // ...and files ride on httpIn.request.files as { ...Buffer } — never a File/Blob.
      expect(frame.httpIn.request.files).toHaveLength(1);
      const file = frame.httpIn.request.files![0];
      expect(file).toMatchObject({
        field: "doc",
        filename: "a.txt",
        type: "text/plain",
        size: 10,
      });
      expect(Buffer.isBuffer(file.data)).toBe(true);
      expect(file.data.toString()).toBe("file-bytes");
    });
  });

  describe("closed(): route removal on redeploy", () => {
    it("splices only its own route off the Express router stack", async () => {
      const { node, RED } = await deploy(
        config({ method: "get", url: "/hello" }),
      );

      // The mock httpNode has no `_router`; attach one (the same shape Express
      // keeps) with our route plus an unrelated one. `#app` holds this exact
      // object, so closed() sees it.
      const other = { route: { path: "/other", methods: { get: true } } };
      const ours = { route: { path: "/hello", methods: { get: true } } };
      const stack = [other, ours];
      Object.assign(RED.httpNode, { _router: { stack } });

      await node.close(true);

      // Our route removed in place; the unrelated one untouched.
      expect(stack).toEqual([other]);
    });

    it("is a no-op (no throw) when the router has no stack", async () => {
      const { node } = await deploy();
      await expect(node.close(true)).resolves.toBeUndefined();
    });
  });

  describe("504 on an unanswered request", () => {
    it("504s the socket after the timeout when nothing replied", async () => {
      const { handler } = await deploy(config({ method: "get", url: "/slow" }));
      vi.useFakeTimers();
      const res = fakeRes();

      // GET's send path is synchronous, so no async flush is needed here.
      handler!(fakeReq({ method: "GET", url: "/slow" }), res);

      expect(res.end).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5 * 60_000);
      expect(res.statusCode).toBe(504);
      expect(res.end).toHaveBeenCalledOnce();
    });

    it("cancels the timeout once the response closes", async () => {
      const { handler } = await deploy(
        config({ method: "get", url: "/slow2" }),
      );
      vi.useFakeTimers();
      const res = fakeRes();

      handler!(fakeReq({ method: "GET", url: "/slow2" }), res);
      const closeHandler = vi
        .mocked(res.on)
        .mock.calls.find(([event]) => event === "close")?.[1] as () => void;
      expect(closeHandler).toBeTypeOf("function");

      closeHandler(); // socket closed (reply already sent) → timer cleared
      vi.advanceTimersByTime(5 * 60_000);
      expect(res.end).not.toHaveBeenCalled();
    });
  });
});
