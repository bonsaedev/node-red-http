import { defineNode } from "@bonsae/nrg/client";
import HttpInForm from "../components/http-in.vue";

export default defineNode({
  type: "http-in",
  form: { component: HttpInForm },
});
