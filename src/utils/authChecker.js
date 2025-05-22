// src/utils/authChecker.js
import { clearAuthCookies, isAuthenticatedByCookie } from './cookieUtils';
import { getCurrentUser, getDashboardUrlByRole } from '../services/authService';

/**
 * Check authentication status and clean up inconsistent state
 * Call this on app initialization
 * 
 * @returns {Object} Current authentication state
 */
export const checkAuthStatus = () => {
  const hasCookieAuth = isAuthenticatedByCookie();
  const user = getCurrentUser();
  
  // Clean up inconsistent state:
  // 1. Has user in localStorage but no valid auth cookie
  if (!hasCookieAuth && user) {
    console.log('Found inconsistent auth state: user data without valid auth token');
    localStorage.removeItem('user');
    return { isAuthenticated: false, user: null };
  }
  
  // 2. Has auth cookie but no user in localStorage (rare case)
  if (hasCookieAuth && !user) {
    console.log('Found inconsistent auth state: valid auth token without user data');
    clearAuthCookies();
    return { isAuthenticated: false, user: null };
  }
  
  // Return current state
  return {
    isAuthenticated: hasCookieAuth,
    user: user,
    dashboardUrl: user ? getDashboardUrlByRole(user) : '/login'
  };
};

export default checkAuthStatus;