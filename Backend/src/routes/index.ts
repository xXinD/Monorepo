// src/routes/index.ts

import Router from "@koa/router";
import liveRoutes from "./liveRoutes";
import { escapeParams } from "../utils/stringUtils";
import resourcesRoutes from "./resourcesRoutes";
import streamAddressRoutes from "./streamAddressRoutes";
import generalRoutes from "./generalRoutes";
import bilibili_login from "./bilibiliRoutes/login";
import bilibili_live from "./bilibiliRoutes/live";
import FFCreatorRoutes from "./ffcreatorRoutes";

const router = new Router();
router.use(escapeParams);
router.use("/live", liveRoutes.routes(), liveRoutes.allowedMethods());
router.use("/general", generalRoutes.routes(), generalRoutes.allowedMethods());

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
router.use(
  "/bilibili",
  bilibili_login.routes(),
  bilibili_login.allowedMethods(),
  bilibili_live.routes(),
  bilibili_live.allowedMethods()
);

router.use("/ffCreator", FFCreatorRoutes.routes(), FFCreatorRoutes.allowedMethods());
export default router;
