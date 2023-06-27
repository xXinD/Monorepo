import Router from "@koa/router";
import { bilibiliService } from "../../controllers/bilibili";

const bilibili_live = new Router();

bilibili_live.get("/getStreamAddr/:id", bilibiliService.getStreamAddr);
bilibili_live.get("/getAreaList", bilibiliService.getAreaList);
bilibili_live.get("/getRoomId/:id", bilibiliService.getRoomId);
bilibili_live.get("/getRoomId/:id", bilibiliService.getRoomId);
bilibili_live.post("/updateRoomTitle/:id", bilibiliService.updateRoomTitle);
bilibili_live.post("/postStartLive/:id", bilibiliService.postStartLive);
bilibili_live.post("/postStopLive/:id", bilibiliService.postStopLive);
bilibili_live.get("/getRoomInfo/:id", bilibiliService.getRoomInfo);
bilibili_live.get("/getRoomStatusInfo/:id", bilibiliService.getRoomStatusInfo);

export default bilibili_live;
