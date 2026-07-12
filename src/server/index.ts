import { defineModule } from "@bonsae/nrg/server";
import HttpRequest from "./nodes/http-request";
import HttpIn from "./nodes/http-in";
import HttpResponse from "./nodes/http-response";

export default defineModule({
  nodes: [HttpRequest, HttpIn, HttpResponse],
});
