export const platformFormat = (platform: string) => {
  switch (platform) {
    case "douyu":
      return "斗鱼";
    case "huya":
      return "虎牙";
    case "bilibili":
      return "哔哩哔哩";
    case "youtube":
      return "YouTube";
    case "twitch":
      return "Twitch";
    case "kuaishou":
      return "快手";
    case "douyin":
      return "抖音";
    default:
      return "未知平台";
  }
};
