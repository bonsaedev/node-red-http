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
installing; the three nodes then appear under the **network** category (`HTTP
request`, `HTTP in`, `HTTP out`) in the palette.

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
