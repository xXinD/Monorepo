import { ChildProcess } from "child_process";
import * as Sentry from "@sentry/node";
import { liveMismatching } from "../../config/liveMismatching";
import {
  asyncHandler,
  convertToSeconds,
  secondsToHMS,
} from "../../utils/handler";
import redisClient from "../../utils/redisClient";
import { childProcesses, LiveOptions, updateLiveStreamStatus } from "./index";
import { LiveStream } from "../../models/LiveStream";
import { startLive } from "../../controllers/live";

export function onData(childProcess: ChildProcess, options: LiveOptions) {
  const ssSeconds = convertToSeconds(options.start_time ?? "00:00:00");
  const interval = 30000; // 30 seconds in milliseconds
  let lastLogTime = Date.now();
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
      const now = Date.now();
      if (now - lastLogTime >= interval) {
        const liveSteam = await LiveStream.findById(options.unique_id);
        const logString = data.toString();
        const timeRegex = /time=(\d{2}:\d{2}:\d{2}.\d{2})/;
        const match = logString.match(timeRegex);
        let timeValue;
        if (match) {
          [, timeValue] = match; // 直接为已声明的变量赋值
          const currentSeconds = convertToSeconds(timeValue);
          try {
            await LiveStream.update(options.unique_id, {
              ...liveSteam,
              start_time: secondsToHMS(ssSeconds + currentSeconds),
            });
          } catch (error) {
            console.error("修改直播进度出错:", error);
          }
          lastLogTime = now;
        } else {
          console.log("No match found");
        }
      }
    }
  });
}

async function clearProcess(unique_id: string, status: number) {
  if (childProcesses.has(unique_id)) {
    childProcesses.delete(unique_id);
  }
  await updateLiveStreamStatus(unique_id, status);
}
export function onExit(
  childProcess: ChildProcess,
  options: LiveOptions,
  ctx: any
) {
  childProcess.once("exit", async (code) => {
    const isStopped = await redisClient.get(options.unique_id);
    // @ts-ignore
    if (isStopped !== "true" && code === 0) {
      const liveSteam = await LiveStream.findById(options.unique_id);
      try {
        await LiveStream.update(options.unique_id, {
          ...liveSteam,
          start_time: "00:00:00",
        });
      } catch (error) {
        console.error("修改直播进度出错:", error);
      }
      // 如果没有被停止，就重新开始推流
      await redisClient.del(options.unique_id);
      await startLive({
        request: {
          body: {
            ...options,
            start_time: "00:00:00",
            is_restart: true,
          },
        },
      });
    } else {
      await clearProcess(options.unique_id, 1);
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
