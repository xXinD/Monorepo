import { FFCreator, FFText, FFImage, FFScene, FFVideo } from "ffcreator";
import FFCreatorErrorEvent = FFCreatorSpace.FFCreatorErrorEvent;
import path from "path";
import { MainProcessorOptions } from "./index";
import { getVideoResolution } from "../utils/stringUtils";

export default class VideoProcessor {
  private ffcreator: FFCreator;
  private scenes: FFScene[] = [];
  protected options: MainProcessorOptions;
  constructor(options: MainProcessorOptions) {
    this.ffcreator = new FFCreator({
      cacheDir: path.resolve(__dirname, "./FFCreator_cache/"),
      outputDir: options.outputDir,
      width: options.width,
      height: options.height,
      debug: true,
      fps: 30,
      log: true,
      highWaterMark: "3mb",
    });
  }

  createScene(duration: number): FFScene {
    const scene = new FFScene();
    scene.setDuration(duration);
    this.scenes.push(scene);
    return scene;
  }
  getScenes(): FFScene[] {
    return this.scenes;
  }
  addTextToScene(scene: FFScene, text: string, x: number, y: number): void {
    const ffText = new FFText({ text, x, y });
    scene.addChild(ffText);
  }

  addImageToScene(scene: FFScene, path: string, x: number, y: number): void {
    const ffImage = new FFImage({ path, x, y });
    scene.addChild(ffImage);
  }
  async addVideoToScene(scene: FFScene, sourcePaths: string): Promise<void> {
    const { width, height } = await getVideoResolution(sourcePaths);
    const video = new FFVideo({
      path: sourcePaths,
      width: width,
      height: height,
      x: width / 2,
      y: height / 2,
      duration: 20,
    });
    scene.addChild(video);
  }

  async render(): Promise<void> {
    return new Promise((resolve, reject) => {
      // console.log(this.ffcreator, 44444);
      for (const scene of this.scenes) {
        this.ffcreator.addChild(scene);
      }
      this.ffcreator.start();
      this.ffcreator.on("error", (e: FFCreatorErrorEvent) => {
        reject(e);
      });
      this.ffcreator.on("complete", () => {
        resolve();
      });
    });
  }
}
