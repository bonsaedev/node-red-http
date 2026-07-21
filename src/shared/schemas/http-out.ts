import { defineSchema, SchemaType } from "@bonsae/nrg/schema";

/**
 * http-out writes the reply for a request started by http-in. It is a SINK
 * node (no wire output). It takes the live socket from the guarded store by the id
 * http-in rode on `_httpIn.resId` and sends the response. `statusCode`/`headers`
 * here are defaults; msg.statusCode/msg.headers override.
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
  { $id: "http-out:config" },
);
