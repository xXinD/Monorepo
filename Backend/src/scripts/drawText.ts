import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { registerFont, createCanvas } from "canvas";

class VideoProcessor {
  private input: string | undefined;

  private watermarkText: string | undefined;

  private fontFile: string = "C:\\Windows\\Fonts\\simsun.ttc";

  private fontSize: number = 14;

  private fontColor: string = "white";

  private borderSize: number = 2;

  private borderColor: string = "black";

  private videoExtensions: string[] = [".mp4", ".avi", ".mkv", ".flv"];

  constructor(private outputFolder: string) {
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
  }

  public inputPath(input: string): VideoProcessor {
    this.input = input;
    return this;
  }

  public text(text: string): VideoProcessor {
    this.watermarkText = text;
    return this;
  }

  public setFontFile(fontFile: string): VideoProcessor {
    this.fontFile = fontFile;
    return this;
  }

  public setFontSize(fontSize: number): VideoProcessor {
    this.fontSize = fontSize;
    return this;
  }

  public setFontColor(fontColor: string): VideoProcessor {
    console.log(fontColor, "fontColor");
    this.fontColor = fontColor;
    return this;
  }

  public setBorderSize(borderSize: number): VideoProcessor {
    this.borderSize = borderSize;
    return this;
  }

  public setBorderColor(borderColor: string): VideoProcessor {
    this.borderColor = borderColor;
    return this;
  }

  public execute() {
    if (!this.input) {
      console.error("Input path is missing");
      return;
    }
    registerFont(this.fontFile, { family: "MyFont" });
    const stat = fs.statSync(this.input);
    if (stat.isDirectory()) {
      this.processVideos(this.input, this.watermarkText);
    } else {
      const text = this.watermarkText || path.parse(this.input).name;
      this.processFile(this.input, text);
    }
  }

  private processVideos(inputFolder: string, watermarkText?: string) {
    fs.readdir(inputFolder, (err: Error | null, files?: string[]) => {
      if (err) {
        console.error(err);
        return;
      }

      const videoFiles = files?.filter((file) =>
        this.videoExtensions.includes(path.extname(file))
      );

      this.processQueue(videoFiles || [], watermarkText); // 移除最大并发数量
    });
  }

  private async processQueue(files: string[], watermarkText?: string) {
    for (const file of files) {
      const text = watermarkText || path.parse(file).name;
      const filePath = path.join(this.input, file);
      await this.processFile(filePath, text); // 这里使用await确保一个文件处理完之后才处理下一个
    }
  }

  private async generateWatermarkImage(text: string, outputPath: string) {
    const scale = 10;
    const padding = 5 * scale; // 边距
    const canvas = createCanvas(1, 1);
    const ctx = canvas.getContext("2d");
    ctx.font = `${this.fontSize * scale}px MyFont`;

    const metrics = ctx.measureText(text);
    const watermarkWidth = metrics.width + padding; // 文本宽度加上左侧和右侧边距
    const textX = padding / 2; // 文本X坐标
    // 垂直居中文本
    const textY = metrics.actualBoundingBoxAscent + padding / 2;
    const watermarkHeight =
      textY + metrics.actualBoundingBoxDescent + padding / 2; // 文本高度加上底部边距

    canvas.width = watermarkWidth;
    canvas.height = watermarkHeight;
    ctx.font = `${this.fontSize * scale}px MyFont`;

    // 设置描边样式
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = this.borderSize * scale;

    // 设置填充样式
    ctx.fillStyle = this.fontColor;

    // 绘制描边文本
    ctx.strokeText(text, textX, textY);

    // 填充文本
    ctx.fillText(text, textX, textY);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
  }

  private async processFile(
    file: string,
    watermarkText: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const outputFile = path.join(this.outputFolder, path.basename(file));
      const watermarkImagePath = path.join(this.outputFolder, "watermark.png");

      this.generateWatermarkImage(watermarkText, watermarkImagePath).then(
        () => {
          // 获取原始视频的编解码器设置
          ffmpeg.ffprobe(file, (err, metadata) => {
            const codecData = metadata.streams[0];
            // 设置水印缩放比例
            const watermarkScale = 1 / 10;
            const filterText = `[1:v]scale=iw*${watermarkScale}:ih*${watermarkScale}[scaledWatermark];[0:v][scaledWatermark]overlay=x=main_w-overlay_w-10:y=5[outv]`;

            ffmpeg(file)
              .input(watermarkImagePath)
              .complexFilter(filterText, ["outv"])
              .outputOptions([
                "-map",
                "0:a?", // 映射所有音频流
                "-vcodec",
                codecData.codec_name, // 视频编解码器
                "-b:v",
                codecData.bit_rate, // 视频比特率
                "-crf",
                "16",
              ])
              .output(outputFile)
              .on("progress", (progress) => {
                console.log(
                  `[${file}] 处理进度: ${progress.percent.toFixed(2)}%`
                );
              })
              .on("error", (error) => {
                console.error(`处理时出错: ${error.message}`);
                reject(error); // 在出现错误时，Promise 应该被拒绝
              })
              .on("end", () => {
                console.log(`处理完成: ${outputFile}`);
                fs.unlinkSync(watermarkImagePath); // 可选: 处理完成后删除水印图像文件
                resolve(); // 这里解析 Promise，确保可以继续处理下一个文件
              })
              .run();
          });
        }
      );
    });
  }
}
export default VideoProcessor;
