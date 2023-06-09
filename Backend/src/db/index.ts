import { createPool, Pool } from "mysql2/promise";
import * as process from "process";

console.log(process.env.ENV_VAR, 1111);
async function initDb(): Promise<Pool> {
  const pool = createPool({
    host: "143.110.159.133",
    user: "xindong",
    password: "199615xin",
    database: `${
      process.env.ENV_VAR !== "production" ? "test_database" : "prod_database"
    }`, // 需要填写你的数据库名称
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const conn = await pool.getConnection();

  await conn.query(`CREATE TABLE IF NOT EXISTS live_streams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_id TEXT UNIQUE,
    name TEXT,
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
    start_broadcasting INT
  )`);

  conn.release();

  return pool;
}

let dbInstance: Pool | undefined;

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
