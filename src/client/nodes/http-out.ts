import { defineNode } from "@bonsae/nrg/client";
import HttpOutForm from "../components/http-out.vue";

export default defineNode({
  type: "http-out",
  form: { component: HttpOutForm },
});
