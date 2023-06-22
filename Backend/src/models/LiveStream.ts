/**
 * @author XinD
 * @date 2023/4/19
 * @description 直播流模型
 */
import { RowDataPacket } from "mysql2";
import { getDb } from "../db";
import { LiveOptions } from "../scripts/stream";
import { getVideoResolution } from "../utils/stringUtils";
import { asyncHandler } from "../utils/handler";
import errorJson from "../config/errorMessages.json";

export class LiveStream {
  id?: string;

  unique_id: string;

  name: string;

  status: number;

  start_time: string;

  streaming_address: string;

  streaming_code: string;

  bit_rate_value: number;

  encoding_mode: number;

  room_address?: string;

  video_dir: string;

  watermark_enabled: number;

  watermark_img: string;

  watermark_width: number;

  watermark_position: number;

  transition_type: number;

  simple_transition: number;

  complex_transition: number;

  lastPlayedFile?: string;

  /**
   * 查询所有直播流
   *
   * @async
   * @returns {Array} pool.query() 返回的结果。
   */
  static async findAll(): Promise<LiveStream[]> {
    return await asyncHandler(async () => {
      const db = getDb();
      const [rows] = await db.query("SELECT * FROM live_streams");
      return (rows as RowDataPacket[]).map((row: any) =>
        Object.assign(new LiveStream(), row)
      );
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 根据 ID 查询直播流
   *
   * @async
   * @param {string | number} unique_id 直播流 ID
   * @returns {Object | null} pool.query() 返回的结果。
   * @throws {Error} 直播不存在
   */
  static async findById(
    unique_id: string | number
  ): Promise<LiveStream | null> {
    const db = getDb();
    return asyncHandler(async () => {
      const [rows] = await db.query(
        "SELECT * FROM live_streams WHERE unique_id = ?",
        [unique_id]
      );
      const row = (rows as RowDataPacket[])[0];

      if (row) {
        return Object.assign(new LiveStream(), row);
      }
      return null;
    }, errorJson.SQL_QUERY_ERROR);
  }

  /**
   * 更新直播流
   *
   * @async
   * @param unique_id
   * @param {Object} data 要更新的数据
   */
  static async update(
    unique_id: string | number,
    data: Partial<LiveStream>
  ): Promise<LiveStream> {
    const db = getDb();
    return await asyncHandler(async () => {
      // 查询当前直播信息
      const liveStream = await this.findById(unique_id);

      if (!liveStream) {
        throw new Error("直播不存在");
      }

      const updatedData = { ...data }; // 创建data的副本

      // 如果直播状态是开启，必填项不可以修改
      if (liveStream.status === 0) {
        delete updatedData.unique_id;
        delete updatedData.streaming_address;
        delete updatedData.streaming_code;
      }

      // 更新允许修改的字段
      const fields = Object.keys(updatedData);
      const values = Object.values(updatedData);

      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      await db.execute(
        `UPDATE live_streams SET ${setClause} WHERE unique_id = ?`,
        [...values, unique_id]
      );
      return await this.findById(unique_id);
    }, errorJson.SQL_UPDATE_ERROR);
  }

  /**
   * 新增直播流
   *
   * @async
   * @param {Object} options 直播流配置
   */
  static async create(options: LiveOptions): Promise<LiveStream> {
    return await asyncHandler(async () => {
      const VideoResolution =
        options.fileType === "video"
          ? await getVideoResolution(options.video_dir)
          : { height: "-", width: "-" };
      const db = getDb();
      const data = {
        unique_id: options.unique_id || null,
        name: options.name || null,
        streaming_address: options.streaming_address || null,
        streaming_code: options.streaming_code || null,
        room_address: options.room_address || null,
        status: "0",
        fileType: options.fileType || null,
        file_name: options.file_name || null,
        video_dir: options.video_dir || null,
        is_it_hardware: !!options.is_it_hardware,
        is_video_style: options.is_video_style,
        encoder: options.encoder ? options.encoder : "h264",
        encoding_mode: options.encoding_mode || null,
        bit_rate_value: options.bit_rate_value || null,
        resolving_power: options.resolving_power
          ? options.resolving_power
          : `${VideoResolution.width}x${VideoResolution.height}`,
        platform: options.platform,
        watermark_enabled: options.watermarkEnabled ? 1 : 0,
        watermark_img: options.watermarkImg || null,
        watermark_width: options.watermarkWidth || null,
        watermark_position: options.watermarkPosition || null,
        transition_type: options.transitionType || null,
        simple_transition: options.simpleTransition || null,
        complex_transition: options.complexTransition || null,
      };

      const fields = Object.keys(data);
      const values = Object.values(data);

      const placeholders = fields.map(() => "?").join(", ");
      const fieldNames = fields.join(", ");
      await db.execute(
        `INSERT INTO live_streams (${fieldNames}) VALUES (${placeholders})`,
        values
      );

      return LiveStream.findById(options.unique_id);
    }, errorJson.SQL_CREATE_ERROR);
  }

  /**
   * 删除数据库中的直播记录
   *
   * @async
   * @param {string} unique_id 直播间 unique_id
   * @returns {Promise<void>} Promise 对象
   */
  static async delete(unique_id: string): Promise<void> {
    await asyncHandler(async () => {
      const db = getDb();
      await db.execute("DELETE FROM live_streams WHERE unique_id = ?", [
        unique_id,
      ]);
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
      await db.execute("DELETE FROM live_streams");
    }, errorJson.SQL_DELETE_ERROR);
  }
}
