/**
 * @author XinD
 * @date 2023/4/19
 * @description 直播流模型
 */
import { getDb } from "../db";
import { LiveOptions } from "../scripts/streaming";

export class Resources {
  id?: number;

  name: string;

  video_dir: string;

  file_type: string;

  date: string;

  /**
   * 查询所有资源
   *
   * @async
   * @returns {Array} db.all() 返回的结果。
   */
  static async findAll(): Promise<Resources[]> {
    const db = getDb();
    const rows = await db.all("SELECT * FROM resources");
    return rows.map((row) => Object.assign(new Resources(), row));
  }

  /**
   * 根据 ID 查询资源
   *
   * @async
   * @returns {Object | null} db.get() 返回的结果。
   * @throws {Error} 直播不存在
   * @param unique_id
   */
  static async findById(unique_id: string | number): Promise<Resources | null> {
    const db = getDb();
    const row = await db.get("SELECT * FROM resources WHERE unique_id = ?", [
      unique_id,
    ]);

    if (row) {
      return Object.assign(new Resources(), row);
    }
    return null;
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

    await db.run(`UPDATE resources SET ${setClause} WHERE unique_id = ?`, [
      ...values,
      unique_id,
    ]);
    return await this.findById(unique_id);
  }

  /**
   * 新增资源
   *
   * @async
   * @param {Object} options 资源配置
   */
  static async create(options: LiveOptions): Promise<Resources> {
    const db = getDb();
    const fields = Object.keys(options);
    const values = Object.values(options);

    const placeholders = fields.map(() => "?").join(", ");
    const fieldNames = fields.join(", ");
    try {
      await db.run(
        `INSERT INTO resources (${fieldNames}) VALUES (${placeholders})`,
        values
      );
    } catch (error) {
      console.error("SQLite error: ", error.message);
    }

    return Resources.findById(options.uniqueId);
  }

  /**
   * 删除数据库中的资源
   *
   * @async
   * @param {string} unique_id 资源 unique_id
   * @returns {Promise<void>} Promise 对象
   */
  static async delete(uniqueId: string): Promise<void> {
    const db = getDb();
    await db.run("DELETE FROM resources WHERE unique_id = ?", [uniqueId]);
  }

  /**
   * 清空数据库中的所有直播流记录
   *
   * @async
   * @returns {Promise<void>} Promise 对象
   */
  static async clearAll(): Promise<void> {
    const db = getDb();
    await db.run("DELETE FROM resources");
  }

  /**
   * 查询所有不同的 file_type 值
   *
   * @async
   * @returns {Array} 返回包含所有不同 file_type 的数组。
   */
  static async findAllFileTypes(): Promise<string[]> {
    const db = getDb();
    const rows = await db.all("SELECT DISTINCT file_type FROM resources");
    return rows.map((row) => row.file_type);
  }

  /**
   * 根据 file_type 查询资源
   *
   * @async
   * @returns {Array} 返回匹配 file_type 的资源。
   * @param fileType
   */
  static async findByFileType(fileType: string): Promise<Resources[]> {
    const db = getDb();
    const rows = await db.all("SELECT * FROM resources WHERE file_type = ?", [
      fileType,
    ]);
    return rows.map((row) => Object.assign(new Resources(), row));
  }
}
