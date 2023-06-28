import { ChildProcess } from "child_process";
import * as Sentry from "@sentry/node";
import { liveMismatching } from "../../config/liveMismatching";
import { asyncHandler } from "../../utils/handler";
import redisClient from "../../utils/redisClient";
import { childProcesses, LiveOptions, updateLiveStreamStatus } from "./index";
import { LiveStream } from "../../models/LiveStream";
import { startLive } from "../../controllers/live";

export function onData(childProcess: ChildProcess, options: LiveOptions) {
  childProcess.stderr.on("data", async (data) => {
    const hasError = liveMismatching.some((keyword) => data.includes(keyword));
    if (hasError) {
      Sentry.setContext("streaming", {
        options,
        childProcess,
      });
      console.error(`【直播推流】错误日志: ${data}`);
      await asyncHandler(async () => {
        if (childProcesses.has(options.unique_id)) {
          childProcesses.get(options.unique_id)?.kill("SIGINT");
        }
        await updateLiveStreamStatus(options.unique_id, 2);
      }, "直播间被封禁");
    } else {
      console.log(`【直播推流】标准日志: ${data}`);
    }
  });
}

export function onExit(
  childProcess: ChildProcess,
  options: LiveOptions,
  ctx: any
) {
  childProcess.once("exit", async () => {
    const isStopped = await redisClient.get(options.unique_id);
    // @ts-ignore
    if (isStopped !== "true") {
      // 如果没有被停止，就重新开始推流
      await redisClient.del(options.unique_id);
      await startLive(ctx);
    } else {
      if (childProcesses.has(options.unique_id)) {
        childProcesses.delete(options.unique_id);
      }
      const liveStream = await LiveStream.findById(options.unique_id);
      if (liveStream) {
        await LiveStream.update(options.unique_id, {
          ...liveStream,
          status: 1,
        });
      }
    }
  });
}

export async function onSpawn(
  childProcess: ChildProcess,
  options: LiveOptions
) {
  return new Promise((resolve, reject) => {
    childProcess.once("spawn", async () => {
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

    childProcess.once("error", async (error) => {
      await asyncHandler(async () => {
        // 直播状态更新为错误
        await updateLiveStreamStatus(options.unique_id, 2);
        reject(error);
      }, "推流进程报错：").catch(reject);
    });
  });
}
