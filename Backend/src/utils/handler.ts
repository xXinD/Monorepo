import Koa from "koa";
import ffmpeg from "fluent-ffmpeg";
import { globalErrorHandler } from "../middleware/error";
import { bilibiliService } from "../controllers/bilibili";
import { updateLiveStreamStatus } from "../scripts/stream";
import { delay } from "../controllers/live";

export async function asyncHandler<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  ctx?: Koa.Context // 可选的Koa上下文，只有在处理HTTP请求时才提供
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (ctx) {
      // 在HTTP请求上下文中，使用你的 errorHandler 中间件处理错误
      ctx.app.emit("error", err, ctx);
    } else {
      // 在非HTTP上下文中，使用 globalErrorHandler 处理错误
      globalErrorHandler(errorMessage, err);
    }
    throw err; // 在这里，我们继续抛出错误，让其他中间件或调用者可以处理它
  }
}

export async function throttle(fn: (...args: any[]) => void, wait: number) {
  // eslint-disable-next-line no-undef
  let timer: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (...args: any[]) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      previous = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        previous = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

// 获取视频总帧数
export async function getTotalFrames(filePath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const totalFrames = metadata.streams[0].nb_frames;
      resolve(totalFrames);
    });
  });
}

// 获取视频总时长
export async function getTotalDuration(filePath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      const videoDuration = metadata.streams[0].duration;
      resolve(videoDuration);
    });
  });
}
// 00:00:00转为秒数
export function convertToSeconds(timeStr: string) {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// 将秒数转为00:00:00
export function secondsToHMS(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000); // 获取毫秒部分

  const formatNumber = (num: number) => (num < 10 ? `0${num}` : num);

  return millis
    ? `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(
        secs
      )}.${millis}`
    : `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(secs)}`;
}
export async function handleBilibiliStream(
  streamAddress: any,
  unique_id?: string
) {
  const {
    data: { lock_till },
  } = await bilibiliService.getBannedInfoById(streamAddress.unique_id);
  console.log("封禁信息", lock_till, streamAddress.start_broadcasting);

  if (lock_till && streamAddress.start_broadcasting == 1) {
    if (unique_id) {
      await updateLiveStreamStatus(unique_id, 2);
    }
    const currentTime = Date.now();
    const waitTime =
      (lock_till.toString().length < 13 ? lock_till * 1000 : lock_till) -
      currentTime +
      2700000;
    console.error(
      lock_till.toString().length < 13 ? lock_till * 1000 : lock_till,
      `封禁截止时间：【${lock_till}】 当前时间：【${currentTime}】 等待开播倒计时：【${waitTime}】`
    );
    if (waitTime > 0) {
      await delay(waitTime);
    }
  }

  const statusInfo = await bilibiliService.roomStatusInfo(
    streamAddress.unique_id
  );
  const live_status = statusInfo?.live_status;

  if (!live_status) {
    await bilibiliService.startLive({
      id: streamAddress.unique_id,
      area_v2: streamAddress.childAreaId,
    });
  }
}
