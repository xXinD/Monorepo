import Koa from "koa";
import bodyParser from "koa-bodyparser";
import koa2Cors from "koa2-cors";
import portfinder from "portfinder";
import * as Sentry from "@sentry/node";
import { CaptureConsole } from "@sentry/integrations";
import config from "./config/default";
import { errorHandler } from "./middleware/error";
import routes from "./routes";
import { connectDb } from "./db";
import GlobalEventHandler from "./utils/globalEventHandler";
import SingletonNMS from "./middleware/SingletonNMS";
import { initLiveStream } from "./scripts/stream";

const nmsInstance = SingletonNMS.getInstance();
const app = new Koa();
app.use(koa2Cors());

// register middleware
app.use(bodyParser());
app.use(errorHandler);

// register routes
app.use(routes.routes()).use(routes.allowedMethods());
if (process.env.ENV_VAR !== "development") {
  Sentry.init({
    dsn: "https://d0091206cb7e47aba576f453777c576e@o4505381409456128.ingest.sentry.io/4505381426102272",
    integrations: [
      new CaptureConsole({
        levels: ["error"],
      }),
    ],
  });
}

app.on("error", (err, ctx) => {
  Sentry.withScope((scope) => {
    scope.addEventProcessor((event) =>
      Sentry.addRequestDataToEvent(event, ctx.request)
    );
    Sentry.captureException(err);
  });
});

// start http server
(async () => {
  await connectDb();
  portfinder.basePort = config.port;
  try {
    const port = await portfinder.getPortPromise();
    app.listen(port, () => {
      GlobalEventHandler.getInstance();
      nmsInstance.run();
      initLiveStream();
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to find an available port：", err);
  }
})();
