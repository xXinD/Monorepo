import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import speech from "@google-cloud/speech";
import ffmpeg from "fluent-ffmpeg";
import { Storage } from "@google-cloud/storage";
import tmp from "tmp";
const storage = new Storage();

/**
 * 将音频文件上传到Google Cloud Storage。
 *
 * @async
 * @param {string} audioFilePath 音频文件路径
 * @param {bucketName} bucketName Google Cloud Storage bucket name
 * @returns {string} Google Cloud Storage URI
 */
async function uploadAudioToGCS(audioFilePath: string, bucketName: string) {
  const bucket = storage.bucket(bucketName);
  const fileName = path.basename(audioFilePath);
  const file = bucket.file(fileName);

  try {
      await bucket.upload(audioFilePath, {
          destination: file,
          gzip: true,
      });
  }catch (e) {
      console.log(e,111111)
  }

  return `gs://${bucketName}/${fileName}`;
}

/**
 * 检查视频文件是否包含字幕。
 *
 * @async
 * @param {string} videoPath 视频文件路径
 * @returns {Object} 如果视频文件包含字幕，将返回true，否则返回false
 */
async function hasSubtitle(videoPath: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const ffprobeProcess = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ]);

    let hasSubtitle = false;

    ffprobeProcess.on("error", (error) => {
      reject(error);
    });

    ffprobeProcess.stdout.on("data", (data) => {
      if (/^(subrip|ass|webvtt|sami)$/i.test(data.toString().trim())) {
        hasSubtitle = true;
      }
    });

    ffprobeProcess.stderr.on("data", (data) => {
      console.error(`ffprobe stderr: ${data}`);
    });

    ffprobeProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`ffprobe process exited with code ${code}`);
        reject(`ffprobe process exited with code ${code}`);
      } else {
        resolve(hasSubtitle);
      }
    });
  });
}

/**
 * 生成字幕。
 *
 * @async
 * @param {string} filePath 视频文件路径
 * @returns {string} 字幕文本
 */
async function generateSubtitle(filePath: string): Promise<string> {
  const client = new speech.SpeechClient();
  const audioFormat = getAudioFormat(filePath);

  const audioFile = await extractAudio(filePath, audioFormat);

  const audioMetadata = await getAudioMetadata(audioFile.name);
  console.log(audioMetadata, "audioMetadata");
  const bucketName = "xindong-speech-to-text";
  const gcsUri = await uploadAudioToGCS(audioFile.name, bucketName);
  const audio = {
    uri: gcsUri,
  };
  console.log(audio, "audio");
  const config = {
    encoding: audioMetadata.encoding,
    sampleRateHertz: audioMetadata.sampleRate,
    languageCode: "en-US",
  };
  const request = {
    audio: audio,
    config: config,
  };
  console.log(request, "request");
  try {
    // @ts-ignore
    const [response] = await client.recognize(request);
    console.log(response, "response");
    const transcription = response.results
      .map((result: any) => result.alternatives[0].transcript)
      .join("\n");

    audioFile.removeCallback();
    console.log(transcription, "transcription");
    return transcription;
  } catch (e) {
    console.log(e, "error");
  }
}

/**
 * 获取音频格式
 *
 * @async
 * @param {string} filePath 音频文件路径
 * @returns {string} 音频格式
 * @throws {Error} 如果音频格式不支持，将抛出错误
 */
function getAudioFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp4":
      return "mp3";
    case ".avi":
      return "wav";
    case ".mkv":
      return "flac";
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * 获取音频元数据。
 *
 * @async
 * @param {string} filePath 音频文件路径
 * @param {string} format 音频格式
 * @returns {Object} 音频元数据
 * @throws {Error} 如果音频格式不支持，将抛出错误
 */
function extractAudio(
  filePath: string,
  format: string
): Promise<tmp.FileResult> {
  return new Promise((resolve, reject) => {
    const audioFile = tmp.fileSync({ postfix: `.${format}` });
    console.log(audioFile, "audioFile");

    const args = [
      "-y", // 添加这个选项以覆盖已存在的文件
      "-i",
      filePath,
      "-vn", // 添加这个选项以排除视频流
      "-codec:a",
      "libmp3lame", // 修改为 'libmp3lame' 以将音频转码为 MP3 格式
      "-qscale:a",
      "2", // 为 MP3 设置质量，取值范围为 0（最佳质量）至 9（最差质量），默认值为 4
      audioFile.name,
    ];
    const ffmpegProcess = spawn("ffmpeg", args);

    ffmpegProcess.on("error", (error) => {
      reject(error);
    });

    ffmpegProcess.stdout.on("data", (data) => {
      console.log(`ffmpeg stdout: ${data}`);
    });

    ffmpegProcess.stderr.on("data", (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });

    ffmpegProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`ffmpeg process exited with code ${code}`);
        reject(`ffmpeg process exited with code ${code}`);
      } else {
        resolve(audioFile);
      }
    });
  });
}

async function getAudioMetadata(
  filePath: string
): Promise<{ encoding: string; sampleRate: number }> {
  return new Promise<{ encoding: string; sampleRate: number }>(
    (resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const audioMetadata = metadata.streams.find(
            (stream) => stream.codec_type === "audio"
          );
          if (audioMetadata) {
            const encoding = getAudioEncoding(audioMetadata.codec_name);
            const sampleRate = audioMetadata.sample_rate;
            resolve({ encoding, sampleRate });
          } else {
            reject(new Error("No audio stream found"));
          }
        }
      });
    }
  );
}

function getAudioEncoding(format: string): string {
  switch (format) {
    case "mp3":
      return "MP3";
    case "flac":
      return "FLAC";
    case "aac":
      return "AAC";
    default:
      throw new Error(`Unsupported codec: ${format}`);
  }
}

export async function batchCheckSubtitles(
  dirPath: string,
  outputDir: string
): Promise<void> {
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const extension = path.extname(filePath);
    if (
      [".mp4", ".avi", ".mkv"].includes(extension.toLowerCase()) &&
      !(await hasSubtitle(filePath))
    ) {
      console.log(`[${file}] does not have subtitles.`);
      // TODO: 调用谷歌API生成字幕
      const subtitleContent = await generateSubtitle(filePath);
      // TODO: 使用 ffmpeg 加入字幕
      // TODO: 导出视频到指定目录
    }
  }
}
