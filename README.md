<a href="https://bonsaedev.github.io/nrg/"><img src="https://img.shields.io/badge/built%20with-nrg-A80000.svg?labelColor=black&style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Im91dGxpbmVHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiAjODA4MDgwOyBzdG9wLW9wYWNpdHk6IDEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6ICM0MDQwNDA7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImhleGFnb25HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiAjQTgwMDAwOyBzdG9wLW9wYWNpdHk6IDEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6ICM0QjAwMDA7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImxpZ2h0bmluZ0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6ICNmZmZmZmY7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjogI2UwZTBlMDsgc3RvcC1vcGFjaXR5OiAxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHBvbHlnb24gcG9pbnRzPSI1MCwyIDk4LDI1IDk4LDc1IDUwLDk4IDMsNzUgMywyNSIgCiAgICAgICAgICAgc3Ryb2tlPSJ1cmwoI291dGxpbmVHcmFkaWVudCkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0idXJsKCNoZXhhZ29uR3JhZGllbnQpIiAvPgoKICA8cGF0aCBkPSJNMzMgMGwxOS43OTcyIDM5LjQ1NzQtMjguNTAyMi0xMS4xMTg0TDc0IDk4IDUxLjA2MDggNDkuMzA1NCA3MSA1NloiIAogICAgICAgIGZpbGw9InVybCgjbGlnaHRuaW5nR3JhZGllbnQpIiBzdHJva2U9Im5vbmUiIC8+Cjwvc3ZnPgo=" alt="built with nrg"/></a>
<a href="https://www.npmjs.com/package/@bonsae/node-red-http"><img alt="NPM Version" src="https://img.shields.io/npm/v/@bonsae/node-red-http"></a>
<a href="https://github.com/bonsaedev/node-red-http/actions/workflows/ci.yaml"><img src="https://github.com/bonsaedev/node-red-http/actions/workflows/ci.yaml/badge.svg?branch=main" alt="build status"/></a>
<a href="https://socket.dev/npm/package/@bonsae/node-red-http"><img src="https://socket.dev/api/badge/npm/package/@bonsae/node-red-http?v=1" alt="socket badge"/></a>
<a href="https://codecov.io/gh/bonsaedev/node-red-http"><img src="https://codecov.io/gh/bonsaedev/node-red-http/graph/badge.svg" alt="codecov"/></a>

# @bonsae/node-red-http

HTTP nodes for [Node-RED](https://nodered.org), built with
[`@bonsae/nrg`](https://bonsaedev.github.io/nrg/) on the platform-native
[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) API — no
`request`, `axios`, or `body-parser` dependency. Their config surfaces mirror
Node-RED's core `http request` / `http in` / `http response` nodes, so a flow
author migrating over sees the same knobs.

## Nodes

| Node             | Description                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **HTTP Request** | Make outbound HTTP requests with native `fetch` — method, mustache URL, auth, return type; merges the response fields onto the message record |
| **HTTP In**      | Listen on a path of Node-RED's HTTP server and emit one message per incoming request                                |
| **HTTP Out**     | Write the reply back on the live socket for a request started by **HTTP In**                                        |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [Node-RED](https://nodered.org/) >= 5

## Installation

Install into the directory that holds your Node-RED `package.json` (usually
`~/.node-red`):

```bash
npm install @bonsae/node-red-http
```

Everything the nodes need is pulled in automatically. **Restart Node-RED** after
installing; the three nodes then appear under the **network** category
(`HTTP request`, `HTTP in`, `HTTP out`) in the palette.

## Quick Start

Two independent flows: a **server** (`http-in` → `http-out` round trip) and a
**client** (`inject` → `http-request` → `debug`).

**Server** — an `http-in` on `GET /hello` wired straight to an `http-out`. Every
request to `/hello` gets a reply written back on its own live socket:

```
[http-in  GET /hello] --> [http-out]
```

**Client** — call an external API and route the parsed JSON onward:

```
[inject] --> [http-request  GET https://api.example.com/thing] --> [debug]
```

Both flows ship as ready-to-import examples. In the Node-RED editor, open
**Menu → Import → Examples → `@bonsae/node-red-http`** and pick **HTTP endpoint**
or **HTTP request** — or browse them in
[`src/resources/examples/`](src/resources/examples). Deploy, hit the inject
button to fire the outbound request, and `curl http://localhost:1880/hello` to
exercise the server pair.

## Message model

Two nrg conventions make these nodes work; understanding them is enough to wire
anything.

**1. The message is a single accumulating record.** An nrg node reads the fields
it needs at the root of `msg` and `send(port, additions)` merges an object of
named fields onto that same record (`{ ...incoming, ...additions }`) — nothing is
wrapped in an envelope. So `http-request` merges
`{ statusCode, headers, payload, responseUrl }` onto the record, and a downstream
`http-out` reads its reply straight off the root (`msg.payload` / `msg.statusCode`
/ `msg.headers`) — the same fields whether they were merged on by another nrg node
or set by a raw/injected message. Provenance rides `msg[Meta].source` (not a data
key), and lineage rides `_msgid`.

**2. The live response rides the private channel, not the wire.** A live
`ServerResponse` socket is a non-serializable object — it cannot ride the message
wire (Node-RED clones messages), and threading a correlation id through every
intermediate node is brittle. Instead:

- `http-in` parks the live `res` on nrg's **private channel** —
  `send("out", { payload, req }, { private: { res } })` — and merges only a
  clone-safe request snapshot (`payload` + `req`) onto the record.
- The private channel is off-the-wire and **package-scoped**, keyed by the
  `_msgid` nrg mints for that send. nrg carries `_msgid` forward across every
  node, so the entry stays reachable no matter how the flow is wired.
- `http-out` recovers the socket with `msg[Channels].private.res` (importing
  `Channels` from `@bonsae/nrg/server`), writes the reply, then
  `delete msg[Channels].private.res` to **claim** the socket — a second
  `http-out` for the same message finds nothing, so a request is answered exactly
  once.

> **Constraints.** The private channel is package-scoped, so **`http-in` and
> `http-out` must come from this same package** to share it — you cannot bridge
> to a core `http response` node. If a request is never answered, `http-in`
> force-ends the socket with **HTTP 504 after 5 minutes**
> (`RESPONSE_TIMEOUT_MS`, currently a fixed constant, not configurable) so an
> abandoned socket can't hang the client.

Because the channel is keyed per request, **concurrent requests never cross
responses** — each caller is answered on its own socket even when completion
order is scrambled.

## `http-request`

**Type:** `http-request` · **Category:** network

Sends an outbound HTTP request via the native `fetch` API and emits the response
out the `response` port. On each input message the node builds and dispatches the
request, then reports status (blue while sending, green on `res.ok`, yellow with
the status code otherwise, red on error).

URL resolution: `msg.url` wins over the configured `url`; the result is rendered
through `{{mustache}}` substitution (tags pulled from the message, unresolved →
empty string) and trimmed. An empty URL throws `No url specified`; a scheme-less
URL is prefixed with `http://` (not `https://`).

Payload handling depends on **payload** (`paytoqs`) and only runs when
`msg.payload` is neither `undefined` nor `null`:

- **query** and payload is an object → each entry is appended to the URL's search
  params.
- **body**, or **ignore** when the method is not `GET`/`HEAD` → the payload is
  serialized into the request body. Strings / `Buffer` / `Uint8Array` are sent
  as-is; any other value is `JSON.stringify`'d and — only then, if no
  `content-type` header is set — `Content-Type: application/json` is defaulted.

### Config

| Field                | Type                         | Default                         | Description                                                                                                                                       |
| -------------------- | ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`               | string                       | `""`                            | Editor label for the node instance.                                                                                                               |
| `method`             | select                       | `GET`                           | HTTP method: `GET` · `POST` · `PUT` · `DELETE` · `HEAD` · `OPTIONS` · `PATCH` · `use`. `use` reads `msg.method` at runtime (defaulting to `GET`). |
| `url`                | typed input (`str` / `msg`)  | `{ type: "str", value: "" }`    | Request URL. Supports `{{mustache}}` tags resolved against the message.                                                                           |
| `ret`                | select                       | `txt`                           | Return body as: `txt` = UTF-8 string · `bin` = `Buffer` · `obj` = parsed JSON (falls back to raw text if the body isn't JSON, `{}` if empty).     |
| `paytoqs`            | select                       | `ignore`                        | Send `msg.payload` as: `ignore` = default · `query` = append to URL · `body` = request body.                                                      |
| `headers`            | typed input (`json` / `msg`) | `{ type: "json", value: "{}" }` | Static request headers (an object). Merged with `msg.headers`, which overrides.                                                                   |
| `authType`           | select                       | `""`                            | Authentication scheme: `""` (none) · `basic` · `bearer`.                                                                                          |
| `persist`            | boolean                      | `false`                         | Keep the TCP connection alive between requests (passed to fetch as `keepalive`).                                                                  |
| `insecureHTTPParser` | boolean                      | `false`                         | Present in the form only — **not read anywhere in the node code**, so it has no runtime effect (fetch does not expose it).                        |
| `senderr`            | boolean                      | `false`                         | Send request errors to the output instead of failing the node (see Ports).                                                                        |

### Credentials

| Field         | Description                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `user`        | Username for `basic` auth. Used to build the Basic token. Stored encrypted.                                                  |
| `password`    | Password for `basic` auth (masked input). Stored encrypted.                                                                  |
| `bearerToken` | Token for `bearer` auth (masked input). Sent as `Authorization: Bearer <token>`, only when a token exists. Stored encrypted. |

Auth application by `authType`: **basic** → `Authorization: Basic base64(user:password)`;
**bearer** → `Authorization: Bearer <bearerToken>` (only if a token is set);
**`""`** (none) → no header.

### Ports

**Input** — `Input<Port<{ payload?; method?; url?; headers? }>>` (label: _Request_).
The following `msg` properties override config at runtime:

| `msg` property | Effect                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| `msg.method`   | Overrides `config.method` **only** when `config.method === "use"` (else falls back to `GET`). |
| `msg.url`      | Takes precedence over the configured `url` typed input.                                       |
| `msg.headers`  | Merged over (overrides) the configured headers.                                               |
| `msg.payload`  | Request body / query-string source, per `paytoqs`.                                            |

**Output** — port `response` (label: _Response_):
`Port<{ statusCode: number; headers: Record<string,string>; payload: string | Buffer | unknown; responseUrl: string }>`.

### Gotchas

- `insecureHTTPParser` is in the schema and form but never referenced in code —
  it has **no runtime effect**.
- A scheme-less URL is auto-prefixed with `http://`, not `https://`.
- `paytoqs: "ignore"` still sends `msg.payload` as the body for non-`GET`/`HEAD`
  methods; `GET`/`HEAD` never carry a body under `ignore`.
- With `senderr: true`, a failed request produces a normal output message with
  `statusCode: 0` instead of erroring the node:
  `{ statusCode: 0, headers: {}, payload: <error message>, responseUrl: url }`.
- Only non-string/`Buffer`/`Uint8Array` object payloads are `JSON.stringify`'d
  (and only then is `Content-Type` defaulted).
- **`tls` and `proxy` config-node references** from core `http request` are
  intentionally **not** supported — the native `fetch` API has no equivalent.

## `http-in`

**Type:** `http-in` · **Category:** network

A **source** node: it registers a route on Node-RED's user HTTP server
(`RED.httpNode`) and emits one message per incoming HTTP request. There is no
wire input.

On `created()` it lowercases the method (default `get`) and normalizes `url` to a
leading-slash route (`hello` → `/hello`). An empty/whitespace path sets a red
`"missing path"` status and throws `http-in: no url path configured`. If
`RED.httpNode` isn't available it sets a red `"no HTTP server"` status and
throws. On success the status shows a green dot `<METHOD> <url>`.

Per request it builds `query` (from `req.query`, else parsed from the URL) and,
for `POST`/`PUT`/`PATCH`/`DELETE`, reads and parses the body content-type-aware
(`application/json` → `JSON.parse` with raw-string fallback;
`application/x-www-form-urlencoded` → object from `URLSearchParams`; `text/*` →
UTF-8 string; otherwise the raw `Buffer`; `undefined` if empty). Other methods
get `body = undefined`.

### Config

| Field    | Type   | Default | Description                                                                     |
| -------- | ------ | ------- | ------------------------------------------------------------------------------- |
| `name`   | string | `""`    | Editor label for the node instance.                                             |
| `method` | select | `get`   | HTTP method to listen for: `get` · `post` · `put` · `delete` · `patch`.         |
| `url`    | string | `""`    | Path to listen on, e.g. `/hello` or `/user/:id`. Normalized to a leading slash. |

### Ports

**Input** — none (this is a source node; the input generic is `never`, so there
is no wire input — it is driven only by incoming HTTP requests).

**Output** — port `out` (label: _Request_):

```ts
{
  payload: unknown; // parsed query for GET, otherwise the parsed request body
  req: {
    method: string;
    url: string;
    headers: IncomingMessage["headers"];
    query: Record<string, unknown>;
    params: Record<string, string>;
    body: unknown;
  }
}
```

The live `res` is **not** on the wire — it is passed on the private channel
(`{ private: { res } }`) keyed by `_msgid` for `http-out` to recover downstream.

### Gotchas

- Body is only read for `POST`/`PUT`/`PATCH`/`DELETE`; for `GET` (and other
  methods) the emitted `payload` is the query object and `body` is `undefined`.
- Unanswered requests are force-ended with **HTTP 504 after 5 minutes**; the
  timer is `unref()`'d and cleared on the response `"close"` event.
- `closed()` removes the route by directly splicing
  `RED.httpNode._router.stack` (Express 4 has no public route-removal API) — the
  same technique the core `http in` node uses — so redeploys don't stack
  duplicate routes.

## `http-out`

**Type:** `http-out` · **Category:** network

Writes the HTTP reply for a request started by an `http-in` node. It is a
**sink** node: it consumes the incoming message, sends the response over the live
socket, and produces no wire output.

On `input(msg)` it reads the live `ServerResponse` off
`msg[Channels].private.res`. If none is present (already answered, expired, or
not wired from an `http-in` in **this** package) it sets a yellow `"no request"`
status, warns, and returns without sending. Otherwise it immediately claims the
socket (`delete msg[Channels].private.res`), derives the reply values, and writes
the response — green `<statusCode>` on success, red `"response failed"` on error.

Reply derivation:

- **source** the reply fields are read straight off the record root (`msg`) —
  whether an upstream nrg node merged them on or a raw/injected message set them.
- **statusCode** `Number(msg.statusCode ?? config.statusCode) || Number(config.statusCode) || 200`
  — an invalid/blank status falls back to config, then to `200`.
- **headers** resolved `config.headers` first, then `msg.headers` overrides.
- **body** `msg.payload` → `undefined`/`null` becomes an empty body; a `Buffer`
  is sent as-is; any other object is `JSON.stringify`'d (and, if no `content-type`
  header is set case-insensitively, `Content-Type: application/json` is added);
  otherwise `String(body)`.

### Config

| Field        | Type                         | Default                         | Description                                                                                            |
| ------------ | ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `name`       | string                       | `""`                            | Editor label for the node instance.                                                                    |
| `statusCode` | string                       | `""`                            | Status code. Blank → `msg.statusCode`, else `200`.                                                     |
| `headers`    | typed input (`json` / `msg`) | `{ type: "json", value: "{}" }` | Response headers (an object). Resolved config headers are merged first, then message headers override. |

### Ports

**Input** — `Input<Port<{ payload?; statusCode?; headers?; [key]: unknown }>>`
(label: _Response_). Reply fields are read off the record root:

| Field            | Effect                                                   |
| ---------------- | -------------------------------------------------------- |
| `msg.statusCode` | Overrides `config.statusCode` (may be number or string). |
| `msg.headers`    | Merged over (overrides) resolved `config.headers`.       |
| `msg.payload`    | The response body.                                       |

**Output** — none (sink node; the output generic is `never`).

### Gotchas

- If no live response is on the private channel it does **not** error — it warns,
  shows a yellow `"no request"` status, and returns silently.
- The socket is claimed via `delete msg[Channels].private.res` **before** writing,
  so a second `http-out` for the same `_msgid` finds nothing (answered exactly
  once).
- `statusCode` config is a string; a blank/invalid value falls through
  `Number(...)` to config, then to `200`.
- `Buffer` payloads are sent as-is; `null`/`undefined` become an empty body;
  non-object non-`Buffer` bodies are `String()`-coerced. `Content-Type: application/json`
  is auto-added only for object bodies when no `content-type` header is already
  set.

## Compatibility

|                        | Version      |
| ---------------------- | ------------ |
| Node-RED               | 5.x          |
| `@bonsae/nrg`          | `^0.41.0`    |
| Node.js                | `>= 22`      |
| pnpm (for development) | `>= 10.11.0` |

Registration is handled entirely through `@bonsae/nrg` (`defineModule`), not the
classic Node-RED `node-red.nodes` map.

## Development

```bash
pnpm install
pnpm build      # bundles the nodes into dist/
pnpm dev        # boots a Node-RED editor with the nodes loaded

pnpm validate                  # tsc (server/client/tests) + eslint + prettier
pnpm test                      # server unit + integration (real HTTP round-trip)
pnpm test:server:unit
pnpm test:server:integration
```

## Locales

Labels and auto-generated help docs are available in:

- English (en-US)
- German (de)
- Spanish (es-ES)
- French (fr)
- Japanese (ja)
- Korean (ko)
- Portuguese (pt-BR)
- Russian (ru)
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)

## License

[MIT](./LICENSE) © Allan Oricil
