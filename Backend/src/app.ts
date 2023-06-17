import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koa2Cors from "koa2-cors";
import portfinder from "portfinder";
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
(async () => {
  await connectDb();

  portfinder.basePort = config.port;

  try {
    const port = await portfinder.getPortPromise();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to find an available port:", err);
  }
})();

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
