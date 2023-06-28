/**
 * @author XinD
 * @date 2023/6/9
 * @description 直播地址管理
 */
import { RowDataPacket } from "mysql2";
import { getDb } from "../db";
import { asyncHandler } from "../utils/handler";
import errorJson from "../config/errorMessages.json";

export class StreamAddress {
  id?: number;

  unique_id: string;

  platform: string;

  room_id: string;

  start_broadcasting: number;

  streaming_address: string;

  streaming_code: string;

  title?: string;

  areaId?: number;

  childAreaId?: string;

  description?: string;

  update_date?: string;

  /**
   * 查询所有直播地址
   *
   * @async
   * @returns {Array} db.query() 返回的结果。
   */
  static async findAll(): Promise<StreamAddress[]> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query("SELECT * FROM streaming_addresses");
      return (rows as RowDataPacket[]).map((row) =>
        Object.assign(new StreamAddress(), row)
      );
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 根据 ID 查询地址
   *
   * @async
   * @returns {Object | null} db.query() 返回的结果。
   * @throws {Error} 直播不存在
   * @param unique_id
   */
  static async findById(
    unique_id: string | number
  ): Promise<StreamAddress | null> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query(
        "SELECT * FROM streaming_addresses WHERE unique_id = ?",
        [unique_id]
      );
      const row = (rows as RowDataPacket[])[0];

      if (row) {
        return Object.assign(new StreamAddress(), row);
      }
      return null;
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 更新地址
   *
   * @async
   * @param unique_id
   * @param {Object} data 要更新的数据
   */
  static async update(
    unique_id: string | number,
    data: Partial<StreamAddress>
  ): Promise<StreamAddress> {
    return await asyncHandler(async () => {
      const db = getDb();
      // 查询当前直播信息
      const streaming_addresses = await this.findById(unique_id);

      if (!streaming_addresses) {
        throw new Error("资源不存在");
      }

      // 更新允许修改的字段
      const fields = Object.keys(data);
      const values = Object.values(data);

      const setClause = fields.map((field) => `${field} = ?`).join(", ");

      await db.query(
        `UPDATE streaming_addresses SET ${setClause} WHERE unique_id = ?`,
        [...values, unique_id]
      );
      return await this.findById(unique_id);
    }, errorJson.SQL_UPDATE_ERROR);
  }

  /**
   * 新增地址
   *
   * @async
   * @param {Object} options 资源配置
   */
  static async create(options: StreamAddress): Promise<StreamAddress> {
    return await asyncHandler(async () => {
      const db = getDb();
      const fields = Object.keys(options);
      const values = Object.values(options);

      const placeholders = fields.map(() => "?").join(", ");
      const fieldNames = fields.join(", ");
      try {
        await db.query(
          `INSERT INTO streaming_addresses (${fieldNames}) VALUES (${placeholders})`,
          values
        );
      } catch (error) {
        console.error("SQ error: ", error.message);
      }

      return StreamAddress.findById(options.unique_id);
    }, errorJson.SQL_CREATE_ERROR);
  }

  /**
   * 删除数据库中的地址
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   * @param uniqueId
   */
  static async delete(uniqueId: string): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM streaming_addresses WHERE unique_id = ?", [
        uniqueId,
      ]);
    }, errorJson.SQL_DELETE_ERROR);
  }

  /**
   * 清空数据库中的所有地址
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   */
  static async clearAll(): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.query("DELETE FROM streaming_addresses");
    }, errorJson.SQL_DELETE_ERROR);
  }
}
