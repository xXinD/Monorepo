// eslint-disable-next-line import/no-extraneous-dependencies
import si from "systeminformation";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { LiveStream } from "../models/LiveStream";
import { asyncHandler } from "../utils/handler";

// 子进程统一管理
const childProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export interface LiveOptions {
  unique_id?: string;
  uniqueId?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  // 直播名称
  name: string;
  // 直播状态
  state?: string;
  // 推流地址
  streamingAddress: string;
  // 推流密钥
  streamingCode: string;
  // 房间地址
  roomAddress?: string;
  // 视频文件所在目录
  videoDir?: string;
  fileType?: string;
  fileName?: string;
  // 编码器
  encoder?: string;
  // 是否开启硬件加速
  isItHardware?: number;
  // 码率模式
  encodingMode: number;
  // 码率值
  bitRateValue: number;
  // 分辨率
  resolvingPower?: string;
  // 是否启用水印，默认不启用
  watermarkEnabled?: boolean;
  // 水印图片路径
  watermarkImg?: string;
  // 水印图片宽度
  watermarkWidth?: number;
  // 请选择水印位置：1.左上角 2.左下角 3.右上角 4.右下角
  watermarkPosition?: number;
  // 转场效果类型：1.简单 2.复杂，默认无转场效果
  transitionType?: number;
  // 选择简单转场效果：1.淡入淡出fade 2.滑动slide 3.推移push"
  simpleTransition?: number;
  // 选择复杂转场效果：1.旋转circleopen 2.缩放radial 3.翻转flip 4.溶解dissolve"
  complexTransition?: number;
}

/**
 * 获取水印选项
 *
 * @param {Object} options 推流选项
 * @returns {string} 水印选项
 */
function getWatermarkOptions(options: LiveOptions): string {
  if (!options.watermarkEnabled) {
    return "";
  }

  let overlay = "";
  switch (options.watermarkPosition) {
    case 1:
      overlay = "10:10";
      break;
    case 2:
      overlay = "10:H-h-10";
      break;
    case 3:
      overlay = "W-w-10:10";
      break;
    case 4:
      overlay = "W-w-10:H-h-10";
      break;
    default:
      overlay = "W-w-10:H-h-10";
      break;
  }

  return `-i "${options.watermarkImg}" -filter_complex "[1:v]scale=${options.watermarkWidth}:-1[wm];[0:v][wm]overlay=${overlay}"`;
}

async function updateLiveStreamStatus(id: string, status: number) {
  await asyncHandler(async () => {
    const live = await LiveStream.findById(id);
    if (live) {
      await LiveStream.update(id, {
        ...live,
        status,
      });
      console.log("更新数据库成功");
    }
  }, "更新数据库状态报错：");
}

/**
 * 推流视频文件
 *
 * @async
 * @param {Array} videoFiles 推流文件列表
 * @param {number} index 当前推流文件索引
 * @param {Object} options 推流选项
 * @param {Object} ctx Koa 上下文
 * @returns {Promise<void>} Promise 对象
 */
async function playVideoFiles(
  options: LiveOptions,
  ctx: any
): Promise<unknown> {
  if (childProcesses.has(options.unique_id)) {
    childProcesses.delete(options.unique_id);
  }
  const { controllers } = await si.graphics();
  // eslint-disable-next-line no-nested-ternary
  let graphicsEncoder: string;
  if (options.isItHardware === 1) {
    if (controllers[0].vendor === "NVIDIA") {
      graphicsEncoder =
        options.encoder === "h264" ? "h264_nvenc" : "hevc_nvenc";
    } else {
      graphicsEncoder =
        options.encoder === "h264" ? "h264_videotoolbox" : "hevc_videotoolbox";
    }
  } else {
    graphicsEncoder = options.encoder === "h264" ? "libx264" : "libx265";
  }
  const args = [
    "-re",
    "-y",
    "-i",
    options.videoDir,
    "-c:v",
    graphicsEncoder,
    `${options.encodingMode === 2 && "-maxrate"}`,
    `${options.encodingMode === 2 && `${options.bitRateValue}k`}`,
    `${options.encodingMode === 2 && "-bufsize"}`,
    `${options.encodingMode === 2 && `${options.bitRateValue}k`}`,
    `${options.encodingMode === 1 && "-b:v"}`,
    `${options.encodingMode === 1 && `${options.bitRateValue}k`}`,
    "-c:a",
    "copy",
    "-map",
    "0:v:0",
    "-map",
    "0:a:0",
    "-metadata:s:v:0",
    "language=chi",
    "-metadata:s:a:0",
    "language=chi",
    "-scodec",
    "mov_text",
    "-map",
    "0:s:0?",
    "-f",
    "flv",
    "-qp",
    "20",
    `tee:[f=flv]${options.streamingAddress}/${options.streamingCode}`,
  ];
  const formatArgs: any[] = [];
  // 删除args内的false值
  args.map((item) => {
    if (item !== "false") {
      formatArgs.push(item);
    }
  });
  const childProcess = spawn("ffmpeg", formatArgs);

  childProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  childProcess.stderr.on("data", async (data) => {
    if (
      data.includes("auth:remote_auth:not_allowed") ||
      data.includes("auth:remote_auth:auth_failed") ||
      data.includes("RtmpStatusCode2NssError")
    ) {
      console.error(`stdout: ${data}`);
      await asyncHandler(async () => {
        childProcesses.delete(options.unique_id);
        await updateLiveStreamStatus(options.unique_id, 2);
      }, "直播间被封禁");
    } else if (
      data.indexOf("Failed to update header with correct duration") !== -1
    ) {
      console.error(`stdout: ${data}`);
      await asyncHandler(async () => {
        await LiveStream.delete(options.unique_id);
        childProcesses.delete(options.unique_id);
        await playVideoFiles(options, ctx);
      }, "推流任务出错");
    } else {
      console.log(`stdout: ${data}`);
    }
  });

  childProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    updateLiveStreamStatus(options.id, 1);
  });

  // 当子进程退出时，将其从映射中移除
  childProcess.on("exit", async () => {
    childProcesses.delete(options.unique_id);
    // 在数据库中删除对应的记录
    await updateLiveStreamStatus(options.unique_id, 1);
  });
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
      }, "更新直播状态发生错误：");
    });

    childProcess.on("error", async (error) => {
      await asyncHandler(async () => {
        // 直播状态更新为错误
        await updateLiveStreamStatus(options.unique_id, 2);
        reject(error);
      }, "更新直播状态发生错误：");
    });
  });
}
/**
 * 开始推流
 *
 * @async
 * @param {Object} options 推流选项
 * @param {number} startIndex 开始推流的视频文件索引，默认为 0
 * @param {any} ctx Koa 上下文
 */
export async function startStreaming(options: LiveOptions, ctx: any) {
  return playVideoFiles(options, ctx);
}

/**
 *
 *
 * @async
 * @param {Object}
 * @returns {Object}
 * @throws {Error}
 */
export async function stopStreaming(uniqueId: string) {
  const childProcess = childProcesses.get(uniqueId);
  if (childProcess) {
    childProcess.kill("SIGKILL");
    childProcesses.delete(uniqueId);
    await updateLiveStreamStatus(uniqueId, 1);
  }
}

/**
 * @author XinD
 * @date 2023/6/4
 * @description 删除直播间
 * @param {string} uniqueId 直播间唯一标识
 */
export async function delStreaming(uniqueId: string, ctx: any) {
  const childProcess = childProcesses.get(uniqueId);
  const liveStream = await LiveStream.findById(uniqueId);
  if (childProcess) {
    childProcess.kill("SIGKILL");
    childProcesses.delete(uniqueId);
  }
  if (liveStream) {
    await LiveStream.delete(uniqueId);
  } else {
    ctx.status = 500;
    ctx.body = { message: "直播间不存在" };
  }
}
export async function clearAllStreams(): Promise<void> {
  await LiveStream.clearAll();
  // 清空 childProcesses 对象
  childProcesses.clear();
}
