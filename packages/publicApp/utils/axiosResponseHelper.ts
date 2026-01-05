import { ElMessage } from 'element-plus';
import { useEventBus, EventType, emitBus } from 'eventbus';

export const requestSuccessHelper = (config: any, axiosInstance: any) => {
  const locale = localStorage.getItem('v_form_locale') || 'en-US';
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['accept-language'] = locale;
  }
  return config;
};
export const requestErrorHelper = (error: any, axiosInstance: any) => {
  return Promise.reject(error);
};

export const responseSuccessHelper = (response: any, axiosInstance: any) => {
  return response;
};
export const responseErrorHelper = async (error: any, axiosInstance: any) => {
  const originalRequest = error.config;

  if (error.response.status === 420) {
    console.log('token expired, clear token and redirect to login page');
    // TODO : may need to handle error message
    emitBus(EventType.USER_LOGIN__EXPIRE);
    return;
  }

  if (error.response.status >= 500) {
    const message = error.response.data.message || error.message;
    ElMessage.error(message);
    return Promise.reject(error);
  }
  if (error.response.status === 403) {
    console.log('token expired, clear token and redirect to login page');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    emitBus(EventType.USER_LOGIN__EXPIRE);
    return Promise.reject(error);
  }
  console.log('error', error, this);
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    try {
      // 使用 refresh token 获取新的 access token
      const refreshToken = localStorage.getItem('refresh_token');
      localStorage.setItem('access_token', refreshToken as string);

      const { data } = await axiosInstance.post('/api/auth/token', {}, {
        headers: {
          Authorization: 'Bearer ' + refreshToken
        }
      });
      console.log('retry', data);
      console.log('refresh token response', data);

      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      return axiosInstance(originalRequest);
    } catch (refreshError: any) {
      console.log('refresh error', refreshError);
      // 如果 refresh token 也过期了，则清除所有存储的 token，并导航到登录页面
      if (refreshError.response?.status === 403) {
        console.log('token expired, clear token and redirect to login page');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // notify other via event bus
        emitBus(EventType.USER_LOGIN__EXPIRE);
      }

      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
};
