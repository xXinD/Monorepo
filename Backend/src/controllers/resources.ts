/**
 * @author XinD
 * @date 2023/4/18
 * @description 视频源相关接口
 */
import { v4 as uuidv4 } from "uuid";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Resources } from "../models/Resources";
import {
  onData,
  onExit,
  onSignal,
  onSpawn,
} from "../scripts/SRS_EventHandlers";

export const SRS_ChildProcesses = new Map<
  string,
  ChildProcessWithoutNullStreams
>();
export const creatSRS = async (options: {
  streaming_code: string;
  video_dir: string;
}) => {
  const args = [
    "-re",
    "-i",
    options.video_dir,
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-f",
    "flv",
    // `rtmp://localhost/live/${options.streaming_code}`,
    `rtmp://${
      process.env.ENV_VAR === "development" ? "localhost" : "SRS"
    }/live/${options.streaming_code}`,
  ];
  const childProcess = spawn("ffmpeg", args);
  SRS_ChildProcesses.set(options.streaming_code, childProcess);
  onData(childProcess, options.streaming_code);
  onExit(childProcess, {
    unique_id: options.streaming_code,
    video_dir: options.video_dir,
  });
  onSignal();
  await onSpawn(
    childProcess,
    options.streaming_code,
    options as Resources & { streaming_code: string; video_dir: string }
  );
};
/**
 * 查询资源列表
 *
 * @async
 * @returns {Object} db.all() 返回的结果。
 */
export const getResourcesList = async (ctx: any): Promise<void> => {
  try {
    // 查询数据库并获取直播列表
    ctx.body = {
      message: "获取资源列表成功",
      data: await Resources.findAll(),
    };
    // 返回直播列表
  } catch (error) {
    ctx.statu = 500;
    ctx.body = { message: "获取直播列表失败", error };
  }
};

/**
 * @author XinD
 * @date 2023/6/5
 * @description 创建资源
 * @param ctx
 */
export async function createResources(ctx: any) {
  const data = ctx.request.body;

  const uniqueId = uuidv4();
  try {
    ctx.body = await creatSRS({
      ...data,
      streaming_code: uniqueId,
      video_dir: data.video_dir,
    });
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "新增资源失败",
      error,
    };
  }
}

/**
 * @author XinD
 * @date 2023/6/5
 * @description 修改资源
 * @param ctx
 * @returns
 */
export async function updateResources(ctx: any) {
  const { unique_id } = ctx.params;
  const data = ctx.request.body;
  // 验证输入数据
  if (Object.keys(data).length === 0) {
    ctx.throw(400, "请提供要更新的字段");
  }
  try {
    const SRS = SRS_ChildProcesses.get(unique_id);
    if (SRS) {
      SRS.kill("SIGINT");
      SRS_ChildProcesses.delete(unique_id);
    }
    await creatSRS({
      streaming_code: unique_id,
      video_dir: data.video_dir,
    });
    // 根据提供的直播 ID 和新的直播信息更新数据库中的记录
    const afterUpdate = await Resources.update(unique_id, data);
    // 返回创建的直播间信息
    ctx.body = {
      message: "修改信息成功",
      data: afterUpdate,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "修改信息失败",
      error,
    };
  }
}
export async function delResources(ctx: any) {
  const { id } = ctx.params;
  try {
    const SRS = SRS_ChildProcesses.get(id);
    if (SRS) {
      SRS.kill("SIGINT");
      SRS_ChildProcesses.delete(id);
    }
    await Resources.delete(id);
    ctx.body = { message: "删除资源成功" };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { message: "数据库操作失败", e };
  }
}

export async function getResourcesFileTypes(ctx: any) {
  try {
    ctx.body = {
      message: "查询成功",
      data: await Resources.findAllFileTypes(),
    };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { message: "数据库操作失败", e };
  }
}
export async function getResourcesByFileType(ctx: any) {
  const { file_type } = ctx.request.body;
  try {
    ctx.body = {
      message: "查询成功",
      data: await Resources.findByFileType(file_type),
    };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { message: "数据库操作失败", e };
  }
}

/**
 *关闭所有SRS流
 *
 * @async
 * @param {Object}
 * @returns {Object}
 * @throws {Error}
 */
export async function stopAllSRS(): Promise<void> {
  const tasks = Array.from(SRS_ChildProcesses.entries()).map(
    ([unique_id, childProcess]) =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (resolve, reject) => {
        try {
          childProcess.kill("SIGINT");
          const resources = await Resources.findById(unique_id);
          await Resources.update(unique_id, {
            ...resources,
            status: 1,
          });
          resolve(null);
        } catch (e) {
          reject(e);
        }
      })
  );

  await Promise.all(tasks);

  SRS_ChildProcesses.clear();
}
