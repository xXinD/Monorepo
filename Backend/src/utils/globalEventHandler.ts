import { childProcesses, closeAllStreams } from "../scripts/stream";
import { SRS_ChildProcesses, stopAllSRS } from "../controllers/resources";

class GlobalEventHandler {
  private static instance: GlobalEventHandler;

  private constructor() {
    process.on("uncaughtException", (err) => {
      console.error("There was an uncaught error", err);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("SIGINT", this.shutdown);
    process.on("SIGTERM", this.shutdown);
    process.on("exit", this.shutdown);
  }

  public static getInstance(): GlobalEventHandler {
    if (!GlobalEventHandler.instance) {
      GlobalEventHandler.instance = new GlobalEventHandler();
    }
    return GlobalEventHandler.instance;
  }

  private shutdown = async () => {
    console.log("Caught termination signal. Cleaning up...");
    if (childProcesses.size > 0) {
      await closeAllStreams();
    }
    if (SRS_ChildProcesses.size > 0) {
      await stopAllSRS();
    }
    process.exit(1);
  };
}

export default GlobalEventHandler;
