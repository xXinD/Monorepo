import { axiosInstance } from "./axios";

export interface ServerConfig {
  service_address: string;
  sql_address: string;
  sql_port: string;
  redis_address: string;
  redis_port: string;
}
export const getServerConfig = () => axiosInstance.get("/general");
// 更新配置信息
export const updateServerConfig = (data: ServerConfig) =>
  axiosInstance.post("/general", data);

// 获取字体列表
export const getFontList = () => axiosInstance.get("/general/fontList");

// 给视频添加水印
export const postWatermarkToVideo = (data: any) =>
  axiosInstance.post("/general/postWatermarkToVideo", data);

// 分割视频成多个ts，生成播放列表
export const postPlaylist = (data: any) =>
  axiosInstance.post("/general/postPlaylist", data);
