import { createPool, Pool } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../utils/handler";
import errorJson from "../config/errorMessages.json";

async function initDb(): Promise<Pool> {
  return await asyncHandler(async () => {
    const config = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), "./config/config.json"),
        "utf-8"
      )
    );
    const pool = createPool({
      host: config.sql_address,
      port: config.sql_port ?? 3306,
      user: config.sql_user,
      password: config.sql_password,
      database: config.sql_database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await pool.getConnection();

    await conn.query(`CREATE TABLE IF NOT EXISTS live_streams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id TEXT UNIQUE,
    name TEXT,
    retweet INT,
    platform TEXT,
    status INT,
    streaming_address TEXT,
    streaming_code TEXT,
    room_address TEXT,
    fileType TEXT,
    video_dir TEXT,
    file_name TEXT,
    encoder TEXT,
    is_it_hardware INT,
    encoding_mode INT,
    bit_rate_value INT,
    resolving_power TEXT,
    watermark_enabled INT,
    watermark_img TEXT,
    watermark_width INT,
    watermark_position INT,
    transition_type INT,
    simple_transition INT,
    complex_transition INT,
    start_time TEXT
  )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id TEXT UNIQUE,
    name TEXT,
    video_dir TEXT,
    file_type TEXT,
    update_date TEXT
  )`);

    await conn.query(`CREATE TABLE IF NOT EXISTS streaming_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id TEXT UNIQUE,
    platform TEXT,
    room_address TEXT,
    streaming_address TEXT,
    streaming_code TEXT,
    description TEXT,
    update_date INT
  )`);

    conn.release();
    return pool;
  }, errorJson.SQL_TABLE_CREATION_FAILED);
}

let dbInstance: Pool | undefined;

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }

  return dbInstance;
}

export async function connectDb() {
  return await asyncHandler(async () => {
    const configPath = path.resolve(process.cwd(), "./config/config.json");
    if (!fs.existsSync(configPath)) {
      return;
    }
    if (!dbInstance) {
      dbInstance = await initDb();
    }
  }, errorJson.SQL_CONNECTION_FAILED);
}

export async function reloadDb() {
  return await asyncHandler(async () => {
    if (dbInstance) {
      await dbInstance.end();
      dbInstance = undefined;
    }

    // 重新连接数据库
    await connectDb();
  }, errorJson.DB_RELOAD_FAILED);
}
