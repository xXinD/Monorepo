import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koa2Cors from "koa2-cors";
import config from "./config/default";
import { errorHandler } from "./middleware/error";
import routes from "./routes";
import { connectDb } from "./db";
import binaryManager from "./utils/binaryManager";

const app = new Koa();
app.use(koa2Cors());

// register middleware
app.use(bodyParser());
app.use(errorHandler);

// register routes
app.use(routes.routes()).use(routes.allowedMethods());

// start http server
(async () => {
  await connectDb();
  app.listen(config.port, async () => {
    binaryManager();
    console.log(`Server running on port ${config.port}`);
  });
})();

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
