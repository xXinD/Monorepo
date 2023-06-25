import Router from "@koa/router";
import { bilibiliService } from "../../controllers/bilibili";

const bilibili_login = new Router();

bilibili_login.get("/login/qrcode", bilibiliService.getTheLoginQRCode);
bilibili_login.get("/login/poll/:id", bilibiliService.getTheLoginPoll);

export default bilibili_login;
