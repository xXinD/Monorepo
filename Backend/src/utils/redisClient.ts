// eslint-disable-next-line import/no-extraneous-dependencies
import { createClient } from "redis";

class RedisClientSingleton {
  private static instance: RedisClientSingleton;

  private client: any;

  private constructor(host: string = "123.249.124.132", port: number = 6379) {
    this.client = createClient({
      url: `redis://${host}:${port}`,
      password: "199615xin",
    });
    this.client.connect();
    this.client.on("error", (err: any) => {
      console.error(`Error ${err}`);
    });
    this.client.on("connect", () => {
      console.log("Redis connected");
    });
  }

  public static getInstance(): RedisClientSingleton {
    if (!RedisClientSingleton.instance) {
      RedisClientSingleton.instance = new RedisClientSingleton();
    }
    return RedisClientSingleton.instance;
  }

  public async set(key: string, value: string): Promise<void> {
    return await this.client.set(key, value);
  }

  public async get(key: string): Promise<any> {
    return await this.client.get(key);
  }

  public async del(key: string): Promise<void> {
    return await this.client.del(key);
  }

  public async keys(pattern: string): Promise<void> {
    return await this.client.keys(pattern);
  }

  public async quit(): Promise<void> {
    await this.client.quit();
    RedisClientSingleton.instance = null;
  }
}

export default RedisClientSingleton.getInstance();
