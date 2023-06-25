import { axiosInstance } from "./axios";

export const getLoginQrCode = () => axiosInstance.get("/bilibili/login/qrcode");
