/**
 * @author XinD
 * @date 2023/6/9
 * @description 资源管理
 */
import { RowDataPacket } from "mysql2";
import { getDb } from "../db";
import { asyncHandler } from "../utils/handler";
import errorJson from "../config/errorMessages.json";

export class Resources {
  unique_id: string;

  id?: number;

  name: string;

  video_dir: string;

  file_type: string;

  date: string;

  /**
   * 查询所有资源
   *
   * @async
   * @returns {Array} db.query() 返回的结果。
   */
  static async findAll(): Promise<Resources[]> {
    return asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query("SELECT * FROM resources");
      return (rows as RowDataPacket[]).map((row) =>
        Object.assign(new Resources(), row)
      );
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 根据 ID 查询资源
   *
   * @async
   * @returns {Object | null} db.query() 返回的结果。
   * @throws {Error} 直播不存在
   * @param unique_id
   */
  static async findById(unique_id: string | number): Promise<Resources | null> {
    return asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query(
        "SELECT * FROM resources WHERE unique_id = ?",
        [unique_id]
      );
      const row = (rows as RowDataPacket[])[0];

      if (row) {
        return Object.assign(new Resources(), row);
      }
      return null;
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 更新资源
   *
   * @async
   * @param unique_id
   * @param {Object} data 要更新的数据
   */
  static async update(
    unique_id: string | number,
    data: Partial<Resources>
  ): Promise<Resources> {
    return asyncHandler(async () => {
      const db = getDb();
      // 查询当前直播信息
      const resources = await this.findById(unique_id);

      if (!resources) {
        throw new Error("资源不存在");
      }

      // 更新允许修改的字段
      const fields = Object.keys(data);
      const values = Object.values(data);

      const setClause = fields.map((field) => `${field} = ?`).join(", ");

      await db.query(`UPDATE resources SET ${setClause} WHERE unique_id = ?`, [
        ...values,
        unique_id,
      ]);
      return await this.findById(unique_id);
    }, errorJson.SQL_UPDATE_ERROR);
  }

  /**
   * 新增资源
   *
   * @async
   * @param {Object} options 资源配置
   */
  static async create(options: Resources): Promise<Resources> {
    return asyncHandler(async () => {
      const db = getDb();
      const fields = Object.keys(options);
      const values = Object.values(options);

      const placeholders = fields.map(() => "?").join(", ");
      const fieldNames = fields.join(", ");
      try {
        await db.query(
          `INSERT INTO resources (${fieldNames}) VALUES (${placeholders})`,
          values
        );
      } catch (error) {
        console.error("SQLite error: ", error.message);
      }

      return Resources.findById(options.unique_id);
    }, errorJson.SQL_CREATE_ERROR);
  }

  /**
   * 删除数据库中的资源
   *
   * @async
   * @param {string} unique_id 资源 unique_id
   * @returns {Promise<void>} Promise 对象
   */
  static async delete(unique_id: string): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM resources WHERE unique_id = ?", [unique_id]);
    }, errorJson.SQL_DELETE_ERROR);
  }

  /**
   * 清空数据库中的所有直播流记录
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   */
  static async clearAll(): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM resources");
    }, errorJson.SQL_DELETE_ERROR);
  }

  /**
   * 查询所有不同的 file_type 值
   *
   * @async
   * @returns {Array} 返回包含所有不同 file_type 的数组。
   */
  static async findAllFileTypes(): Promise<string[]> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query("SELECT DISTINCT file_type FROM resources");
      return (rows as RowDataPacket[]).map((row) => row.file_type);
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 根据 file_type 查询资源
   *
   * @async
   * @returns {Array} 返回匹配 file_type 的资源。
   * @param fileType
   */
  static async findByFileType(fileType: string): Promise<Resources[]> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query(
        "SELECT * FROM resources WHERE file_type = ?",
        [fileType]
      );
      return (rows as RowDataPacket[]).map((row) =>
        Object.assign(new Resources(), row)
      );
    }, errorJson.SQL_QUERY_ERROR);
  }
}
