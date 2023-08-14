import { axiosInstance } from "./axios";

// 获取所有的直播流
export const getLiveStreamingList = () => axiosInstance.get("/live");
// 创建直播
export const createLiveStream = (data: any) =>
  axiosInstance.post("/live/create", data);
// 删除指定直播流
export const delLiveStream = (uniqueId: string) =>
  axiosInstance.delete(`/live/${uniqueId}`);
// 更新指定直播流
export const updateLiveStream = (uniqueId: string, data: any) =>
  axiosInstance.put(`/live/${uniqueId}`, data);
// 停止指定直播流
export const stopLiveStream = (uniqueId: string) =>
  axiosInstance.post(`/live/${uniqueId}/stop`, {});
// 启动指定直播
export const startLiveStream = (uniqueId: string) =>
  axiosInstance.post(`/live/${uniqueId}/start`, {});
