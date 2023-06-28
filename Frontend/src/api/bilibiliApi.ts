import { axiosInstance } from "./axios";

// 获取登录二维码
export const getLoginQrCode = () => axiosInstance.get("/bilibili/login/qrcode");
// 查询二维码扫码状态
export const getLoginPoll = (id: string) =>
  axiosInstance.get(`/bilibili/login/poll/${id}`);

export const getStreamAddr = (id: string) =>
  axiosInstance.get(`/bilibili/getStreamAddr/${id}`);
export const getAreaList = () => axiosInstance.get("/bilibili/getAreaList");
export const getRoomId = (id: string) =>
  axiosInstance.get(`/bilibili/getRoomId/${id}`);
export const getRoomInfo = (id: string) =>
  axiosInstance.get(`/bilibili/getRoomInfo/${id}`);
