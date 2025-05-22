// src/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAccessToken, isAuthenticatedByCookie, clearAuthCookies } from '../utils/cookieUtils';

// Enhanced token retrieval function that tries multiple sources
const getEffectiveToken = () => {
  // Try cookie-based token first
  const cookieToken = getAccessToken();
  if (cookieToken) return cookieToken;
  
  // Try localStorage with multiple possible keys
  const localStorageKeys = ['token', 'authToken', 'jwt', 'accessToken'];
  for (const key of localStorageKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  
  // Try sessionStorage with multiple possible keys
  for (const key of localStorageKeys) {
    const token = sessionStorage.getItem(key);
    if (token) return token;
  }
  
  // Try to extract from document.cookie directly
  if (document.cookie) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (['token', 'authToken', 'jwt', 'accessToken'].includes(name)) {
        return decodeURIComponent(value);
      }
    }
  }
  
  // If nothing found, return empty string
  return '';
};

// Get the base URL from environment variable
const getBaseUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'https://weerp.wewinlimited.com/api';
  console.log('Using API base URL:', baseUrl);
  return baseUrl;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies with cross-origin requests
});

api.interceptors.request.use(
  (config) => {
    // Get token using the enhanced function
    const effectiveToken = getEffectiveToken();
    
    if (effectiveToken) {
      // Set Authorization header with Bearer token
      config.headers.Authorization = `Bearer ${effectiveToken}`;
      
      // For APIs that expect AuthToken in the payload,
      // always set the AuthToken field regardless of its current value
      if (config.data && typeof config.data === 'object') {
        config.data.AuthToken = effectiveToken;
      }
    } else {
      // If no token is found but we need one for payload, use a placeholder
      if (config.data && typeof config.data === 'object' && !config.data.AuthToken) {
        // Only add placeholder if the endpoint expects a token but we don't have one
        const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.endsWith(endpoint));
        if (!isPublicEndpoint) {
          console.warn('No authentication token found for protected API call');
          config.data.AuthToken = 'missing-token';
        }
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('Network error details:', error);
      toast.error('Network error - please check your connection');
      return Promise.reject(new Error('Network error - please check your connection'));
    }

    if (error.response.status === 401) {
      // Clear cookies instead of localStorage
      clearAuthCookies();
      
      // Also clear any token from localStorage for cleanup
      const localStorageKeys = ['token', 'authToken', 'jwt', 'accessToken'];
      for (const key of localStorageKeys) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
      
      toast.info('Session expired. Please log in again.');
      // Redirect to login page
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    }

    return Promise.reject(error);
  }
);

// Define public API endpoints that don't require authentication
const publicEndpoints = [
  '/accounts/login',
  '/accounts/signup',
  '/accounts/employer-login',
  '/master/product/public',
  '/products/public'
];

// Auth API endpoints with correct request format
export const authAPI = {
  login: (data) => {
    const baseUrl = getBaseUrl();
    console.log("Making login request to:", baseUrl);
    return api.post('/accounts/login', {
      RequestId: `login-${Date.now()}`,
      AuthToken: "", // No token for login
      Payload: data
    });
  },
  register: (data) => api.post('/accounts/signup', {
    RequestId: `signup-${Date.now()}`,
    AuthToken: "", // No token for signup
    Payload: data
  }),
  logout: () => api.post('/accounts/logout'),
  changePassword: (data) => api.post('/accounts/change-password', {
    RequestId: `cp-${Date.now()}`,
    AuthToken: "", // Set by interceptor
    Payload: data
  }),
  getEmployerStatus: (employerId) => api.post('/accounts/employer-status', {
    RequestId: `emp-status-${Date.now()}`,
    AuthToken: "", // Set by interceptor
    Payload: {
      employerId
    }
  }),
  getPublicProducts: () => api.get('/master/product/public'),
};

export default api;