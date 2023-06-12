import { spawn, ChildProcess } from "child_process";
import { resolve } from "path";
import os from "os";

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
        return "allinone_windows_amd64.exe";
      case "linux":
        return this.arch === "x64"
          ? "allinone_linux_amd64"
          : "allinone_linux_arm64";
      default:
        throw new Error("Operating system not supported");
    }
  }

  public startService(): void {
    if (this.process) {
      this.process.kill(); // kill previous process if exists
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
      this.startService(); // restart the service
    });

    this.process.on("exit", (code, signal) => {
      console.log(`exit: ${code} ${signal}`);
      if (code !== 0 && !this.restarting) {
        this.restarting = true; // Set the restarting flag
        this.startService(); // restart the service if it was not exited normally
      }
    });

    process.on("exit", () => {
      if (this.process) {
        this.process.kill(); // kill the service when node.js exits
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
const binaryManager = new BinaryManager();

export default binaryManager;
