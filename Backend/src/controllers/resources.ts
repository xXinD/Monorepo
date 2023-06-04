/**
 * @author XinD
 * @date 2023/4/18
 * @description 直播推流相关接口
 */
import { v4 as uuidv4 } from "uuid";
import { Resources } from "../models/Resources";

/**
 * 查询直播列表
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
export async function createResources(ctx: any) {
  const data = ctx.request.body;

  const uniqueId = uuidv4();

  try {
    ctx.body = await Resources.create({
      unique_id: uniqueId,
      ...data,
    });
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "新增资源失败",
      error,
    };
  }
}
