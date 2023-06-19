import fs from "fs";
import path from "path";
import { asyncHandler } from "../utils/handler";
import { reloadDb } from "../db";
import { EmailService } from "../utils/sendEmail";

export async function getServerConfig(ctx: any) {
  await asyncHandler(async () => {
    // 使用当前工作目录而不是 __dirname
    const configPath = path.resolve(process.cwd(), "./config/");
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath);
    }
    const configFilePath = path.resolve(configPath, "config.json");
    let flag: number = 0;
    let fileData: any = {};
    if (fs.existsSync(configFilePath)) {
      flag = 1; // 如果 config.json 不存在，直接返回
      fileData = JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    }
    ctx.body = {
      data: {
        config: flag,
        data: fileData,
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
    const configPath = path.resolve(process.cwd(), "./config/");
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath);
    }
    const configFilePath = path.resolve(configPath, "config.json");
    // 写入文件
    fs.writeFileSync(configFilePath, JSON.stringify(data));
    await reloadDb();
    if (data.is_email) {
      await EmailService.reloadInstance();
    }
    ctx.body = {
      message: "更新配置信息成功",
    };
  }, "更新配置信息失败");
}
