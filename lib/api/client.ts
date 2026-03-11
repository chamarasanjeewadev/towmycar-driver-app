import axios from 'axios';
import { ENV } from '@/env';

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getTokenFn: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

apiClient.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[API] No auth token available for request:', config.url);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const responseData = error.response?.data;

    console.error(`[API] ✗ ${method} ${url} → ${status ?? 'NETWORK ERROR'}`);
    if (responseData) {
      console.error('[API] Error response:', JSON.stringify(responseData, null, 2));
    } else if (error.message) {
      console.error('[API] Error message:', error.message);
    }

    // Attach readable message to the error for UI consumption
    if (responseData?.error) {
      error.userMessage = responseData.error;
    } else if (status === 401) {
      error.userMessage = 'Session expired. Please sign in again.';
    } else if (status === 403) {
      error.userMessage = 'Access denied. You may not be approved as a driver yet.';
    } else if (status === 404) {
      error.userMessage = 'Not found. Your driver profile may not be set up yet.';
    } else if (!status) {
      error.userMessage = 'Network error. Check your internet connection.';
    } else {
      error.userMessage = `Server error (${status}). Please try again.`;
    }

    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an API error */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error && typeof error === 'object') {
    if ('userMessage' in error && typeof (error as { userMessage: string }).userMessage === 'string') {
      return (error as { userMessage: string }).userMessage;
    }
    if ('message' in error && typeof (error as { message: string }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return fallback;
}
