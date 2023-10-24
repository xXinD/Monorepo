import Router from "@koa/router";
import { postFFCreator } from "../controllers/ffcreator";

const FFCreatorRoutes = new Router();

FFCreatorRoutes.post("/", postFFCreator);

export default FFCreatorRoutes;
