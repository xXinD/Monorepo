import { asyncHandler, convertToSegments } from "../utils/handler";
import MainProcessor from "../lib";
import path from "path";
import { FFCreator, FFScene, FFVideo } from "ffcreator";

/**
 * 测试
 * FFCreator生成视频
 *
 * @async
 * @returns {Object}
 * @throws {Error}
 * @param ctx
 */
export async function postFFCreator(ctx: any): Promise<any> {
  // const { sourcePath } = ctx.request.body;
  const sourcePath = [
    path.join(__dirname, "./20231023_190411_21edd15dd.mp4"),
    path.join(__dirname, "./20231023_192227_358fdf25.mp4"),
  ];
  await asyncHandler(async () => {
    const mainProcessor = MainProcessor.getInstance({
      outputDir: path.resolve(__dirname, "../../files/FFCreator_output/"),
      width: 1080,
      height: 1920,
    });
    for (const path of sourcePath) {
      const scene = mainProcessor.createScene(20);
      await mainProcessor.addVideoToScene(scene, path);
    }
    await mainProcessor.render();

    ctx.body = {
      message: "FFCreator引擎",
    };
  }, "FFCreator渲染生成内部错误：");
}
