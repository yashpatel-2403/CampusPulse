import axios from 'axios';

const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '');
export const API_ORIGIN = configuredUrl?.endsWith('/api')
  ? configuredUrl.slice(0, -4)
  : configuredUrl || '';

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 if NOT an auth endpoint (login/signup should show error to user)
    if (err.response?.status === 401) {
      const isAuthEndpoint = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/signup');
      if (!isAuthEndpoint) {
        localStorage.removeItem('cp_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
