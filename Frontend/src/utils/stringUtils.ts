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

// 获取直播间地址
export const getRoomLink = (type: string, room_id: string): string => {
  switch (type) {
    case "huya":
      return `https://www.huya.com/${room_id}`;
    case "bilibili":
      return `http://live.bilibili.com/${room_id}`;
    case "douyu":
      return `https://www.douyu.com/${room_id}`;
    case "kuaishou":
      return `https://live.kuaishou.com/u/${room_id}`;
    case "douyin":
      return `https://live.douyin.com/${room_id}`;
    case "youtube":
      return `https://www.youtube.com/watch?v=${room_id}`;
    case "twitch":
      return `https://www.twitch.tv/${room_id}`;
    default:
      return "";
  }
};
