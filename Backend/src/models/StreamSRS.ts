/**
 * @author XinD
 * @date 2023/6/21
 * @description SRS转发
 */
import { RowDataPacket } from "mysql2";
import { getDb } from "../db";
import { asyncHandler } from "../utils/handler";
import errorJson from "../config/errorMessages.json";

export class StreamSRS {
  unique_id: string;

  id?: number;

  source_address: string;

  streaming_address: string;

  streaming_code: string;

  update_date: string;

  /**
   * 查询所有SRS配置
   *
   * @async
   * @returns {Array} db.query() 返回的结果。
   */
  static async findAll(): Promise<StreamSRS[]> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query("SELECT * FROM streaming_srs");
      return (rows as RowDataPacket[]).map((row) =>
        Object.assign(new StreamSRS(), row)
      );
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 根据 ID 查询SRS配置
   *
   * @async
   * @returns {Object | null} db.query() 返回的结果。
   * @throws {Error} 直播不存在
   * @param unique_id
   */
  static async findById(unique_id: string | number): Promise<StreamSRS | null> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query(
        "SELECT * FROM streaming_srs WHERE unique_id = ?",
        [unique_id]
      );
      const row = (rows as RowDataPacket[])[0];

      if (row) {
        return Object.assign(new StreamSRS(), row);
      }
      return null;
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 更新SRS配置
   *
   * @async
   * @param unique_id
   * @param {Object} data 要更新的数据
   */
  static async update(
    unique_id: string | number,
    data: Partial<StreamSRS>
  ): Promise<StreamSRS> {
    return await asyncHandler(async () => {
      const db = getDb();
      // 查询当前直播信息
      const streaming_srs = await this.findById(unique_id);

      if (!streaming_srs) {
        throw new Error("资源不存在");
      }

      // 更新允许修改的字段
      const fields = Object.keys(data);
      const values = Object.values(data);

      const setClause = fields.map((field) => `${field} = ?`).join(", ");

      await db.query(
        `UPDATE streaming_srs SET ${setClause} WHERE unique_id = ?`,
        [...values, unique_id]
      );
      return await this.findById(unique_id);
    }, errorJson.SQL_UPDATE_ERROR);
  }

  /**
   * 新增SRS配置
   *
   * @async
   * @param {Object} options 资源配置
   */
  static async create(options: StreamSRS): Promise<StreamSRS> {
    return await asyncHandler(async () => {
      const db = getDb();
      const fields = Object.keys(options);
      const values = Object.values(options);

      const placeholders = fields.map(() => "?").join(", ");
      const fieldNames = fields.join(", ");
      try {
        await db.query(
          `INSERT INTO streaming_srs (${fieldNames}) VALUES (${placeholders})`,
          values
        );
      } catch (error) {
        console.error("SQ error: ", error.message);
      }

      return StreamSRS.findById(options.unique_id);
    }, errorJson.SQL_CREATE_ERROR);
  }

  /**
   * 删除数据库中的SRS配置
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   * @param uniqueId
   */
  static async delete(uniqueId: string): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM streaming_srs WHERE unique_id = ?", [
        uniqueId,
      ]);
    }, errorJson.SQL_DELETE_ERROR);
  }

  /**
   * 清空数据库中的所有SRS配置
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   */
  static async clearAll(): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM streaming_srs");
    }, errorJson.SQL_DELETE_ERROR);
  }
}
