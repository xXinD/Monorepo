// src/routes/liveRoutes.ts
import Router from "@koa/router";
import {
  createResources,
  delResources,
  getResourcesByFileType,
  getResourcesFileTypes,
  getResourcesList,
  updateResources,
} from "../controllers/resources";

const resourcesRoutes = new Router();

resourcesRoutes.post("/create", createResources);
resourcesRoutes.put("/:unique_id", updateResources);
resourcesRoutes.get("/", getResourcesList);
resourcesRoutes.delete("/:id", delResources);
resourcesRoutes.get("/file_types", getResourcesFileTypes);
resourcesRoutes.post("/by_file_type", getResourcesByFileType);

export default resourcesRoutes;
