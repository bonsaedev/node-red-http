import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNode } from "@bonsae/nrg/test/server/unit";
import HttpRequest from "../../../../src/server/nodes/http-request";

/** Minimal config with sensible defaults; override per test. */
function config(overrides: Record<string, unknown> = {}) {
  return {
    name: "",
    method: "GET",
    url: { type: "str", value: "https://example.com/api" },
    ret: "txt",
    paytoqs: "ignore",
    headers: { type: "json", value: "{}" },
    authType: "",
    persist: false,
    insecureHTTPParser: false,
    senderr: false,
    ...overrides,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("http-request", () => {
  it("performs a GET and returns the body as text", async () => {
    // A hand-built Response has an empty `url`; only fetch populates it, so stamp
    // it to verify the node maps res.url → output.responseUrl.
    const res = new Response("hello world", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    Object.defineProperty(res, "url", { value: "https://example.com/api" });
    fetchMock.mockResolvedValue(res);

    const { node } = await createNode(HttpRequest, { config: config() });
    await node.receive({ payload: {} });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/api");
    expect(init.method).toBe("GET");

    const out = node.sent()[0][0].output;
    expect(out.statusCode).toBe(200);
    expect(out.payload).toBe("hello world");
    expect(out.responseUrl).toBe("https://example.com/api");
  });

  it("parses the body as JSON when ret is 'obj'", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 7, ok: true }), { status: 200 }),
    );

    const { node } = await createNode(HttpRequest, {
      config: config({ ret: "obj" }),
    });
    await node.receive({ payload: {} });

    expect(node.sent()[0][0].output.payload).toEqual({ id: 7, ok: true });
  });

  it("reads the method from msg when method is 'use'", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    const { node } = await createNode(HttpRequest, {
      config: config({ method: "use" }),
    });
    await node.receive({ payload: {}, method: "post" });

    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("sends msg.payload as a JSON body on POST", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));

    const { node } = await createNode(HttpRequest, {
      config: config({ method: "POST" }),
    });
    await node.receive({ payload: { hello: "world" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(JSON.stringify({ hello: "world" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("attaches a Basic auth header from credentials", async () => {
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    const { node } = await createNode(HttpRequest, {
      config: config({ authType: "basic" }),
      credentials: { user: "alice", password: "s3cret", bearerToken: "" },
    });
    await node.receive({ payload: {} });

    const expected = `Basic ${Buffer.from("alice:s3cret").toString("base64")}`;
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(expected);
  });

  it("attaches a Bearer token from credentials", async () => {
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    const { node } = await createNode(HttpRequest, {
      config: config({ authType: "bearer" }),
      credentials: { user: "", password: "", bearerToken: "tok-123" },
    });
    await node.receive({ payload: {} });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer tok-123",
    );
  });

  it("merges configured headers with msg.headers (msg wins)", async () => {
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    const { node } = await createNode(HttpRequest, {
      config: config({
        headers: { type: "json", value: '{"X-A":"1","X-B":"2"}' },
      }),
    });
    await node.receive({ payload: {}, headers: { "X-B": "override" } });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["X-A"]).toBe("1");
    expect(headers["X-B"]).toBe("override");
  });

  it("appends msg.payload to the query string when paytoqs is 'query'", async () => {
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    const { node } = await createNode(HttpRequest, {
      config: config({ paytoqs: "query" }),
    });
    await node.receive({ payload: { q: "term", page: 2 } });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://example.com/api?q=term&page=2",
    );
  });

  it("routes a request failure to the output when senderr is on", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const { node } = await createNode(HttpRequest, {
      config: config({ senderr: true }),
    });
    await node.receive({ payload: {} });

    const out = node.sent()[0][0].output;
    expect(out.statusCode).toBe(0);
    expect(out.payload).toBe("ECONNREFUSED");
  });

  it("throws on failure when senderr is off", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    const { node } = await createNode(HttpRequest, { config: config() });
    await expect(node.receive({ payload: {} })).rejects.toThrow("boom");
    expect(node.sent()).toHaveLength(0);
  });
});
