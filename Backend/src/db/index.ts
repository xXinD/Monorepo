import { createPool, Pool } from "mysql2/promise";

async function initDb(): Promise<Pool> {
  const pool = createPool({
    host: "143.110.159.133",
    user: "xindong",
    password: "199615xin",
    database: "database", // 需要填写你的数据库名称
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
    streamingAddress TEXT,
    streamingCode TEXT,
    roomAddress TEXT,
    fileType TEXT,
    videoDir TEXT,
    fileName TEXT,
    encoder TEXT,
    isItHardware INT,
    encodingMode INT,
    bitRateValue INT,
    resolvingPower TEXT,
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
