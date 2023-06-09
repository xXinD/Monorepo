import { axiosInstance } from "./axios";

export interface StreamAddress {
  unique_id?: string;
  platform: string;
  room_address: string;
  streaming_address: string;
  streaming_code: string;
  start_broadcasting: number;
  description?: string;
}
// 获取所有的地址
export const getStreamAddressList = () => axiosInstance.get("/stream_address");

// 创建地址
export const createStreamAddress = (data: StreamAddress) =>
  axiosInstance.post("/stream_address/create", data);

export const updateStreamAddress = (uniqueId: string, data: any) =>
  axiosInstance.put(`/stream_address/${uniqueId}`, data);

export const delStreamAddress = (uniqueId: string) =>
  axiosInstance.delete(`/stream_address/${uniqueId}`);

export const getResourcesByFileType = (file_type: string) =>
  axiosInstance.post("/resources/by_file_type", { file_type });
