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
export const getResourcesFileTypes = () =>
  axiosInstance.get("/resources/file_types");
// 创建直播
export const createResources = (data: Resources) =>
  axiosInstance.post("/resources/create", data);

export const updateResources = (uniqueId: string, data: any) =>
  axiosInstance.put(`/resources/${uniqueId}`, data);

export const delResources = (uniqueId: string) =>
  axiosInstance.delete(`/resources/${uniqueId}`);

export const getResourcesByFileType = (file_type: string) =>
  axiosInstance.post("/resources/by_file_type", { file_type });
