/**
 * @author XinD
 * @date 2023/4/19
 * @description 直播流模型
 */
import { getDb } from "../db";
import { LiveOptions } from "../scripts/streaming";
import { getVideoResolution } from "../utils/stringUtils";

export class LiveStream {
  id?: string;

  unique_id: string;

  name: string;

  status: number;

  start_time: string;

  streamingAddress: string;

  streamingCode: string;

  bitRateValue: number;

  encodingMode: number;

  roomAddress?: string;

  videoDir: string;

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
   * @returns {Array} db.all() 返回的结果。
   */
  static async findAll(): Promise<LiveStream[]> {
    const db = getDb();
    const rows = await db.all("SELECT * FROM live_streams");
    return rows.map((row) => Object.assign(new LiveStream(), row));
  }

  /**
   * 根据 ID 查询直播流
   *
   * @async
   * @param {string | number} id 直播流 ID
   * @returns {Object | null} db.get() 返回的结果。
   * @throws {Error} 直播不存在
   */
  static async findById(
    unique_id: string | number,
  ): Promise<LiveStream | null> {
    const db = getDb();
    const row = await db.get("SELECT * FROM live_streams WHERE unique_id = ?", [
      unique_id,
    ]);

    if (row) {
      return Object.assign(new LiveStream(), row);
    }
    return null;
  }

  /**
   * 更新直播流
   *
   * @async
   * @param {string | number} id 直播流 ID
   * @param {Object} data 要更新的数据
   */
  static async update(
    unique_id: string | number,
    data: Partial<LiveStream>,
  ): Promise<LiveStream> {
    const db = getDb();

    // 查询当前直播信息
    const liveStream = await this.findById(unique_id);

    if (!liveStream) {
      throw new Error("直播不存在");
    }

    // 如果直播状态是开启，必填项不可以修改
    if (liveStream.status === 0) {
      delete data.unique_id;
      delete data.name;
      delete data.start_time;
      delete data.streamingAddress;
      delete data.streamingCode;
    }

    // 更新允许修改的字段
    const fields = Object.keys(data);
    const values = Object.values(data);

    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    await db.run(`UPDATE live_streams SET ${setClause} WHERE unique_id = ?`, [
      ...values,
      unique_id,
    ]);
    const afterUpdate = await this.findById(unique_id);
    return afterUpdate;
  }

  /**
   * 新增直播流
   *
   * @async
   * @param {Object} options 直播流配置
   */
  static async create(options: LiveOptions): Promise<LiveStream> {
    const VideoResolution = await getVideoResolution(options.videoDir);
    const db = getDb();
    const data = {
      unique_id: options.uniqueId,
      name: options.name,
      streamingAddress: options.streamingAddress,
      streamingCode: options.streamingCode,
      roomAddress: options.roomAddress,
      status: "0",
      video_dir: options.videoDir,
      isItHardware: !!options.isItHardware,
      encoder: options.encoder ? options.encoder : "h264",
      encodingMode: options.encodingMode,
      bitRateValue: options.bitRateValue,
      resolvingPower: options.resolvingPower
        ? options.resolvingPower
        : `${VideoResolution.width}x${VideoResolution.height}`,
      watermark_enabled: options.watermarkEnabled ? 1 : 0,
      watermark_img: options.watermarkImg,
      watermark_width: options.watermarkWidth,
      watermark_position: options.watermarkPosition,
      transition_type: options.transitionType,
      simple_transition: options.simpleTransition,
      complex_transition: options.complexTransition,
    };

    const fields = Object.keys(data);
    const values = Object.values(data);

    const placeholders = fields.map(() => "?").join(", ");
    const fieldNames = fields.join(", ");

    await db.run(
      `INSERT INTO live_streams (${fieldNames}) VALUES (${placeholders})`,
      values,
    );

    return LiveStream.findById(options.uniqueId);
  }

  /**
   * 删除数据库中的直播记录
   *
   * @async
   * @param {string} unique_id 直播间 unique_id
   * @returns {Promise<void>} Promise 对象
   */
  static async delete(uniqueId: string): Promise<void> {
    const db = getDb();
    await db.run("DELETE FROM live_streams WHERE unique_id = ?", [uniqueId]);
  }

  /**
   * 清空数据库中的所有直播流记录
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   */
  static async clearAll(): Promise<void> {
    const db = getDb();
    await db.run("DELETE FROM live_streams");
  }
}
