/**
 * @author XinD
 * @date 2023/4/18
 * @description 资源相关接口
 */
import { v4 as uuidv4 } from "uuid";
import { StreamAddress } from "../models/StreamAdress";
/**
 * 查询资源列表
 *
 * @async
 * @returns {Object} db.all() 返回的结果。
 */
export const getStreamAddressList = async (ctx: any): Promise<void> => {
  try {
    // 查询数据库并获取直播列表
    ctx.body = {
      message: "获取地址列表成功",
      data: await StreamAddress.findAll(),
    };
    // 返回直播列表
  } catch (error) {
    ctx.statu = 500;
    ctx.body = { message: "获取列表失败", error };
  }
};

/**
 * @author XinD
 * @date 2023/6/5
 * @description 新增地址
 * @param ctx
 */
export async function createStreamAddressList(ctx: any) {
  const data = ctx.request.body;

  const uniqueId = uuidv4();
  try {
    ctx.body = await StreamAddress.create({
      ...data,
      unique_id: data?.unique_id ? data?.unique_id : uniqueId,
    });
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      message: "新增地址失败",
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
export async function updateStreamAddress(ctx: any) {
  const { unique_id } = ctx.params;
  const data = ctx.request.body;
  // 验证输入数据
  if (Object.keys(data).length === 0) {
    ctx.throw(400, "请提供要更新的字段");
  }
  try {
    // 根据提供的直播 ID 和新的直播信息更新数据库中的记录
    const afterUpdate = await StreamAddress.update(unique_id, data);
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
export async function delStreamAddress(ctx: any) {
  const { id } = ctx.params;
  try {
    await StreamAddress.delete(id);
    ctx.body = { message: "删除资源成功" };
  } catch (e) {
    ctx.status = 500;
    ctx.body = { message: "数据库操作失败", e };
  }
}
