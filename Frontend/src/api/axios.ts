import axios, { AxiosInstance, AxiosResponse, CancelToken } from "axios";

interface RequestOptions {
  params?: any;
  data?: any;
  headers?: any;
  cancelToken?: CancelToken;
}

interface ErrorInfo {
  code: number;
  message: string;
}

interface ErrorResponse {
  response: {
    status: number;
    data: ErrorInfo;
  };
}

const ERROR_MESSAGE_MAP: Record<number, string> = {
  401: "认证失败，无法访问系统资源",
  403: "您无权访问该资源",
  404: "请求的资源不存在",
  500: "系统内部错误",
  502: "错误网关",
  503: "服务不可用",
  504: "请求超时，请检查您的网络连接",
};

export default class AxiosService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.response.use(
      this.handleResponse,
      this.handleError
    );
  }

  public get<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get(url, {
      ...options,
    });
  }

  public post<T = any>(
    url: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post(url, data, {
      ...options,
    });
  }

  public put<T = any>(
    url: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.put(url, data, {
      ...options,
    });
  }

  public patch<T = any>(
    url: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.patch(url, data, {
      ...options,
    });
  }

  public delete<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    return this.axiosInstance.delete(url, {
      ...options,
    });
  }

  private handleResponse<T>(response: AxiosResponse<T>): AxiosResponse<T> {
    return response;
  }

  private handleError(error: ErrorResponse): Promise<never> {
    const { response } = error;

    if (response && response.status) {
      const errorMessage =
        ERROR_MESSAGE_MAP[response.status] || error.response.data.message;
      return Promise.reject(new Error(errorMessage));
    }

    return Promise.reject(error);
  }
}
export const axiosInstance = new AxiosService("http://localhost:4000");
