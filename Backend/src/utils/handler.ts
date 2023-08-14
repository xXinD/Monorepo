import Koa from "koa";
import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import { globalErrorHandler } from "../middleware/error";
import { bilibiliService } from "../controllers/bilibili";
import { updateLiveStreamStatus } from "../scripts/stream";
import { delay } from "../controllers/live";
import MyWebSocketServer from "./MyWebSocketServer";

export const prayListChildProcesses = new Map<string, FfmpegCommand>();
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
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats.isFile()) {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            reject(err);
            return;
          }
          const videoDuration = metadata.streams[0]?.duration || 0;
          resolve(videoDuration);
        });
      } else if (stats.isDirectory()) {
        let totalDuration = 0;
        fs.readdir(filePath, (err, files) => {
          if (err) {
            reject(err);
            return;
          }
          const videoFiles = files.filter((file) => {
            // 你可以根据需要添加或删除支持的视频格式
            const videoExtensions = [".mp4", ".avi", ".mkv", ".flv", ".mov"];
            return videoExtensions.includes(path.extname(file).toLowerCase());
          });

          let videoFileCount = videoFiles.length;
          if (videoFileCount === 0) resolve(0);

          videoFiles.forEach((file) => {
            const fullPath = path.join(filePath, file);
            ffmpeg.ffprobe(fullPath, (err, metadata) => {
              if (err) {
                reject(err);
                return;
              }
              // 将时长转换为数字
              const videoDuration = parseFloat(
                metadata.streams[0]?.duration || "0"
              );
              totalDuration += videoDuration;
              if (--videoFileCount === 0) resolve(totalDuration);
            });
          });
        });
      } else {
        reject(new Error("路径既不是文件也不是文件夹"));
      }
    });
  });
}

// 00:00:00转为秒数
export function convertToSeconds(timeStr: string = "00:00:00") {
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
): Promise<{ m3u8Path: string; totalDuration: number; progress: number }> {
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

          // 计算进度并打印
          const progress = ((index + 1) / files.length) * 100;
          console.log(`Progress: ${progress.toFixed(2)}%`);

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

        resolve({ m3u8Path, totalDuration, progress: 100 }); // 返回m3u8文件路径、视频总长度和进度
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

function getHardwareAcceleration() {
  try {
    const stdout = execSync("ffmpeg -encoders", { encoding: "utf8" });

    if (stdout.includes("h264_nvenc")) {
      return "h264_nvenc";
    }
    if (stdout.includes("h264_amf")) {
      return "h264_amf";
    }
    if (stdout.includes("h264_qsv")) {
      return "h264_qsv";
    }
    if (stdout.includes("h264_videotoolbox")) {
      return "h264_videotoolbox";
    }
    return "libx264";
  } catch (error) {
    console.error(error);
    return "libx264";
  }
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

    // 创建目录路径
    const segmentPath = path.join(path.dirname(input), "playlist");
    // 确保目录存在
    if (!fs.existsSync(segmentPath)) {
      fs.mkdirSync(segmentPath);
    }
    // 创建输出模式
    const outputPattern = path.join(segmentPath, `${segmentName}_%03d.ts`);
    const playlistFile = path.join(segmentPath, `${segmentName}.m3u8`);

    ffmpeg(input)
      .videoCodec(getHardwareAcceleration())
      .audioCodec("aac")
      .audioFrequency(44100)
      .addOption("-strict", "experimental")
      .addOption("-segment_time", String(segmentDuration))
      .addOption("-f", "segment")
      .addOption("-r", String(framerate)) // 添加帧率
      .addOption("-b:v", `${bitrate}k`) // 添加视频码率
      .addOption("-force_key_frames", `expr:gte(t,n_forced*${segmentDuration})`)
      .output(outputPattern)
      .addOption("-segment_format", "mpeg_ts")
      .addOption("-segment_list", playlistFile) // 添加播放列表文件
      .addOption("-segment_list_type", "m3u8") // 指定播放列表格式
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command:", commandLine);
        resolve(); // 这里解析Promise，告知start事件已被触发
      })
      .on("stderr", (stderrLine) => {
        console.log(stderrLine, "stderrLine");
        myWebSocketServer.sendMessage(stderrLine);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("Error:", err.message);
        myWebSocketServer.sendMessage(`任务失败：${err.message}`);
        reject(err); // 这里拒绝Promise，告知发生错误
      })
      .on("end", () => {
        console.log("end");
        myWebSocketServer.sendMessage("任务完成！");
      })
      .run();
  });
}
