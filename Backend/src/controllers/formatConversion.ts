import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

/**
 * 将指定路径下的 .mkv 文件转换成 .mp4 文件
 * @param {string} filePath 目标文件路径
 * @returns {Promise<void>}
 */
function convertMkvToMp4(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath, path.extname(filePath));
        const mp4FilePath = path.join(path.dirname(filePath), fileName + '.mp4');
        const ffmpegProcess = spawn('ffmpeg', ['-i', filePath, mp4FilePath]);
        ffmpegProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
        ffmpegProcess.on('error', (error) => {
            console.error(`Failed to convert file: ${filePath}`);
            reject(error);
        });
        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`Successfully converted ${filePath} to ${mp4FilePath}`);
                resolve();
            } else {
                console.error(`Failed to convert file: ${filePath}`);
                reject();
            }
        });
    });
}

/**
 * 将指定目录下的所有 .mkv 文件转换成 .mp4 文件
 *
 * @async
 * @returns {Promise<void>}
 * @param ctx
 */
export async function convertAllMkvToMp4(ctx:any): Promise<void> {
    const {sourceDirectory} = ctx.request.body;
    const files = await fs.promises.readdir(sourceDirectory);
    const tasks = files.map(async (file) => {
        const filePath = path.join(sourceDirectory, file);
        if (fs.statSync(filePath).isDirectory()) {
            // 如果是目录，则递归处理子目录
            return await convertAllMkvToMp4({
                request: {
                    body: {
                        sourceDirectory: filePath
                    }
                }
            });
        } else if (path.extname(filePath) === '.mkv') {
            // 如果是 .mkv 文件，则进行转换
            return await convertMkvToMp4(filePath);
        }
    });
    await Promise.all(tasks);
}
