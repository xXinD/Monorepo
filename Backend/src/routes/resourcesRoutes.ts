// src/routes/liveRoutes.ts
import Router from "@koa/router";
import { createResources, getResourcesList } from "../controllers/resources";

const resourcesRoutes = new Router();

resourcesRoutes.post("/create", createResources);
resourcesRoutes.get("/", getResourcesList);

export default resourcesRoutes;
