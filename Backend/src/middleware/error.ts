import Koa from "koa";

function errorHandler(ctx: Koa.Context, next: () => Promise<any>) {
  return next().catch((err) => {
    // eslint-disable-next-line no-loss-of-precision
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message,
    };
    ctx.app.emit("error", err, ctx);
  });
}
function globalErrorHandler(errorMessage: string, error: Error) {
  console.error(errorMessage, error);
  // const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
  //
  // // 使用当前工作目录而不是 __dirname
  // const logsDirPath = path.resolve(process.cwd(), "./logs/");
  // if (!fs.existsSync(logsDirPath)) {
  //   fs.mkdirSync(logsDirPath);
  // }
  //
  // const errorLogPath = path.resolve(logsDirPath, "error.log");
  //
  // const errorLog = `当前时间：${currentTime}\n${errorMessage} ${error.stack} \n`;
  //
  // // 判断文件大小，如果超过3GB，先重命名原文件，然后新建一个文件来存储日志
  // if (
  //   fs.existsSync(errorLogPath) &&
  //   fs.statSync(errorLogPath).size / (1024 * 1024 * 1024) > 3
  // ) {
  //   const oldErrorLogPath = `${errorLogPath}-${currentTime}`;
  //   fs.renameSync(errorLogPath, oldErrorLogPath);
  //   fs.unlinkSync(oldErrorLogPath);
  // }
  //
  // // 将错误日志写入文件
  // fs.appendFileSync(errorLogPath, errorLog);
}

export { errorHandler, globalErrorHandler };
