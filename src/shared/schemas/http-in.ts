import { defineSchema, SchemaType } from "@bonsae/nrg/schema";

/**
 * http-in listens on a path of Node-RED's user HTTP server (`RED.httpNode`) and
 * emits a message per request. It is a SOURCE node (no wire input). Mirrors the
 * core `http in` node's config (method + url), minered to the essentials for v1.
 */
export const ConfigsSchema = defineSchema(
  {
    name: SchemaType.String({ default: "", "x-nrg-form": { icon: "tag" } }),
    method: SchemaType.Union(
      [
        SchemaType.Literal("get"),
        SchemaType.Literal("post"),
        SchemaType.Literal("put"),
        SchemaType.Literal("delete"),
        SchemaType.Literal("patch"),
      ],
      {
        default: "get",
        description: "HTTP method to listen for",
        "x-nrg-form": { icon: "exchange" },
      },
    ),
    url: SchemaType.String({
      default: "",
      description: "Path to listen on, e.g. /hello or /user/:id",
      "x-nrg-form": { icon: "globe" },
    }),
  },
  { $id: "http-in:config" },
);
