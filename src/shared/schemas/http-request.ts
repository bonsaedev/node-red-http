import { defineSchema, SchemaType } from "@bonsae/nrg/schema";

/**
 * Config surface mirrors the Node-RED core `http request` node so a flow author
 * migrating over sees the same knobs. Implemented on the native `fetch` API.
 *
 * Parity notes (Node-RED core → here):
 *  - method, ret, paytoqs, url, persist, insecureHTTPParser, authType, senderr,
 *    headers, name → all present.
 *  - The `tls` (tls-config) and `proxy` (http proxy) config-node references are
 *    intentionally deferred: `fetch` has no native equivalent (they'd need an
 *    undici dispatcher), and most requests don't need them.
 */
export const ConfigsSchema = defineSchema(
  {
    name: SchemaType.String({ default: "", "x-nrg-form": { icon: "tag" } }),
    method: SchemaType.Union(
      [
        SchemaType.Literal("GET"),
        SchemaType.Literal("POST"),
        SchemaType.Literal("PUT"),
        SchemaType.Literal("DELETE"),
        SchemaType.Literal("HEAD"),
        SchemaType.Literal("OPTIONS"),
        SchemaType.Literal("PATCH"),
        SchemaType.Literal("use"),
      ],
      {
        default: "GET",
        description: "HTTP method — `use` reads it from msg.method at runtime",
        "x-nrg-form": { icon: "exchange" },
      },
    ),
    url: SchemaType.TypedInput<string>({
      description:
        "Request URL. Supports {{mustache}} tags against the message.",
      default: { type: "str", value: "" },
      "x-nrg-form": { icon: "globe", typedInputTypes: ["str", "msg"] },
    }),
    ret: SchemaType.Union(
      [
        SchemaType.Literal("txt"),
        SchemaType.Literal("bin"),
        SchemaType.Literal("obj"),
      ],
      {
        default: "txt",
        description:
          "Return body as: txt = UTF-8 string, bin = Buffer, obj = parsed JSON",
        "x-nrg-form": { icon: "sign-out" },
      },
    ),
    paytoqs: SchemaType.Union(
      [
        SchemaType.Literal("ignore"),
        SchemaType.Literal("query"),
        SchemaType.Literal("body"),
      ],
      {
        default: "ignore",
        description:
          "Send msg.payload as: ignore = default, query = append to URL, body = request body",
        "x-nrg-form": { icon: "arrows-h" },
      },
    ),
    headers: SchemaType.TypedInput<Record<string, string>>({
      description:
        "Static request headers (an object). Merged with msg.headers.",
      default: { type: "json", value: "{}" },
      "x-nrg-form": { icon: "list", typedInputTypes: ["json", "msg"] },
    }),
    authType: SchemaType.Union(
      [
        SchemaType.Literal(""),
        SchemaType.Literal("basic"),
        SchemaType.Literal("bearer"),
      ],
      {
        default: "",
        description: "Authentication scheme",
        "x-nrg-form": { icon: "lock" },
      },
    ),
    persist: SchemaType.Boolean({
      default: false,
      description: "Keep the TCP connection alive between requests",
    }),
    insecureHTTPParser: SchemaType.Boolean({
      default: false,
      description: "Accept malformed HTTP responses (insecure; best-effort)",
    }),
    senderr: SchemaType.Boolean({
      default: false,
      description:
        "Send request errors to the output instead of failing the node",
    }),
  },
  { $id: "http-request:config" },
);

/**
 * Basic uses user + password; bearer uses bearerToken. Stored as Node-RED
 * credentials (encrypted, not in the flow file). `format: "password"` renders a
 * masked input in the editor.
 */
export const CredentialsSchema = defineSchema(
  {
    user: SchemaType.String({
      default: "",
      description: "Username (basic auth)",
    }),
    password: SchemaType.String({
      default: "",
      format: "password",
      description: "Password (basic auth)",
    }),
    bearerToken: SchemaType.String({
      default: "",
      format: "password",
      description: "Token (bearer auth)",
    }),
  },
  { $id: "http-request:credentials" },
);
