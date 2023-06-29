import si from "systeminformation";
import { LiveOptions } from "./index";
import { StreamAddress } from "../../models/StreamAdress";

export async function buildFFmpegCommand(
  options: LiveOptions & StreamAddress
): Promise<string[]> {
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
  const args =
    options.is_video_style == 1
      ? [
          "-re",
          "-y",
          "-ss",
          `${options.start_time ?? "00:00:00"}`,
          "-i",
          `${options.sourcePath}`,
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
          `${options.streaming_address}${options.streaming_code}`,
        ]
      : [
          "-re",
          "-i",
          `${options.sourcePath}`,
          "-c:v",
          "copy",
          "-c:a",
          "copy",
          "-f",
          "flv",
          `${options.streaming_address}${options.streaming_code}`,
        ];

  // 删除args内的false值
  return args.filter((item) => item !== "false");
}
