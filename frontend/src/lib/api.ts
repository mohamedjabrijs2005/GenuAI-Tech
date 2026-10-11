import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  if (process.env.GENUAI_BACKEND_URL) {
    return `${process.env.GENUAI_BACKEND_URL}/api`;
  }
  return 'http://127.0.0.1:4000/api';
};

const API_BASE = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('genuai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — redirect to login
// Handle 429 (rate limit) with exponential backoff retry (up to 3 attempts)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config as any;

    // Handle rate limit / server overload with automatic retry
    if ((error.response?.status === 429 || error.response?.status === 503) && !config._retryCount) {
      config._retryCount = 0;
    }

    if (
      (error.response?.status === 429 || error.response?.status === 503) &&
      config._retryCount < 3
    ) {
      config._retryCount += 1;
      const delay = Math.min(1000 * 2 ** config._retryCount, 8000); // max 8s
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('genuai_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

