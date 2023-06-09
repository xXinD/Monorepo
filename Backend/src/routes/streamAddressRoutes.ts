import Router from "@koa/router";
import {
  createStreamAddressList,
  delStreamAddress,
  getStreamAddressList,
  updateStreamAddress,
} from "../controllers/streamAdress";

const streamAddressRoutes = new Router();

streamAddressRoutes.get("/", getStreamAddressList);
streamAddressRoutes.post("/create", createStreamAddressList);
streamAddressRoutes.put("/:unique_id", updateStreamAddress);
streamAddressRoutes.delete("/:id", delStreamAddress);

export default streamAddressRoutes;
