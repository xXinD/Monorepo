import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koa2Cors from "koa2-cors";
import config from "./config/default";
import { errorHandler } from "./middleware/error";
import routes from "./routes";
import { connectDb } from "./db";

const app = new Koa();
app.use(koa2Cors());

// register middleware
app.use(bodyParser());
app.use(errorHandler);

// register routes
app.use(routes.routes()).use(routes.allowedMethods());

// start http server
let server;
(async () => {
  await connectDb();
  server = app.listen(config.port, async () => {
    console.log(`Server running on port ${config.port}`);
  });
})();

// handle uncaught exceptions
process.addListener("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

// handle unhandled promise rejections
process.addListener("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});
