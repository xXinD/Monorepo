import { ChildProcess } from "child_process";
import * as Sentry from "@sentry/node";
import { liveMismatching } from "../../config/liveMismatching";
import { asyncHandler } from "../../utils/handler";
import redisClient from "../../utils/redisClient";
import {
  childProcesses,
  closeAllStreams,
  LiveOptions,
  playVideoFiles,
  updateLiveStreamStatus,
} from "./index";
import { LiveStream } from "../../models/LiveStream";

export function onData(childProcess: ChildProcess, options: LiveOptions) {
  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", async (data) => {
    const hasError = liveMismatching.some((keyword) => data.includes(keyword));
    if (hasError) {
      Sentry.setContext("streaming", {
        options,
        childProcess,
      });
      console.error(`错误日志: ${data}`);
      await asyncHandler(async () => {
        await redisClient.set(options.unique_id, "true");
        if (childProcesses.has(options.unique_id)) {
          await redisClient.set(options.unique_id, "true");
          childProcesses.get(options.unique_id)?.kill("SIGKILL");
        }
        await updateLiveStreamStatus(options.unique_id, 2);
      }, "直播间被封禁");
    } else {
      console.log(`标准日志: ${data}`);
    }
  });
}

export function onClose(childProcess: ChildProcess) {
  childProcess.on("close", (code) => {
    console.log(`进程已关闭，对应code： ${code}`);
  });
}

export function onExit(
  childProcess: ChildProcess,
  options: LiveOptions,
  ctx: any
) {
  childProcess.on("exit", async () => {
    const isStopped = await redisClient.get(options.unique_id);
    // @ts-ignore
    if (isStopped !== "true") {
      // 如果没有被停止，就重新开始推流
      await redisClient.del(options.unique_id);
      await playVideoFiles(
        {
          ...options,
          start_time: "00:00:00",
        },
        ctx
      );
    } else {
      if (childProcesses.has(options.unique_id)) {
        childProcesses.delete(options.unique_id);
      }
      await LiveStream.update(options.unique_id, {
        ...options,
        start_time: "00:00:00",
        status: 1,
      });
      // 在数据库中删除对应的记录
    }
  });
}

export function onSignal() {
  process.on("SIGINT", async () => {
    console.log("Caught interrupt signal. Cleaning up...");
    if (childProcesses.size > 0) {
      await closeAllStreams();
    }
    process.exit(1);
  });

  process.on("SIGTERM", async () => {
    console.log("Caught termination signal. Cleaning up...");
    if (childProcesses.size > 0) {
      await closeAllStreams();
    }
    process.exit(1);
  });
}

export async function onSpawn(
  childProcess: ChildProcess,
  options: LiveOptions
) {
  return new Promise((resolve, reject) => {
    childProcess.on("spawn", async () => {
      await asyncHandler(async () => {
        // 更新直播状态为 'running'
        const live = await LiveStream.findById(options.unique_id);
        if (!live) {
          await LiveStream.create(options);
        } else {
          await updateLiveStreamStatus(options.unique_id, 0);
        }
        childProcesses.set(options.unique_id, childProcess);
        resolve(options);
      }, "启动/重启推流失败：").catch(reject);
    });

    childProcess.on("error", async (error) => {
      await asyncHandler(async () => {
        // 直播状态更新为错误
        await updateLiveStreamStatus(options.unique_id, 2);
        reject(error);
      }, "推流进程报错：").catch(reject);
    });
  });
}
