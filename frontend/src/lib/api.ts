import axios from 'axios';

const getBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const backendUrl = process.env.GENUAI_BACKEND_URL?.trim();
  if (backendUrl) {
    return `${backendUrl.replace(/\/+$/, '')}/api`;
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
    const config = error.config;

    // Retry temporary overloads when a request config is available.
    if (config && (error.response?.status === 429 || error.response?.status === 503)) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 3) {
        config._retryCount += 1;
        const delay = Math.min(1000 * 2 ** config._retryCount, 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !String(config?.url || '').includes('/auth/login') &&
      !String(config?.url || '').includes('/auth/register')
    ) {
      localStorage.removeItem('genuai_token');
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;

