import { axiosInstance } from "./axios";

// 获取登录二维码
export const getLoginQrCode = () => axiosInstance.get("/bilibili/login/qrcode");
// 查询二维码扫码状态
export const getLoginPoll = (id: string) =>
  axiosInstance.get(`/bilibili/login/poll/${id}`);
