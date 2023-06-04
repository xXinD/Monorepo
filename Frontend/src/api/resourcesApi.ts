import { axiosInstance } from "./axios";

export interface Resources {
  unique_id?: string;
  name: string;
  video_dir: string;
  file_type: string;
  create_date: string;
}
// 获取所有的直播流
export const getResourcesList = () => axiosInstance.get("/resources");
// 创建直播
export const createLiveStream = (data: Resources) => axiosInstance.post("/resources/create", data);
