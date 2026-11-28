import axios from 'axios';
import { validateFrontendEnv } from './env';

if (typeof window !== 'undefined') {
  const envCheck = validateFrontendEnv();
  if (!envCheck.ok) {
    envCheck.warnings.forEach((w) => console.warn('[GenuAI Env]', w));
  }
}

const getBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }
  // In the browser:
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local development: use relative /api (proxied by Next.js to localhost:4000)
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
    // Production / Deployed environments (Render, Vercel, or custom domains):
    // Target the live Render backend directly so requests are not lost in reverse proxies
    return 'https://genuai-backend.onrender.com/api';
  }
  const backendUrl = process.env.GENUAI_BACKEND_URL?.trim() || process.env.BACKEND_URL?.trim();
  if (backendUrl) {
    return `${backendUrl.replace(/\/+$/, '')}/api`;
  }
  return 'https://genuai-backend.onrender.com/api';
};

const API_BASE = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  // Render Free Tier services can take 30-50 seconds to spin up from cold sleep.
  // Set timeout to 60000ms (60 seconds) so login and auth calls do not prematurely abort.
  timeout: 60000,
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
// Handle 429 / 503 / cold-start timeouts with retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;

    // Retry temporary overloads or cold-start timeouts once
    const isTimeout = error.code === 'ECONNABORTED' || String(error.message || '').includes('timeout');
    const isOverload = error.response?.status === 429 || error.response?.status === 503;

    if (config && (isOverload || isTimeout)) {
      config._retryCount = config._retryCount || 0;
      const maxRetries = isTimeout ? 1 : 3;
      if (config._retryCount < maxRetries) {
        config._retryCount += 1;
        const delay = isTimeout ? 2000 : Math.min(1000 * 2 ** config._retryCount, 8000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // Attach user-friendly message for timeout
    if (isTimeout) {
      error.message = 'The server is taking longer than usual to respond (it may be waking up from cold sleep). Please retry in a moment.';
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

