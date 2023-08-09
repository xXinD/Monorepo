import { ChildProcess } from "child_process";
import { asyncHandler, convertToSeconds, secondsToHMS } from "../utils/handler";
import { creatSRS, SRS_ChildProcesses } from "../controllers/resources";
import { Resources } from "../models/Resources";
import { LiveStream } from "../models/LiveStream";
import { stopStreaming } from "./stream";

export function onData(
  childProcess: ChildProcess,
  unique_id: string,
  start_time: any,
  resources_id: string
) {
  const ssSeconds = convertToSeconds(start_time);
  const interval = 30000; // 30 seconds in milliseconds
  let lastLogTime = Date.now();

  childProcess.stderr.on("data", async (data) => {
    const liveStream = await LiveStream.findByColumn("video_dir", resources_id);
    const now = Date.now();
    if (now - lastLogTime >= interval) {
      const logString = data.toString();
      const timeRegex = /time=(\d{2}:\d{2}:\d{2}.\d{2})/;
      const match = logString.match(timeRegex);
      let timeValue;
      if (match) {
        [, timeValue] = match; // 直接为已声明的变量赋值
        const currentSeconds = convertToSeconds(timeValue);
        liveStream.map(async (_item) => {
          try {
            await LiveStream.update(_item.unique_id, {
              ..._item,
              start_time: secondsToHMS(ssSeconds + currentSeconds),
            });
          } catch (error) {
            console.error("修改直播进度出错:", error);
          }
        });
        lastLogTime = now;
      } else {
        console.log("No match found");
      }
    }
  });
}
export function onExit(
  childProcess: ChildProcess,
  options: { unique_id: string; video_dir: string },
  resources_id: string
) {
  childProcess.once("exit", async (code) => {
    await asyncHandler(async () => {
      const liveStream = await LiveStream.findByColumn(
        "video_dir",
        resources_id
      );
      if (code === 0) {
        console.log(`进程${options.unique_id}播完结束，将循环至开头`);
        liveStream.map(async (_item) => {
          await LiveStream.update(_item.unique_id, {
            ..._item,
            start_time: "00:00:00",
          });
        });
        await creatSRS({
          streaming_code: options.unique_id,
          video_dir: options.video_dir,
          start_time: "00:00:00",
        });
      } else {
        console.error(`SRS进程${options.unique_id}退出，退出码为${code}`);
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
