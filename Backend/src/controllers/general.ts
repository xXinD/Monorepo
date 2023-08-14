import fs from "fs";
import path from "path";
import { asyncHandler, convertToSegments, getFontList } from "../utils/handler";
import { reloadDb } from "../db";
import { EmailService } from "../utils/sendEmail";
import MyWebSocketServer from "../utils/MyWebSocketServer";

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

/**
 * 查询系统字体列表
 *
 * @async
 * @returns {Object}
 * @throws {Error}
 * @param ctx
 */
export async function getTheListOfSystemFonts(ctx: any) {
  await asyncHandler(async () => {
    const fontList = getFontList();
    ctx.body = {
      message: "查询字体列表成功",
      data: fontList,
    };
  }, "查询字体列表失败");
}

/**
 * 分割视频为多个ts段落
 *
 * @async
 * @returns {Object}
 * @throws {Error}
 * @param ctx
 */
export async function postPlaylist(ctx: any) {
  const { sourcePath, segmentName, segmentDuration, framerate, bitrate } =
    ctx.request.body;
  await asyncHandler(async () => {
    await convertToSegments(
      sourcePath,
      segmentName,
      segmentDuration,
      framerate,
      bitrate
    );
    const myWebSocketServer = MyWebSocketServer.getInstance(8080);
    ctx.body = {
      message: "已开启分割任务",
      data: {
        wsServer: myWebSocketServer.getAddress(),
      },
    };
  }, "分割任务启动失败");
}
