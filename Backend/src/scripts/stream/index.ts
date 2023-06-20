import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { LiveStream } from "../../models/LiveStream";
import { asyncHandler } from "../../utils/handler";
import redisClient from "../../utils/redisClient";
import { buildFFmpegCommand } from "./buildFFmpegCommand";
import {
  onClose,
  onData,
  onExit,
  onSignal,
  onSpawn,
} from "./streamEventHandlers";

// 子进程统一管理
export const childProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export interface LiveOptions {
  is_video_style?: number;
  unique_id?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  retweet?: string | number;
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

export async function updateLiveStreamStatus(id: string, status: number) {
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
export async function closeAllStreams(): Promise<void> {
  const tasks = Array.from(childProcesses.entries()).map(
    ([unique_id, childProcess]) =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (resolve, reject) => {
        try {
          await redisClient.set(unique_id, "true");
          childProcess.kill("SIGKILL");
          resolve(null);
        } catch (e) {
          reject(e);
        }
      })
  );
  await Promise.all(tasks);
  childProcesses.clear();
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
export async function playVideoFiles(options: LiveOptions, ctx: any) {
  console.log(options);
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
  console.log(args);
  const childProcess = spawn("ffmpeg", args);

  onData(childProcess, options);
  onClose(childProcess);
  onExit(childProcess, options, ctx);
  onSignal();
  await onSpawn(childProcess, options);
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
    const liveStream = await LiveStream.findById(unique_id);
    if (childProcess) {
      childProcess.kill("SIGKILL");
      childProcesses.delete(unique_id);
    }
    if (liveStream.status == 0) {
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
