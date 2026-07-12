import { defineSchema, SchemaType } from "@bonsae/nrg/schema";

/**
 * http-response writes the reply for a request started by http-in. It is a SINK
 * node (no wire output). It reads the live socket off the off-the-wire PRIVATE
 * lane (`msg.private.res`, keyed by the message's `_msgid`) and sends the
 * response. `statusCode`/`headers` here are defaults; msg.statusCode/msg.headers
 * override.
 */
export const ConfigsSchema = defineSchema(
  {
    name: SchemaType.String({ default: "", "x-nrg-form": { icon: "tag" } }),
    statusCode: SchemaType.String({
      default: "",
      description: "Status code (blank = msg.statusCode, else 200)",
      "x-nrg-form": { icon: "sign-out" },
    }),
    headers: SchemaType.TypedInput<Record<string, string>>({
      description: "Response headers (an object). Merged with msg.headers.",
      default: { type: "json", value: "{}" },
      "x-nrg-form": { icon: "list", typedInputTypes: ["json", "msg"] },
    }),
  },
  { $id: "http-response:config" },
);
