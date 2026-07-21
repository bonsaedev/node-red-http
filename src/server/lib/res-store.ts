import type { ServerResponse } from "node:http";

/**
 * The live `res` sockets, GUARDED behind this module. A socket can't ride the wire
 * (it wouldn't survive a fan-out clone), so http-in stashes it here under an id and
 * rides only that id on `_httpIn.resId` — visible on the message for inspection,
 * while the socket itself stays off the wire. Keeping the Map private means a socket
 * is only ever reachable by `put` (stash) then `take` (claim-once) by its id — no
 * iteration, no bulk access, no way to read someone else's live socket off the wire.
 */
const sockets = new Map<string, ServerResponse>();

/** Stash a live socket under `id` (the id http-in rides on `_httpIn.resId`). */
function put(id: string, res: ServerResponse): void {
  sockets.set(id, res);
}

/** Take-once: return the socket and drop it, so a request is answered exactly once. */
function take(id: string): ServerResponse | undefined {
  const res = sockets.get(id);
  sockets.delete(id);
  return res;
}

/** Drop a stashed socket without taking it (e.g. the request was abandoned). */
function drop(id: string): void {
  sockets.delete(id);
}

export const resStore = { put, take, drop };
