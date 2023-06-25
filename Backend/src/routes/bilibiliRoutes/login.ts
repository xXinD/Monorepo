import Router from "@koa/router";
import { bilibiliService } from "../../controllers/bilibili";

const bilibili_login = new Router();

bilibili_login.get("/login/qrcode", bilibiliService.getTheLoginQRCode);
bilibili_login.get("/login/poll/:id", bilibiliService.getTheLoginPoll);
bilibili_login.get("/getStreamAddr/:id", bilibiliService.getStreamAddr);
bilibili_login.get("/getAreaList", bilibiliService.getAreaList);
bilibili_login.get("/getRoomId/:id", bilibiliService.getRoomId);

export default bilibili_login;
