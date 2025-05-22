// src/utils/cookieUtils.js
/**
 * Cookie utility functions for handling authentication tokens
 */

// Set a cookie with optional expiry (default 30 minutes)
export const setCookie = (name, value, expiryMinutes = 30) => {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (expiryMinutes * 60 * 1000));
  const expires = `expires=${expiryDate.toUTCString()}`;
  
  // Set the cookie with secure flags when in production
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict${secure}`;
};

// Get a cookie by name
export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return '';
};

// Remove a cookie by name
export const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Set authentication tokens in cookies
export const setAuthCookies = (accessToken, refreshToken, expiryMinutes = 30) => {
  setCookie('accessToken', accessToken, expiryMinutes);
  setCookie('refreshToken', refreshToken, expiryMinutes * 7); // Refresh token lasts longer
  setCookie('isAuthenticated', 'true', expiryMinutes);
};

// Clear all authentication cookies
export const clearAuthCookies = () => {
  removeCookie('accessToken');
  removeCookie('refreshToken');
  removeCookie('isAuthenticated');
};

// Check if user is authenticated based on cookies
export const isAuthenticatedByCookie = () => {
  const authFlag = getCookie('isAuthenticated');
  const token = getCookie('accessToken');
  
  // Debug cookie values
  console.log('Auth cookie check - isAuthenticated:', authFlag, 'accessToken exists:', !!token);
  
  // Either condition can indicate authentication
  return (authFlag === 'true' || !!token);
};

// Get access token from cookie
export const getAccessToken = () => {
  return getCookie('accessToken');
};

// Get refresh token from cookie
export const getRefreshToken = () => {
  return getCookie('refreshToken');
};