import axios from 'axios';

// 创建axios实例
const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: 0,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
});

// 创建一个不带token的axios实例
export const publicAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: 0,
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        // 从localStorage获取token
        const token = localStorage.getItem('token');
        
        // 如果存在token，将其添加到请求头中
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        let errorMessage = '服务器错误，请稍后再试';
        
        if (error.response) {
        // 服务器返回了错误状态码
        const { status, data } = error.response;
        
        switch (status) {
            case 400:
            errorMessage = data.message || '请求参数错误';
            break;
            case 401:
            errorMessage = data.message || '未授权，请重新登录';
            // 可以在这里处理未授权情况，如清除本地token并跳转到登录页
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('role');
            // 如果是在浏览器环境中
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
            break;
            case 403:
            errorMessage = data.message || '权限不足，无法访问';
            break;
            case 404:
            errorMessage = data.message || '请求的资源不存在';
            break;
            case 500:
            errorMessage = data.message || '服务器错误';
            break;
            default:
            errorMessage = data.message || `服务器返回状态码: ${status}`;
        }
        } else if (error.request) {
        // 请求已发出，但没有收到响应
        errorMessage = '服务器无响应，请检查网络连接';
        } else {
        // 请求配置出错
        errorMessage = error.message || '请求错误';
        }
        
        console.error('API请求错误:', errorMessage);
        return Promise.reject({ message: errorMessage, originalError: error });
    }
);
// 默认导出配置好的axios实例
export default instance; 