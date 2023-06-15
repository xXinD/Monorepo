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
