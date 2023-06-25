import qr from "qrcode";

/**
 * @author XinD
 * @date 2023/6/22
 * @description 判断字符串是否为http或https开头
 */
export const isHttp = (str: string): boolean =>
  str.startsWith("http://") || str.startsWith("https://");

/**
 * @author XinD
 * @date 2023/6/25
 * @description 使用qrcode将url转二维码
 */
export const urlToQrCode = async (url: string): Promise<string> =>
  await qr.toDataURL(url);
