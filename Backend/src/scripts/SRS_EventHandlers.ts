import { ChildProcess } from "child_process";
import { asyncHandler } from "../utils/handler";
import {
  creatSRS,
  SRS_ChildProcesses,
  stopAllSRS,
} from "../controllers/resources";
import { Resources } from "../models/Resources";
import { LiveStream } from "../models/LiveStream";
import { stopStreaming } from "./stream";

export function onData(childProcess: ChildProcess, unique_id: string) {
  childProcess.stderr.on("data", async (data) => {
    console.log(`【转发推流】标准日志: ${unique_id} \n ${data}`);
  });
}
export function onExit(
  childProcess: ChildProcess,
  options: { unique_id: string; video_dir: string }
) {
  childProcess.once("exit", async (code) => {
    await asyncHandler(async () => {
      if (code === 0) {
        console.warn(`SRS进程${options.unique_id}退出，退出码为${code}`);
        await creatSRS({
          streaming_code: options.unique_id,
          video_dir: options.video_dir,
          start_time: "00:00:00",
        });
      } else {
        console.error(`SRS进程${options.unique_id}退出，退出码为${code}`);
        const liveStream = await LiveStream.findByColumn(
          "video_dir",
          options.unique_id
        );
        liveStream.map(async (_item) => {
          await stopStreaming(_item.unique_id);
        });
        if (SRS_ChildProcesses.has(options.unique_id)) {
          SRS_ChildProcesses.delete(options.unique_id);
        }
      }
    }, "源流转发停止出错：");
  });
}

export async function onSpawn(
  childProcess: ChildProcess,
  unique_id: string,
  options: Resources
) {
  return new Promise((resolve, reject) => {
    childProcess.once("spawn", async () => {
      await asyncHandler(async () => {
        // 更新直播状态为 'running'
        const SRS = await Resources.findById(unique_id);
        if (!SRS) {
          await Resources.create({
            unique_id,
            update_date: options.update_date,
            file_type: options.file_type,
            name: options.name,
            video_dir: options.video_dir,
            srs_address: `${unique_id}`,
            status: 1,
          });
        } else {
          await Resources.update(unique_id, {
            ...SRS,
            status: 1,
          });
        }
        SRS_ChildProcesses.set(unique_id, childProcess);
        const updateResult = await Resources.findById(unique_id);
        resolve(updateResult);
      }, "启动/重启推流失败：").catch(reject);
    });

    childProcess.once("error", async (error) => {
      console.error(`进程 ${unique_id} 报错：`, error);
      await asyncHandler(async () => {
        const SRS = await Resources.findById(unique_id);
        // 直播状态更新为错误
        await Resources.update(unique_id, {
          ...SRS,
          status: 2,
        });
        reject(error);
      }, "推流进程报错：").catch(reject);
    });
  });
}
