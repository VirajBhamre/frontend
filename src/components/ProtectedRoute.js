// src/components/ProtectedRoute.js
import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticatedByCookie, clearAuthCookies } from '../utils/cookieUtils';
import { getCurrentUser, getDashboardUrlByRole } from '../services/authService';
import { toast } from 'react-toastify';

/**
 * A component that protects routes requiring authentication
 * Redirects to login if not authenticated or to the appropriate dashboard if accessing a route for another role
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = isAuthenticatedByCookie();
  const currentUser = getCurrentUser();

  console.log('ProtectedRoute check - Auth status:', isAuthenticated, 'Current path:', location.pathname);
  
  if (currentUser) {
    console.log('User data:', {
      name: currentUser.Name,
      role: currentUser.Role, 
      empId: currentUser.EmpId,
      status: currentUser.Status
    });
  } else {
    console.warn('No user data available in ProtectedRoute');
  }

  // Force-retrieve user data from localStorage if not in memory
  useEffect(() => {
    if (!currentUser && localStorage.getItem('user')) {
      console.log('Attempting to recover user data from localStorage');
      const storedUser = JSON.parse(localStorage.getItem('user'));
      
      if (storedUser) {
        console.log('Retrieved user data:', storedUser);
        // Force a refresh to use the recovered data
        window.location.reload();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Please log in to access this page');
    } else if (!currentUser) {
      // This is a special case - we have auth cookies but no user data
      console.warn('Auth cookies found but no user data. Attempting to recover...');
      
      // Try to reinstate auth from alternative storage or clear cookies
      if (!localStorage.getItem('user')) {
        console.error('No user data found, clearing invalid auth state');
        clearAuthCookies();
        navigate('/login');
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // If not authenticated or no user data, redirect to login
  if (!isAuthenticated || !currentUser) {
    console.log('Redirecting to login - not authenticated or missing user data');
    return <Navigate to="/login" />;
  }

  // If adminOnly route, check if user is admin
  if (adminOnly && currentUser?.Role !== 'Admin' && currentUser?.Role !== 'SAdmin') {
    console.log('User is not admin, redirecting to their dashboard');
    toast.warning('You do not have permission to access this page');
    return <Navigate to={getDashboardUrlByRole(currentUser)} />;
  }

  // Check if user is accessing the correct dashboard for their role
  const correctDashboardUrl = getDashboardUrlByRole(currentUser);
  const currentPath = location.pathname;
  
  console.log('Correct dashboard URL:', correctDashboardUrl);

  // Special handling for employer dashboard
  if (currentUser.Role === 'Employer') {
    // Check if employer is at correct route based on status
    if (currentUser.Status === 'pending' && !currentPath.includes('/employer/pending')) {
      console.log('Employer has pending status, redirecting to pending page');
      return <Navigate to="/employer/pending" />;
    }
    
    if (currentUser.Status !== 'pending' && currentPath.includes('/employer/pending')) {
      console.log('Employer is approved, redirecting to dashboard');
      return <Navigate to="/employer/dashboard" />;
    }
  }

  // For role-specific paths, redirect to the appropriate dashboard if not matching user's role
  if (
    (currentPath.startsWith('/employer/dashboard') && !correctDashboardUrl.startsWith('/employer/dashboard')) ||
    (currentPath.startsWith('/subadmin/dashboard') && !correctDashboardUrl.startsWith('/subadmin/dashboard')) ||
    (currentPath.startsWith('/supervisor/dashboard') && !correctDashboardUrl.startsWith('/supervisor/dashboard')) ||
    (currentPath.startsWith('/agent/dashboard') && !correctDashboardUrl.startsWith('/agent/dashboard'))
  ) {
    console.log('User accessing wrong role dashboard, redirecting to correct one');
    toast.warning('Redirecting to your dashboard...');
    return <Navigate to={correctDashboardUrl} />;
  }

  return children;
};

export default ProtectedRoute;