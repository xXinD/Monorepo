import Router from "@koa/router";
import {
  getServerConfig,
  getTheListOfSystemFonts,
  postPlaylist,
  postWatermarkToVideo,
  updateServerConfig,
} from "../controllers/general";

const generalRoutes = new Router();

generalRoutes.get("/", getServerConfig);
generalRoutes.post("/", updateServerConfig);
generalRoutes.get("/fontList", getTheListOfSystemFonts);
generalRoutes.post("/postWatermarkToVideo", postWatermarkToVideo);
generalRoutes.post("/postPlaylist", postPlaylist);

export default generalRoutes;
