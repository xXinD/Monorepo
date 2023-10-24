import FFCreatorAPI from "./VideoProcessor";

export type MainProcessorOptions = {
  outputDir: string;
  width: number;
  height: number;
};
export default class MainProcessor extends FFCreatorAPI {
  private static instance: MainProcessor | null = null;
  protected options: MainProcessorOptions;
  private constructor(options: MainProcessorOptions) {
    super(options);
    this.options = options;
  }

  public static getInstance(options: MainProcessorOptions): MainProcessor {
    if (!this.instance) {
      this.instance = new MainProcessor(options);
    }
    return this.instance;
  }

  addSpecialText(scene: any, text: string): void {
    this.addTextToScene(scene, `[Special] ${text}`, 100, 100);
  }

  async processVideo(): Promise<void> {
    const scene = this.createScene(10);
    this.addTextToScene(scene, "Hello", 400, 300);
    this.addSpecialText(scene, "World");
    await this.render();
  }
}
