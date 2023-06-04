import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';
// 创建 axios 实例

// @ts-ignore
const httpsAgent: any = new HttpsProxyAgent(`http://127.0.0.1:${10809}`);

export const instance = axios.create({
    proxy:false,
    httpsAgent
});
// 添加请求拦截器
instance.interceptors.request.use(function (config:any) {
    // 判断请求地址是否包含 api.openai.com
    if (config.url.includes('api.openai.com')) {
        config.headers['Content-Type'] = 'application/json';
        // 添加 Authorization 请求头
        config.headers['Authorization'] = 'Bearer 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';
    }

    return config;
}, function (error: any) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 添加响应拦截器
instance.interceptors.response.use(function (response:any) {
    // 对响应数据做点什么
    return response;
}, function (error:any) {
    // 对响应错误做点什么
    return Promise.reject(error);
});

export default instance;
