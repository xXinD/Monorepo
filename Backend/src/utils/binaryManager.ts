import { spawn, ChildProcess } from "child_process";
import { resolve, join } from "path";
import os from "os";
import axios from "axios";
import extract from "extract-zip";
import fs from "fs/promises";

class BinaryManager {
  private readonly platform: string;

  private readonly arch: string;

  private readonly binaryFile: string;

  private process: ChildProcess | null;

  private restarting: boolean;

  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.binaryFile = this.selectBinaryFile();
    this.process = null;
    this.restarting = false;
    this.init();
  }

  private async init() {
    await this.downloadAndUnzip();
    this.startService();
  }

  private selectBinaryFile(): string {
    switch (this.platform) {
      case "darwin":
        return this.arch === "arm64"
          ? "allinone_darwin_arm64"
          : "allinone_darwin_amd64";
      case "win32":
        if (this.arch !== "x64") {
          throw new Error("Windows system architecture not supported");
        }
        return "allinone_windows_amd64";
      case "linux":
        return this.arch === "x64"
          ? "allinone_linux_amd64"
          : "allinone_linux_arm64";
      default:
        throw new Error("Operating system not supported");
    }
  }

  private async downloadAndUnzip() {
    const url = `https://xindong.wiki/downloads/${this.binaryFile}.zip`;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const zipPath = join(__dirname, `${this.binaryFile}.zip`);
    const outputPath = join(__dirname, "..", "executables");

    try {
      await fs.access(outputPath);
    } catch {
      await fs.mkdir(outputPath);
    }

    // Try to delete the existing binary file before extracting
    try {
      await fs.unlink(join(outputPath, this.binaryFile));
      console.log("Deleted existing binary file.");
    } catch (err) {
      console.log("No existing binary file found.");
    }

    await fs.writeFile(zipPath, buffer);

    try {
      await extract(zipPath, { dir: outputPath });
      // Delete the zip file after extraction
      await fs.unlink(zipPath);
    } catch (err) {
      throw new Error(`Error extracting zip file: ${err}`);
    }
  }

  public async startService(): Promise<void> {
    if (this.process) {
      this.process.kill();
    }
    const pathToBinary = resolve(
      __dirname,
      "..",
      "executables",
      this.binaryFile
    );
    this.process = spawn(pathToBinary);

    this.process.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    this.process.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    this.process.on("error", (error) => {
      console.error(`error: ${error.message}`);
      this.startService();
    });

    this.process.on("exit", (code, signal) => {
      console.log(`exit: ${code} ${signal}`);
      if (code !== 0 && !this.restarting) {
        this.restarting = true;
        this.startService();
      }
    });
    process.on("beforeExit", () => {
      if (this.process) {
        this.process.kill();
      }
    });
  }
}

// Singleton instance
const createBinaryManager = () => new BinaryManager().startService();
export default createBinaryManager;
