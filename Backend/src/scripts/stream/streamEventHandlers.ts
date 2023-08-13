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

export async function onData(
  options: LiveOptions & { totalTime: number },
  data: any
) {
  console.log(data.toString());
  const ssSeconds = options.start_time
    ? convertToSeconds(options.start_time) % options.totalTime
    : convertToSeconds("00:00:00");
  const interval = 30000; // 30 seconds in milliseconds
  let lastLogTime = Date.now();
  const hasError = liveMismatching.some((keyword) => data.includes(keyword));
  if (hasError) {
    Sentry.setContext("streaming", {
      options,
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
}

async function clearProcess(unique_id: string, status: number) {
  if (childProcesses.has(unique_id)) {
    childProcesses.delete(unique_id);
  }
  await updateLiveStreamStatus(unique_id, status);
}
export async function onExit(options: LiveOptions, code?: number) {
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
}

export async function onSpawn(options: LiveOptions & { totalTime: number }) {
  await asyncHandler(async () => {
    // 更新直播状态为 'running'
    const live = await LiveStream.findById(options.unique_id);
    if (!live) {
      await LiveStream.create({
        ...options,
        start_time: options.start_time
          ? secondsToHMS(
              convertToSeconds(options.start_time) % options.totalTime
            )
          : "00:00:00",
      });
    } else {
      await LiveStream.update(options.unique_id, {
        ...live,
        start_time: options.start_time
          ? secondsToHMS(
              convertToSeconds(options.start_time) % options.totalTime
            )
          : "00:00:00",
      });
      await updateLiveStreamStatus(options.unique_id, 0);
    }
    return options;
  }, "启动/重启推流失败：");
}
export async function onError(
  options: LiveOptions & { totalTime: number },
  err: any
) {
  await asyncHandler(async () => {
    await clearProcess(options.unique_id, 1);
    // 直播状态更新为错误
    await updateLiveStreamStatus(options.unique_id, 2);
  }, `推流进程报错：${err}`);
}
