// src/routes/index.ts

import Router from "@koa/router";
import liveRoutes from "./liveRoutes";
import { escapeParams } from "../utils/stringUtils";
import resourcesRoutes from "./resourcesRoutes";
import streamAddressRoutes from "./streamAddressRoutes";

const router = new Router();
router.use(escapeParams);
router.use("/live", liveRoutes.routes(), liveRoutes.allowedMethods());
router.use(
  "/resources",
  resourcesRoutes.routes(),
  resourcesRoutes.allowedMethods()
);
router.use(
  "/stream_address",
  streamAddressRoutes.routes(),
  streamAddressRoutes.allowedMethods()
);

export default router;
