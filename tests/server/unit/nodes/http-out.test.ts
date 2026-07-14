import { describe, it, expect, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { createNode } from "@bonsae/nrg/test/server/unit";
import HttpOut from "../../../../src/server/nodes/http-out";

function config(overrides: Record<string, unknown> = {}) {
  return {
    name: "",
    statusCode: "",
    headers: { type: "json", value: "{}" },
    ...overrides,
  };
}

/** A fake response that records what the node wrote to it. */
function fakeRes() {
  return {
    writableEnded: false,
    writeHead: vi.fn(),
    end: vi.fn(),
  } as unknown as ServerResponse & {
    writeHead: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
}

describe("http-out", () => {
  it("reads the live res off the private channel and writes the reply", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();

    // The live `res` an http-in stashed on the private channel for this signal.
    await node.receive(
      { _msgid: "r1", output: { payload: { ok: true } } },
      { private: { res } },
    );

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      "Content-Type": "application/json",
    });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it("reads the body from the top level (core-node message)", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();

    // No `output` envelope — e.g. a core function/change node set msg.payload.
    await node.receive(
      { _msgid: "r1", payload: "plain body" },
      {
        private: { res },
      },
    );

    expect(res.end).toHaveBeenCalledWith("plain body");
  });

  it("honors a configured status code", async () => {
    const { node } = await createNode(HttpOut, {
      config: config({ statusCode: "418" }),
    });
    const res = fakeRes();

    await node.receive(
      { _msgid: "r1", output: { payload: "teapot" } },
      { private: { res } },
    );

    expect(res.writeHead).toHaveBeenCalledWith(418, {});
    expect(res.end).toHaveBeenCalledWith("teapot");
  });

  it("does nothing (no throw) when there is no live response on the channel", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    // No channel seeded (orphan message) — the node warns and returns.
    await expect(
      node.receive({ output: { payload: "orphan" } }),
    ).resolves.toBeUndefined();
  });

  it("answers a request exactly once (claims the res off the channel)", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();

    await node.receive(
      { _msgid: "r1", output: { payload: "first" } },
      { private: { res } },
    );
    res.end.mockClear();
    // A second response for the same signal: the res was already claimed
    // (deleted), so `msg[Channels].private.res` is undefined and this is a no-op.
    await node.receive({ _msgid: "r1", output: { payload: "second" } });
    expect(res.end).not.toHaveBeenCalled();
  });
});
