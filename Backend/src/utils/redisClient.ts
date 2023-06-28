import { createClient } from "redis";
import path from "path";
import fs from "fs";

class RedisClientSingleton {
  private static instance: RedisClientSingleton;

  private client: any;

  private isConnected: boolean;

  private constructor() {
    this.client = null;
    this.isConnected = false;
  }

  public static getInstance(): RedisClientSingleton {
    if (!RedisClientSingleton.instance) {
      RedisClientSingleton.instance = new RedisClientSingleton();
    }
    return RedisClientSingleton.instance;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.ensureConnected();
    return await this.client.set(key, value);
  }

  public async get(key: string): Promise<any> {
    await this.ensureConnected();
    return await this.client.get(key);
  }

  public async del(key: string): Promise<void> {
    await this.ensureConnected();
    return await this.client.del(key);
  }

  public async keys(pattern: string): Promise<void> {
    await this.ensureConnected();
    return await this.client.keys(pattern);
  }

  public async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      RedisClientSingleton.instance = null;
    }
  }

  public async reloadConfigAndReconnect(): Promise<void> {
    await this.quit(); // 先断开连接
    // 读取新的 config.json 文件内容
    const configPath = path.resolve(process.cwd(), "./config/config.json");
    if (!fs.existsSync(configPath)) {
      return; // 如果 config.json 不存在，直接返回
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // 根据新的内容重新建立 Redis 连接
    const database = process.env.ENV_VAR === "development" ? 1 : 0;
    this.client = createClient({
      url: `redis://${config.redis_address}:${
        config.redis_port ?? 6379
      }/${database}`,
      password: "199615xin",
    });
    this.client.connect();
    this.isConnected = true;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.reloadConfigAndReconnect();
    }
  }
}

export default RedisClientSingleton.getInstance();
