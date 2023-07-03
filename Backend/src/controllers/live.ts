/**
 * @author XinD
 * @date 2023/4/18
 * @description 直播推流相关接口
 */
import { v4 as uuidv4 } from "uuid";
import { DefaultState, ParameterizedContext } from "koa";
import {
  clearAllStreams,
  delStreaming,
  startStreaming,
  stopStreaming,
  updateLiveStreamStatus,
} from "../scripts/stream";
import { LiveStream } from "../models/LiveStream";
import { asyncHandler } from "../utils/handler";
import { StreamAddress } from "../models/StreamAdress";
import { bilibiliService } from "./bilibili";

function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
/**
 * 开始推流直播。
 *
 * @async
 * @param {string} ctx.request.body.name 直播间名称。
 * @param {string} ctx.request.body.video_dir 视频文件目录。
 * @param {boolean} ctx.request.body.watermarkEnabled 是否添加水印。
 * @param {string} ctx.request.body.watermarkImg 水印图片路径。
 * @returns {Object} 直播间信息对象。
 * @throws {Error} 如果平台参数为空，则抛出异常。
 */
export async function startLive(ctx: any) {
  const { stream_id, unique_id, is_restart } = ctx.request.body;
  await asyncHandler(async () => {
    const streamAddress = await StreamAddress.findById(stream_id);
    const uniqueId = uuidv4();
    if (streamAddress.platform === "bilibili") {
      const { live_status } = await bilibiliService.roomStatusInfo(
        streamAddress.unique_id
      );
      if (is_restart) {
        await delay(10000);
      }
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
          1800000;
        console.error(
          `封禁截止时间：【${lock_till}】 当前时间：【${currentTime}】 等待开播倒计时：【${waitTime}】`
        );
        if (waitTime > 0) {
          await delay(waitTime);
        }
      }
      if (!live_status) {
        await bilibiliService.startLive({
          id: streamAddress.unique_id,
          area_v2: streamAddress.childAreaId,
        });
      }
    }
    const res = await startStreaming(
      {
        unique_id: unique_id ?? uniqueId,
        ...ctx.request.body,
        watermarkEnabled: false,
        stream_id: streamAddress.unique_id,
      },
      ctx
    );
    // 返回创建的直播间信息
    ctx.body = {
      message: "创建直播间成功",
      res,
    };
  }, "创建直播间失败");
}

/**
 * 查询直播列表
 *
 * @async
 * @returns {Object} db.all() 返回的结果。
 */

export const getLiveStreamList = async (ctx: any): Promise<void> => {
  await asyncHandler(async () => {
    // 查询数据库并获取直播列表
    ctx.body = await LiveStream.findAll();
  }, "查询直播列表失败：");
};

/**
 * 推流直播详情查询
 *
 * @async
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 直播间信息对象。
 * @throws {Error} 如果直播间不存在，则抛出异常。
 */
export async function getLiveStream(ctx: any) {
  const { id } = ctx.params;

  await asyncHandler(async () => {
    // 使用 LiveStream 类的 findById 方法查询直播详情
    const liveStream = await LiveStream.findById(id);

    if (liveStream) {
      ctx.body = liveStream;
    } else {
      ctx.status = 404;
      ctx.body = { error: "未找到直播" };
    }
  }, "数据库操作失败：");
}

/**
 * 修改直播信息
 *
 * @async
 * @param {number} ctx.request.body.id 直播间 ID。
 * @param {Object} ctx.request.body 更新的字段。
 * @returns {Object} 直播间信息对象。
 * @throws {Error} 如果直播间不存在，则抛出异常。
 */
export async function updateLiveInfo(ctx: ParameterizedContext<DefaultState>) {
  const { id } = ctx.params;
  const data = ctx.request.body;
  // 验证输入数据
  if (Object.keys(data).length === 0) {
    ctx.status = 500;
    ctx.body = {
      message: "请提供要更新的字段",
    };
  }
  await asyncHandler(async () => {
    // 从数据库中查找直播记录
    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      ctx.throw(404, "直播不存在");
    }
    // 根据提供的直播 ID 和新的直播信息更新数据库中的记录
    const afterUpdate = await LiveStream.update(id, data);
    await stopStreaming(afterUpdate.unique_id);
    await startStreaming(afterUpdate, ctx);
    // 返回创建的直播间信息
    ctx.body = {
      message: "修改直播信息成功，已重新开始推流",
      data: afterUpdate,
    };
  }, "修改直播间信息失败");
}

export async function startSpecifiedLive(ctx: any) {
  const { id } = ctx.params;
  await asyncHandler(async () => {
    // 从数据库中查找直播记录
    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      ctx.status = 404;
      ctx.body = { error: "未查询找到相关直播信息" };
    } else {
      const res = await startLive({
        ...ctx,
        request: {
          ...ctx.request,
          body: {
            ...liveStream,
          },
        },
      });
      // 返回创建的直播间信息
      ctx.body = {
        message: "创建直播间成功",
        res,
      };
    }
  }, "启动直播间失败：");
}

/**
 * 关闭指定直播推流任务
 *
 * @async
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function stopLive(ctx: ParameterizedContext<DefaultState>) {
  const { id } = ctx.params;
  await asyncHandler(async () => {
    const liveStream = await LiveStream.findById(id);
    if (liveStream && liveStream.status === 0) {
      await stopStreaming(id);
      ctx.body = { message: "直播已停止" };
    } else {
      ctx.status = 404;
      ctx.body = { error: "未找到直播或已停止" };
    }
  }, "关闭指定直播失败：");
}

/**
 * @author XinD
 * @date 2023/6/4
 * @description 关闭&清除指定直播推流任务
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function delLiveStream(ctx: ParameterizedContext<DefaultState>) {
  const { id } = ctx.params;
  await asyncHandler(async () => {
    await delStreaming(id, ctx);
    ctx.body = { message: "直播已停止并删除" };
  }, "关闭&清除指定直播失败：");
}

/**
 * 关闭&清除所有直播推流任务
 *
 * @async
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function stopLiveALl(ctx: ParameterizedContext<DefaultState>) {
  await asyncHandler(async () => {
    await clearAllStreams();
    ctx.body = { message: "直播已清空" };
  }, "关闭&清除所有直播失败：");
}
