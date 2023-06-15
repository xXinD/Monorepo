import fs from "fs";
import path from "path";
import { asyncHandler } from "../utils/handler";
import { reloadDb } from "../db";

export async function getServerConfig(ctx: any) {
  await asyncHandler(async () => {
    const configPath = path.resolve(__dirname, "../config/config.json");
    let flag: number = 0;
    if (fs.existsSync(configPath)) {
      flag = 1; // 如果 config.json 不存在，直接返回
    }
    ctx.body = {
      data: {
        config: flag,
      },
    };
  }, "服务、数据库等配置不存在");
}
/**
 * 修改服务配置信息
 *
 * @async
 * @returns {Object}
 * @throws {Error}
 * @param ctx
 */
export async function updateServerConfig(ctx: any) {
  const data = ctx.request.body;

  await asyncHandler(async () => {
    // 写入文件
    fs.writeFileSync(
      path.resolve(__dirname, "../config/", "config.json"),
      JSON.stringify(data)
    );
    await reloadDb();
    ctx.body = {
      message: "更新配置信息成功",
    };
  }, "修改配置信息失败");
}
