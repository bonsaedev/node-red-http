import { describe, it, expect, vi } from "vitest";
import type { ServerResponse } from "node:http";
import { createNode } from "@bonsae/nrg/test/server/unit";
import HttpOut from "../../../../src/server/nodes/http-out";
import { resStore } from "../../../../src/server/lib/res-store";

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

/** Stash a live res in the guarded store the way http-in does, and hand back the
 *  id that rides the wire on `_httpIn.resId`. */
function stashRes(res: ServerResponse, id = "r1"): string {
  resStore.put(id, res);
  return id;
}

describe("http-out", () => {
  it("takes the live res from the store by its id and writes the reply", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();
    const resId = stashRes(res);

    await node.receive({ payload: { ok: true }, _httpIn: { resId } });

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      "Content-Type": "application/json",
    });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it("reads the body from the top level (core-node message)", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();
    const resId = stashRes(res);

    // A raw message — e.g. a core function/change node set msg.payload.
    await node.receive({ payload: "plain body", _httpIn: { resId } });

    expect(res.end).toHaveBeenCalledWith("plain body");
  });

  it("honors a configured status code", async () => {
    const { node } = await createNode(HttpOut, {
      config: config({ statusCode: "418" }),
    });
    const res = fakeRes();
    const resId = stashRes(res);

    await node.receive({ payload: "teapot", _httpIn: { resId } });

    expect(res.writeHead).toHaveBeenCalledWith(418, {});
    expect(res.end).toHaveBeenCalledWith("teapot");
  });

  it("does nothing (no throw) when there is no live response for the id", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    // The id has no stashed res (orphan / already answered / expired).
    await expect(
      node.receive({ payload: "orphan", _httpIn: { resId: "gone" } }),
    ).resolves.toBeUndefined();
  });

  it("answers a request exactly once (takes the res from the store)", async () => {
    const { node } = await createNode(HttpOut, { config: config() });
    const res = fakeRes();
    const resId = stashRes(res);

    await node.receive({ payload: "first", _httpIn: { resId } });
    res.end.mockClear();
    // A second response for the same id: the res was already taken, so this is a
    // no-op (nothing left in the store).
    await node.receive({ payload: "second", _httpIn: { resId } });
    expect(res.end).not.toHaveBeenCalled();
  });
});
