import axios from 'axios';
import { message } from 'antd';
import { baseURL, tokenName, contentType } from 'systemConfig';
import { getToken } from './util';
import qs from 'qs';

const axiosConfig = {
  timeout: 30000,
  baseURL,
};
if (contentType) {
  axiosConfig.headers = {
    'Content-Type': contentType,
  };
}
const axiosInstance = axios.create(axiosConfig);

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    // 如果请求配置中指定了fullResponse，返回完整的响应对象
    if (response.config.fullResponse) {
      return response;
    }
    return response.data;
  },
  (error) => {
    const data = error.response?.data;
    if (data && data.msg) {
      message.error(data.msg);
    } else {
      message.error('请求失败，请稍后重试');
    }
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (tokenName && token) {
    if (!config.headers) config.headers = {};
    config.headers[tokenName] = token;
  }

  return config;
});

const paramsSerializer = {
  serialize: (params) => {
    return qs.stringify(params);
  },
};

class HTTP {
  post(url, params, config) {
    return axiosInstance.post(url, params, config);
  }
  get(url, params, config) {
    return axiosInstance.get(url, {
      params,
      paramsSerializer,
      ...config,
    });
  }
  put(url, params, config) {
    return axiosInstance.put(url, params, config);
  }
  delete(url, params, config) {
    return axiosInstance.delete(url, {
      params,
      paramsSerializer,
      ...config,
    });
  }
}

const Http = new HTTP();

export default Http;
