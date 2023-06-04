// src/routes/liveRoutes.ts
import Router from "@koa/router";
import {
  startLive,
  getLiveStreamList,
  getLiveStream,
  updateLiveInfo,
  restartLive,
  stopLive,
  stopLiveALl,
  delLiveStream,
  startSpecifiedLive,
} from "../controllers/live";

const liveRoutes = new Router();

liveRoutes.post("/create", startLive);
liveRoutes.get("/", getLiveStreamList);
liveRoutes.get("/:id", getLiveStream);
liveRoutes.put("/:id", updateLiveInfo);
liveRoutes.delete("/:id", delLiveStream);
liveRoutes.post("/:id/restart", restartLive);
liveRoutes.post("/:id/start", startSpecifiedLive);
liveRoutes.post("/:id/stop", stopLive);
liveRoutes.delete("/all", stopLiveALl);

export default liveRoutes;
