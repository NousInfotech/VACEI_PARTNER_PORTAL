import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response Interceptor: on 401 clear auth and redirect to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationMember');
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedService');
      const path = window.location.pathname || '';
      if (!path.startsWith('/login') && !path.startsWith('/forgot-password')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
