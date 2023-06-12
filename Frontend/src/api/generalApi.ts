import { axiosInstance } from "./axios";

export interface Preset {
  unique_id?: string;
  name: string;
  video_dir: string;
  file_type: string;
  create_date: string;
}
// 获取所有的直播流
export const getResourcesList = () => axiosInstance.get("/resources");
export const getResourcesFileTypes = () =>
  axiosInstance.get("/resources/file_types");
// 创建直播
export const setPreset = (data: Preset) =>
  axiosInstance.post("/resources/create", data);

export const updateResources = (uniqueId: string, data: any) =>
  axiosInstance.put(`/resources/${uniqueId}`, data);
