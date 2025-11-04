import axios, { AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config';
import { logger } from '../utils/logger';

logger.info('Configuring API with base URL:', API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Enable credentials to allow cookies to be sent and received
  withCredentials: true,
  timeout: 10000, // 10 seconds
});

// Request interceptor - logs requests in dev mode
axiosInstance.interceptors.request.use(
  (config) => {
    // Log all requests except OPTIONS
    if (config.method?.toUpperCase() !== 'OPTIONS') {
      logger.log(`→ ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Don't add headers for OPTIONS requests
    if (config.method?.toUpperCase() === 'OPTIONS') {
      return config;
    }
    return config;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);


// Keep track of whether a refresh request is already in progress
let isRefreshing = false;
// Store pending requests
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

// Process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - handles logging, auth refresh, and error formatting
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in dev mode
    logger.log(`✓ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Log error responses
    if (error.response) {
      logger.error(`✗ ${error.response.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`);
    } else if (error.request) {
      logger.error('✗ Network error (no response):', error.message);
    } else {
      logger.error('✗ Request error:', error.message);
    }

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Check if it's a 401 error and not a refresh token request
    // and not already retrying this request
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !(originalRequest as any).__isRetryRequest
    ) {
      if (isRefreshing) {
        // If a refresh is already in progress, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      (originalRequest as any).__isRetryRequest = true;

      try {
        // Send token refresh request
        const response = await axiosInstance.post(
          API_ENDPOINTS.AUTH.REFRESH
        );

        // If refresh successful, retry original request
        if (response.status === 200) {
          // Process any pending requests
          processQueue(null);
          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, reject all pending requests
        processQueue(refreshError);

        // Store the current URL to redirect back after login
        sessionStorage.setItem('redirectUrl', window.location.pathname);

        // Only redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          logger.warn('Refresh token failed, redirecting to login');
          window.location.href = '/login';
        }
      } finally {
        isRefreshing = false;
      }
    }

    // Convert backend error responses to a more usable format
    if (error.response?.data) {
      const backendError = error.response.data as Record<string, any>;
      const enhancedError: any = new Error(
        backendError.detail || backendError.message || 'An error occurred'
      );
      enhancedError.status = error.response.status;
      enhancedError.data = backendError;
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
