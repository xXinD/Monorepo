// src/db/index.ts
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export async function initDb(): Promise<Database> {
  const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(
    `CREATE TABLE IF NOT EXISTS live_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 主键ID, 并设置为自增
    unique_id TEXT UNIQUE, -- 唯一id
    name TEXT, -- 直播名称
    platform TEXT, -- 直播平台
    status INTEGER, -- 直播状态
    streamingAddress TEXT, -- 推流地址
    streamingCode TEXT, -- 推流密钥
    roomAddress TEXT, -- 房间地址
    fileType TEXT, -- 视频文件类型
    videoDir TEXT, -- 视频文件所在目录
    fileName TEXT, -- 视频文件名称
    encoder TEXT, -- 编码器
    isItHardware INTEGER, -- 是否开启硬件加速，这里我将其作为整数类型，以便存储布尔值（0表示false，1表示true）
    encodingMode INTEGER, -- 码率模式
    bitRateValue INTEGER, -- 码率值
    resolvingPower TEXT, -- 分辨率
    watermark_enabled INTEGER, -- 是否启用水印
    watermark_img TEXT, -- 水印图片路径
    watermark_width INTEGER, -- 水印图片宽度
    watermark_position INTEGER, -- 水印位置
    transition_type INTEGER, -- 转场效果类型
    simple_transition INTEGER, -- 选择简单转场效果
    complex_transition INTEGER -- 选择复杂转场效果
    start_time TEXT -- 开始时间
  )`
  );
  await db.exec(
    `CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_id TEXT UNIQUE, -- 唯一id
      name TEXT,
      video_dir TEXT,
      file_type TEXT,
      update_date TEXT
    )`
  );
  return db;
}

let dbInstance: Database | undefined;

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }

  return dbInstance;
}

export async function connectDb() {
  if (!dbInstance) {
    dbInstance = await initDb();
  }
}
