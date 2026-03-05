import axios from 'axios';
import { endPoints } from './endPoint';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function clearAuthStorage(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('organizationMember');
  localStorage.removeItem('userRole');
  localStorage.removeItem('selectedService');
}

// Request Interceptor: Attach token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('vacei-active-company') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (companyId) {
      config.headers['X-Company-Id'] = companyId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: on 401 try refresh token, then retry or redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.startsWith('/login') || path.startsWith('/forgot-password')) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(`${baseURL}${endPoints.AUTH.REFRESH}`, { refreshToken });

          if (res.data?.success && res.data?.data?.token) {
            const newToken = res.data.data.token;
            const newRefreshToken = res.data.data.refreshToken;

            localStorage.setItem('token', newToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed or invalid response: clear auth and redirect
          clearAuthStorage();
          window.location.href = '/login?message=' + encodeURIComponent('Session expired. Please log in again.');
          return Promise.reject(refreshError);
        }
      }

      // No refresh token or refresh already attempted: clear auth and redirect
      clearAuthStorage();
      window.location.href = '/login?message=' + encodeURIComponent('Session expired. Please log in again.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
