import { defineNode } from "@bonsae/nrg/client";
import HttpRequestForm from "../components/http-request.vue";

export default defineNode({
  type: "http-request",
  form: { component: HttpRequestForm },
});
