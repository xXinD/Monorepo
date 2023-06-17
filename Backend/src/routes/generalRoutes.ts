import Router from "@koa/router";
import { getServerConfig, updateServerConfig } from "../controllers/general";

const generalRoutes = new Router();

generalRoutes.get("/", getServerConfig);
generalRoutes.post("/", updateServerConfig);

export default generalRoutes;
