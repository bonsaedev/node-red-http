<a href="https://bonsaedev.github.io/nrg/"><img src="https://img.shields.io/badge/built%20with-nrg-A80000.svg?labelColor=black&style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Im91dGxpbmVHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiAjODA4MDgwOyBzdG9wLW9wYWNpdHk6IDEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6ICM0MDQwNDA7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImhleGFnb25HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiAjQTgwMDAwOyBzdG9wLW9wYWNpdHk6IDEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6ICM0QjAwMDA7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImxpZ2h0bmluZ0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6ICNmZmZmZmY7IHN0b3Atb3BhY2l0eTogMSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjogI2UwZTBlMDsgc3RvcC1vcGFjaXR5OiAxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHBvbHlnb24gcG9pbnRzPSI1MCwyIDk4LDI1IDk4LDc1IDUwLDk4IDMsNzUgMywyNSIgCiAgICAgICAgICAgc3Ryb2tlPSJ1cmwoI291dGxpbmVHcmFkaWVudCkiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0idXJsKCNoZXhhZ29uR3JhZGllbnQpIiAvPgoKICA8cGF0aCBkPSJNMzMgMGwxOS43OTcyIDM5LjQ1NzQtMjguNTAyMi0xMS4xMTg0TDc0IDk4IDUxLjA2MDggNDkuMzA1NCA3MSA1NloiIAogICAgICAgIGZpbGw9InVybCgjbGlnaHRuaW5nR3JhZGllbnQpIiBzdHJva2U9Im5vbmUiIC8+Cjwvc3ZnPgo=" alt="built with nrg"/></a>
<a href="https://www.npmjs.com/package/@bonsae/node-red-http"><img alt="NPM Version" src="https://img.shields.io/npm/v/@bonsae/node-red-http"></a>
<a href="https://github.com/bonsaedev/node-red-http/actions/workflows/ci.yaml"><img src="https://github.com/bonsaedev/node-red-http/actions/workflows/ci.yaml/badge.svg?branch=main" alt="build status"/></a>
<a href="https://socket.dev/npm/package/@bonsae/node-red-http"><img src="https://socket.dev/api/badge/npm/package/@bonsae/node-red-http?v=1" alt="socket badge"/></a>
<a href="https://codecov.io/gh/bonsaedev/node-red-http"><img src="https://codecov.io/gh/bonsaedev/node-red-http/graph/badge.svg" alt="codecov"/></a>

# @bonsae/node-red-http

HTTP nodes for [Node-RED](https://nodered.org), built with
[`@bonsae/nrg`](https://github.com/bonsaedev/nrg) on the platform-native
[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) API — no
`request`/`axios`/`body-parser` dependency. The package mirrors the config
surface of Node-RED's core `http request` / `http in` / `http response` nodes so
a flow author migrating over sees the same knobs.

## Nodes

### `http-request` (action node)

Makes an outbound HTTP request with `fetch` and emits the response under
`msg.output`. A handful of `msg` properties override the configured values at
runtime (`msg.method` / `msg.url` / `msg.headers` / `msg.payload`).

| Field | Notes |
| --- | --- |
| **method** | `GET` · `POST` · `PUT` · `DELETE` · `HEAD` · `OPTIONS` · `PATCH` · `use` (read `msg.method` at runtime) |
| **url** | typed input (`str` / `msg`); supports `{{mustache}}` tags resolved against the message. A scheme-less URL is assumed `http://` |
| **return** | `txt` = UTF-8 string · `bin` = `Buffer` · `obj` = parsed JSON (falls back to raw text if the body isn't JSON) |
| **payload → ** | `ignore` (default) · `query` (append `msg.payload` object to the URL) · `body` (send as the request body) |
| **headers** | typed input (`json` / `msg`); merged with `msg.headers` (which wins). Object payloads default to `application/json` |
| **auth** | `` (none) · `basic` (user + password) · `bearer` (token) — credentials are stored encrypted. `digest` is not supported yet |
| **keep-alive / insecure parser / send errors** | `persist` reuses the TCP connection; `senderr` emits request errors as a normal message (`statusCode: 0`) instead of failing the node |

**Output** — `msg.output = { statusCode, headers, payload, responseUrl }`.

### `http-in` (source node)

Listens on a path of Node-RED's user HTTP server (`RED.httpNode`) and emits one
message per request. No wire input.

| Field | Notes |
| --- | --- |
| **method** | `get` · `post` · `put` · `delete` · `patch` |
| **url** | path to listen on, e.g. `/hello` or `/user/:id` |

**Output** — `msg.output = { payload, req }`, where `payload` is the query object
(GET) or the parsed body (POST/PUT/PATCH/DELETE), and `req` is a clone-safe
snapshot `{ method, url, headers, query, params, body }`. The **live `res`
socket** never rides the wire — it travels on the off-the-wire private lane (see
below), so http-out can recover it from anywhere downstream.

### `http-out` (sink node)

Writes the reply for a request started by `http-in`. No wire output.

| Field | Notes |
| --- | --- |
| **statusCode** | blank = `msg.statusCode`, else `200` |
| **headers** | typed input (`json` / `msg`); merged with `msg.headers` (which wins). Object payloads default to `application/json` |

It reads the live socket off `msg.private.res`, replies with `msg.output`
(from another nrg node) or the top-level message (a raw/injected message), and
**claims** the socket so a second http-out for the same request is a no-op.

## How http-in ↔ http-out stay paired

A live request/response socket is a non-serializable live object — it cannot ride
the message wire (Node-RED clones messages), and threading a correlation id
through every intermediate node is brittle. Instead this package uses nrg's
**private lane**: an off-the-wire, package-scoped store keyed by the message's
`_msgid`, which nrg carries forward across every node.

- `http-in` parks the live `res` on the private lane (`msg.private.res`) and
  emits only the clone-safe snapshot.
- nrg preserves `_msgid` through any intermediate nodes, so the lane entry stays
  reachable no matter how the flow is wired.
- `http-out` reads `msg.private.res` back and replies — the socket survived
  the trip without ever being serialized.

Because the lane is keyed per request, **concurrent requests never cross
responses** — each caller is answered on its own socket even when completion
order is scrambled. If a request is never answered, `http-in` ends it with a
`504` after an idle timeout so an abandoned socket can't hang the client.

## Install & build

```bash
pnpm install
pnpm build      # bundles the nodes into dist/ (declares @bonsae/nrg-runtime)
pnpm dev        # boots a Node-RED editor with the nodes loaded
```

## Develop

```bash
pnpm validate                  # tsc (server/client/tests) + eslint + prettier
pnpm test                      # server unit + integration (real HTTP round-trip)
pnpm test:server:unit
pnpm test:server:integration
```

## Example

```
[inject] --> [http-request GET https://api.example.com/thing] --> [debug]

[http-in GET /hello] --> [function / any nrg node] --> [http-out]
```

Wire an `http-in` to an `http-out` (optionally through any number of nodes)
to serve a route; wire `http-request` after an `inject`/`function` to call an
external API and route `msg.output.payload` onward.

## License

[MIT](./LICENSE) © Allan Oricil
