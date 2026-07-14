import { defineModule } from "@bonsae/nrg/server";
import HttpRequest from "./nodes/http-request";
import HttpIn from "./nodes/http-in";
import HttpOut from "./nodes/http-out";

export default defineModule({
  nodes: [HttpRequest, HttpIn, HttpOut],
});
