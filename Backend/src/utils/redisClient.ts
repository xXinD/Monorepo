// eslint-disable-next-line import/no-extraneous-dependencies
import { createClient } from "redis";

class RedisClientSingleton {
  private static instance: RedisClientSingleton;

  private client: any;

  private constructor(host: string = "123.249.124.132", port: number = 6379) {
    this.client = createClient({
      url: `redis://${host}:${port}`,
    });

    this.client.on("error", (err: any) => {
      console.error(`Error ${err}`);
    });
  }

  public static getInstance(): RedisClientSingleton {
    if (!RedisClientSingleton.instance) {
      RedisClientSingleton.instance = new RedisClientSingleton();
    }
    return RedisClientSingleton.instance;
  }

  public set(
    key: string,
    value: string,
    callback?: (err: Error | null, reply: string) => void
  ): void {
    this.client.set(key, value, callback);
  }

  public get(
    key: string,
    callback?: (err: Error | null, reply: string) => void
  ): void {
    this.client.get(key, callback);
  }

  public del(
    key: string,
    callback?: (err: Error | null, reply: number) => void
  ): void {
    this.client.del(key, callback);
  }

  public exists(
    key: string,
    callback?: (err: Error | null, reply: number) => void
  ): void {
    this.client.exists(key, callback);
  }

  public keys(
    pattern: string,
    callback?: (err: Error | null, reply: string[]) => void
  ): void {
    this.client.keys(pattern, callback);
  }

  public quit(): void {
    this.client.quit();
  }
}

export default RedisClientSingleton.getInstance();
