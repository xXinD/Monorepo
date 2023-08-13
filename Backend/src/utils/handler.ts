import Koa from "koa";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { globalErrorHandler } from "../middleware/error";
import { bilibiliService } from "../controllers/bilibili";
import { updateLiveStreamStatus } from "../scripts/stream";
import { delay } from "../controllers/live";
import MyWebSocketServer from "./MyWebSocketServer";

// 分割视频文件，生成ts文件片段

// 生成m3u8

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

// 返回字体列表
export function getFontList(): { name: string; path: string }[] {
  const fontsFolder = path.join(__dirname, "../assets/fonts");
  const fontFiles = fs.readdirSync(fontsFolder);
  const fontList = fontFiles
    .filter((file) => file.endsWith(".ttf") || file.endsWith(".otf"))
    .map((file) => ({
      name: path.parse(file).name,
      path: path.join(fontsFolder, file),
    }));
  return fontList;
}

export function generateM3U8(
  folderPath: string
): Promise<{ m3u8Path: string; totalDuration: number }> {
  return new Promise((resolve, reject) => {
    const videoExtensions = [".ts"];
    let totalDuration = 0; // 用于存储视频总长度

    const files = fs
      .readdirSync(folderPath)
      .filter((file) =>
        videoExtensions.includes(path.extname(file).toLowerCase())
      )
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
        const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
        return numA - numB;
      });

    let content =
      "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:0\n#EXT-X-MEDIA-SEQUENCE:0\n";
    let maxDuration = 0;

    const processFile = (index: number) => {
      if (index < files.length) {
        const filePath = path.join(folderPath, files[index]);
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }
          const duration = parseFloat(metadata.format.duration.toFixed(6));
          content += `#EXTINF:${duration},\n${filePath.replace(/\\/g, "/")}\n`;
          if (duration > maxDuration) maxDuration = duration;
          totalDuration += duration; // 累加每个分段的时长
          processFile(index + 1);
        });
      } else {
        content = content.replace(
          "#EXT-X-TARGETDURATION:0",
          `#EXT-X-TARGETDURATION:${Math.ceil(maxDuration)}`
        );
        content += "#EXT-X-ENDLIST\n";

        const playlists = path.resolve(process.cwd(), "./playlists/");
        if (!fs.existsSync(playlists)) {
          fs.mkdirSync(playlists);
        }
        const m3u8Path = path.join(playlists, `${uuidv4()}.m3u8`);
        fs.writeFileSync(m3u8Path, content);

        resolve({ m3u8Path, totalDuration }); // 返回m3u8文件路径和视频总长度
      }
    };

    processFile(0);
  });
}

// 获取视频总长度
export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration); // 返回视频总长度（秒）
    });
  });
}

export function convertToSegments(
  input: string,
  segmentName: string,
  segmentDuration: number,
  framerate: number = 25,
  bitrate: number = 3000 // 码率参数（kbps）
): Promise<void> {
  console.log(framerate, bitrate);
  return new Promise((resolve, reject) => {
    const myWebSocketServer = MyWebSocketServer.getInstance(9999);
    // 获取视频和音频的编解码器
    ffmpeg.ffprobe(input, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      // 创建目录路径
      const segmentPath = path.join(path.dirname(input), "playlist");
      // 确保目录存在
      if (!fs.existsSync(segmentPath)) {
        fs.mkdirSync(segmentPath);
      }
      // 创建输出模式
      const outputPattern = path.join(segmentPath, `${segmentName}_%03d.ts`);
      ffmpeg(input)
        .videoCodec("libx264")
        .audioCodec("aac")
        .audioFrequency(44100)
        .addOption("-strict", "experimental")
        .addOption("-segment_time", String(segmentDuration))
        .addOption("-f", "segment")
        .addOption("-r", String(framerate)) // 添加帧率
        .addOption("-b:v", `${bitrate}k`) // 添加视频码率
        .addOption(
          "-force_key_frames",
          `expr:gte(t,n_forced*${segmentDuration})`
        )
        .output(outputPattern)
        .on("start", (commandLine) => {
          console.log("Spawned Ffmpeg with command:", commandLine);
          resolve(); // 这里解析Promise，告知start事件已被触发
        })
        .on("stderr", (stderrLine) => {
          myWebSocketServer.sendMessage(stderrLine);
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error:", err.message);
          reject(err); // 这里拒绝Promise，告知发生错误
        })
        .on("end", () => {
          console.log("end");
        })
        .run();
    });
  });
}
