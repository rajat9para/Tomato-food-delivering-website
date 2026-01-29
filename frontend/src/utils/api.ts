import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Don't set Content-Type for FormData - let browser set it
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  console.log(`🌐 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
    headers: config.headers,
    data: config.data instanceof FormData ? 'FormData' : config.data,
    fullUrl: `${config.baseURL}${config.url}`
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ [API ERROR] ${error.response?.status || 'NETWORK'} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    return Promise.reject(error);
  }
);

export default api;
