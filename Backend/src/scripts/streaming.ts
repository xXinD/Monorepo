// eslint-disable-next-line import/no-extraneous-dependencies
import si from "systeminformation";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { LiveStream } from "../models/LiveStream";
import { asyncHandler } from "../utils/handler";
import redisClient from "../utils/redisClient";
import { buildFFmpegCommand } from "./buildFFmpegCommand";

// 子进程统一管理
const childProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export interface LiveOptions {
  unique_id?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  retweet?: boolean;
  // 直播名称
  name: string;
  // 直播状态
  state?: string;
  // 推流地址
  streaming_address: string;
  // 推流密钥
  streaming_code: string;
  // 房间地址
  room_address?: string;
  start_time?: string;
  // 视频文件所在目录
  video_dir?: string;
  fileType?: string;
  file_name?: string;
  // 编码器
  encoder?: string;
  // 是否开启硬件加速
  is_it_hardware?: number;
  // 码率模式
  encoding_mode: number;
  // 码率值
  bit_rate_value: number;
  // 分辨率
  resolving_power?: string;
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
  // 是否主动停止推流
  isStopped?: boolean;
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
    await redisClient.set(options.unique_id, "true");
    childProcesses.get(options.unique_id)?.kill("SIGKILL");
    childProcesses.delete(options.unique_id);
    const redisFlag = await redisClient.get(options.unique_id);
    if (redisFlag) {
      await redisClient.del(options.unique_id);
    }
  }
  await redisClient.del(options.unique_id);
  const args = await buildFFmpegCommand(options);
  const childProcess = spawn("ffmpeg", args);

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
      // 在数据库中删除对应的记录
      await updateLiveStreamStatus(options.unique_id, 1);
    }
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
 * @returns {Object}
 * @throws {Error}
 * @param unique_id
 */
export async function stopStreaming(unique_id: string) {
  await asyncHandler(async () => {
    await redisClient.set(unique_id, "true");
    const childProcess = childProcesses.get(unique_id);
    if (childProcess) {
      childProcess.kill("SIGKILL");
      childProcesses.delete(unique_id);
      await updateLiveStreamStatus(unique_id, 1);
    }
  }, "停止直播发生错误：");
}

/**
 * @author XinD
 * @date 2023/6/4
 * @description 删除直播间
 * @param unique_id
 * @param ctx
 */
export async function delStreaming(unique_id: string, ctx: any) {
  await asyncHandler(async () => {
    await redisClient.set(unique_id, "true");
    const childProcess = childProcesses.get(unique_id);
    const liveStream = await LiveStream.findById(unique_id);
    if (childProcess) {
      childProcess.kill("SIGKILL");
      childProcesses.delete(unique_id);
    }
    if (liveStream) {
      await LiveStream.delete(unique_id);
    } else {
      ctx.status = 500;
      ctx.body = { message: "直播间不存在" };
    }
  }, "删除直播间发生错误：");
}
/**
 * 清除所有的直播流
 *
 * @async
 * @returns {Object}
 * @throws {Error}
 */
export async function clearAllStreams(): Promise<void> {
  const tasks = Array.from(childProcesses.entries()).map(
    ([unique_id, childProcess]) =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (resolve) => {
        await redisClient.set(unique_id, "true");
        childProcess.kill("SIGKILL");
        resolve(null);
      })
  );

  await Promise.all(tasks);

  childProcesses.clear();
  await LiveStream.clearAll();
}
