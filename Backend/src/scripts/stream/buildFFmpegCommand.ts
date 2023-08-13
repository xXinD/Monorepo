import si from "systeminformation";
import { LiveOptions } from "./index";
import { StreamAddress } from "../../models/StreamAdress";
import { convertToSeconds } from "../../utils/handler";

export async function buildFFmpegCommand(
  options: LiveOptions & StreamAddress & { totalTime: number }
) {
  const { controllers } = await si.graphics();
  let graphicsEncoder: string;
  if (options.is_it_hardware === 1) {
    if (controllers[0]?.vendor === "NVIDIA") {
      graphicsEncoder =
        options.encoder === "h264" ? "h264_nvenc" : "hevc_nvenc";
    } else {
      graphicsEncoder =
        options.encoder === "h264" ? "h264_videotoolbox" : "hevc_videotoolbox";
    }
  } else {
    graphicsEncoder = options.encoder === "h264" ? "libx264" : "libx265";
  }

  let start_time: string | number;
  if (
    options.start_time &&
    convertToSeconds(options.start_time) > options.totalTime
  ) {
    start_time = convertToSeconds(options.start_time) % options.totalTime;
  } else {
    start_time = options.start_time ?? "00:00:00";
  }

  let inputOptions;
  let outputOptions;
  let output;

  if (options.is_video_style == 1) {
    inputOptions = [
      "-re",
      "-y",
      "-ss",
      `${start_time}`,
      "-i",
      `${options.sourcePath}`,
    ];
    outputOptions = [
      "-c:v",
      graphicsEncoder,
      `${options.encoding_mode === 2 && "-maxrate"}`,
      `${options.encoding_mode === 2 && `${options.bit_rate_value}k`}`,
      `${options.encoding_mode === 2 && "-bufsize"}`,
      `${options.encoding_mode === 2 && `${options.bit_rate_value}k`}`,
      `${options.encoding_mode === 1 && "-b:v"}`,
      `${options.encoding_mode === 1 && `${options.bit_rate_value}k`}`,
      "-c:a",
      "copy",
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-metadata:s:v:0",
      "language=chi",
      "-metadata:s:a:0",
      "language=chi",
      "-scodec",
      "mov_text",
      "-map",
      "0:s:0?",
      "-qp",
      "20",
      "-f",
      "flv",
    ];
    output = `${options.streaming_address}${options.streaming_code}`;
  } else {
    inputOptions = [
      "-re",
      "-ss",
      `${start_time}`,
      `${options.fileType === "m3u8" && "-stream_loop"}`,
      `${options.fileType === "m3u8" && "-1"}`,
      "-i",
      `${options.sourcePath}`,
    ];
    outputOptions = ["-c", "copy", "-f", "flv"];
    output = `${options.streaming_address}${options.streaming_code}`;
  }

  // 删除 false 值
  inputOptions = inputOptions.filter((item) => item !== "false");
  outputOptions = outputOptions.filter((item) => item !== "false");

  return { inputOptions, outputOptions, output };
}
