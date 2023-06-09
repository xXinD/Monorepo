/**
 * @author XinD
 * @date 2023/4/18
 * @description 直播推流相关接口
 */
import { v4 as uuidv4 } from "uuid";
import {
  clearAllStreams,
  delStreaming,
  LiveOptions,
  startStreaming,
  stopStreaming,
} from "../scripts/streaming";
import { validateLiveOptions } from "./validateLiveOptions";
import { LiveStream } from "../models/LiveStream";
import { asyncHandler } from "../utils/handler";

type RtmpLiveOptions = Pick<
  LiveOptions,
  "streaming_address" | "streaming_code" | "video_dir"
>;

/**
 * 开始推流直播。
 *
 * @async
 * @param {string} ctx.request.body.name 直播间名称。
 * @param {string} ctx.request.body.streaming_address RTMP 服务器地址。
 * @param {string} ctx.request.body.streaming_code 推流码。
 * @param {string} ctx.request.body.video_dir 视频文件目录。
 * @param {boolean} ctx.request.body.watermarkEnabled 是否添加水印。
 * @param {string} ctx.request.body.watermarkImg 水印图片路径。
 * @returns {Object} 直播间信息对象。
 * @throws {Error} 如果平台参数为空，则抛出异常。
 */
export async function startLive(ctx: any) {
  const { name, streaming_address, streaming_code } = ctx.request.body;
  // 检查必填参数是否为空
  const invalidOption = validateLiveOptions(<LiveOptions>(<RtmpLiveOptions>{
    name,
    streaming_address,
    streaming_code,
    watermarkEnabled: false,
  }));
  if (invalidOption) {
    ctx.status = 400;
    ctx.body = {
      error: "请求无效，请审查请求参数",
      message: invalidOption,
    };
    return;
  }
  const uniqueId = uuidv4();

  await asyncHandler(async () => {
    const res = await startStreaming(
      {
        unique_id: uniqueId,
        ...ctx.request.body,
        watermarkEnabled: false,
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
  try {
    // 查询数据库并获取直播列表
    ctx.body = await LiveStream.findAll();
    // 返回直播列表
  } catch (error) {
    ctx.statu = 500;
    ctx.body = { message: "获取直播列表失败", error };
  }
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

  // 使用 LiveStream 类的 findById 方法查询直播详情
  const liveStream = await LiveStream.findById(id);

  if (liveStream) {
    ctx.body = liveStream;
  } else {
    ctx.status = 404;
    ctx.body = { error: "未找到直播" };
  }
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
export async function updateLiveInfo(ctx: any) {
  const { id } = ctx.params;
  const data = ctx.request.body;
  // 验证输入数据
  if (Object.keys(data).length === 0) {
    ctx.status = 500;
    ctx.body = {
      message: "请提供要更新的字段",
    };
  }

  // 从数据库中查找直播记录
  const liveStream = await LiveStream.findById(id);

  if (!liveStream) {
    ctx.throw(404, "直播不存在");
  }

  // 根据提供的直播 ID 和新的直播信息更新数据库中的记录
  const afterUpdate = await LiveStream.update(id, data);
  try {
    await startStreaming(afterUpdate, ctx);
    // 返回创建的直播间信息
    ctx.body = {
      message: "修改直播信息成功，已重新开始推流",
      data: afterUpdate,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "创建直播间失败",
      error,
    };
  }
}

/**
 * 重启直播
 *
 * @async
 * @param {number} ctx.request.body.id 直播间 ID。
 * @returns {Object} 直播间信息对象。
 * @throws {Error} 如果直播间不存在，则抛出异常。
 */
export async function restartLive(ctx: any) {
  const { id } = ctx.request.body;

  // 从数据库中查找直播记录
  const liveStream = await LiveStream.findById(id);
  if (!liveStream) {
    ctx.status = 404;
    ctx.body = { error: "未查询找到相关直播信息" };
  } else {
  }
}

export async function startSpecifiedLive(ctx: any) {
  const { id } = ctx.params;
  // 从数据库中查找直播记录
  const liveStream = await LiveStream.findById(id);
  if (!liveStream) {
    ctx.status = 404;
    ctx.body = { error: "未查询找到相关直播信息" };
  } else {
    try {
      const res = await startStreaming(liveStream, ctx);
      // 返回创建的直播间信息
      ctx.body = {
        message: "创建直播间成功",
        res,
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: "创建直播间失败",
        error,
      };
    }
  }
}

/**
 * 关闭指定直播推流任务
 *
 * @async
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function stopLive(ctx: any) {
  const { id } = ctx.params;
  const liveStream = await LiveStream.findById(id);
  if (liveStream && liveStream.status === 0) {
    await stopStreaming(id);
    ctx.body = { message: "直播已停止" };
  } else {
    ctx.status = 404;
    ctx.body = { error: "未找到直播或已停止" };
  }
}

/**
 * @author XinD
 * @date 2023/6/4
 * @description 关闭&清除指定直播推流任务
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function delLiveStream(ctx: any) {
  const { id } = ctx.params;
  try {
    await delStreaming(id, ctx);
    ctx.body = { message: "直播已停止并删除" };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { message: "数据库操作失败", e };
  }
}

/**
 * 关闭&清除所有直播推流任务
 *
 * @async
 * @param {number} ctx.params.id 直播间 ID。
 * @returns {Object} 关闭直播推流任务的结果。
 * @throws {Error} 如果直播间不存在/已关闭，则抛出异常。
 */
export async function stopLiveALl(ctx: any) {
  try {
    await clearAllStreams();
    ctx.body = { message: "直播已清空" };
  } catch (e) {
    ctx.status = 404;
    ctx.body = { error: e };
  }
}
