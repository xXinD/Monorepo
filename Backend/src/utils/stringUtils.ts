import Koa from "koa";
import ffmpeg from "fluent-ffmpeg";

/**
 * 字符串转义
 *
 * @async
 * @param {Object}
 * @returns {Object}
 * @throws {Error}
 */
export function escapeParams(ctx: Koa.Context, next: Koa.Next) {
  const params = ctx.request.body as {
    video_dir: string;
  };
  // 对需要转义的参数进行处理
  if (params && params.video_dir) {
    params.video_dir = params.video_dir.replace(/\\/g, "\\\\");
  }

  // 传递给下一个中间件
  return next();
}

/**
 * @author XinD
 * @date 2023/6/3
 * @description 获取视频分辨率
 * @param {string} filePath 视频文件路径
 * @returns {Promise<Resolution>} 视频分辨率
 */
interface Resolution {
  width: number;
  height: number;
}

export const getVideoResolution = (filePath: string): Promise<Resolution> =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const { width, height } = metadata.streams[0];
        resolve({ width, height });
      }
    });
  });

/**
 * 获取url内的参数
 *
 * @async
 * @returns {Object}
 * @param url: string
 */
export function getUrlParams(url: string) {
  const params: { [key: string]: string } = {};
  const paramsStr = url.split("?")[1];
  if (paramsStr) {
    const paramsArr = paramsStr.split("&");
    paramsArr.forEach((item) => {
      const [key, value] = item.split("=");
      params[key] = value;
    });
  }
  return params;
}
