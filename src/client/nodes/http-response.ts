import { defineNode } from "@bonsae/nrg/client";
import HttpResponseForm from "../components/http-response.vue";

export default defineNode({
  type: "http-response",
  form: { component: HttpResponseForm },
});
