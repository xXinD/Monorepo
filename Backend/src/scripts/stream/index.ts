import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import fs from "fs";
import { LiveStream } from "../../models/LiveStream";
import { asyncHandler } from "../../utils/handler";
import redisClient from "../../utils/redisClient";
import { buildFFmpegCommand } from "./buildFFmpegCommand";
import { onData, onExit, onSpawn } from "./streamEventHandlers";
import { creatSRS, SRS_ChildProcesses } from "../../controllers/resources";
import { Resources } from "../../models/Resources";
import { StreamAddress } from "../../models/StreamAdress";
import { startLive } from "../../controllers/live";

// 子进程统一管理
export const childProcesses = new Map<string, ChildProcessWithoutNullStreams>();

export interface LiveOptions {
  start_broadcasting?: number;
  sourcePath?: string;
  title?: string;
  room_id?: string;
  stream_id: string;
  is_video_style?: number;
  unique_id?: string;
  // 直播间 ID
  id?: string;
  platform?: string;
  // 直播状态
  state?: string;
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
  encoding_mode?: number;
  // 码率值
  bit_rate_value?: number;
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
          childProcess.kill("SIGINT");
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
export async function playVideoFiles(
  options: LiveOptions & StreamAddress,
  ctx: any
) {
  // 检查是否有重复推流
  if (childProcesses.has(options.unique_id)) {
    await redisClient.set(options.unique_id, "true");
    childProcesses.get(options.unique_id)?.kill("SIGINT");
    childProcesses.delete(options.unique_id);
  }
  await redisClient.del(options.unique_id);

  // 检查是否需要SRS转发，并且判断是否有 SRS 进程
  const SRS = await Resources.findById(options.video_dir);
  options.sourcePath = SRS.video_dir;
  // 构建 ffmpeg 命令行参数
  const args = await buildFFmpegCommand(options);
  const childProcess = spawn("ffmpeg", args);

  onData(childProcess, options);
  onExit(childProcess, options, ctx);
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
  const streamAddress = await StreamAddress.findById(options.stream_id);
  return playVideoFiles(
    {
      ...streamAddress,
      ...options,
    } as any,
    ctx
  );
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
      childProcess.kill("SIGINT");
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
      childProcess.kill("SIGINT");
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
        childProcess.kill("SIGINT");
        resolve(null);
      })
  );

  await Promise.all(tasks);

  childProcesses.clear();
  await LiveStream.clearAll();
}
export async function initLiveStream() {
  const configPath = path.resolve(process.cwd(), "./config/");
  const configFilePath = path.resolve(configPath, "config.json");
  if (fs.existsSync(configPath) && fs.existsSync(configFilePath)) {
    const liveStream = await LiveStream.findAll();
    liveStream.map(async (_item) => {
      await startLive({
        request: {
          body: {
            ..._item,
            is_restart: true,
          },
        },
      });
    });
  }
}
