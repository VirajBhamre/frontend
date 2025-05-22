import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { isAuthenticatedByCookie } from '../../utils/cookieUtils';
import { toast } from 'react-toastify';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  // Use cookie-based authentication check
  const isAuthenticated = isAuthenticatedByCookie();
  
  if (!isAuthenticated) {
    toast.info('Please log in to access this page');
    return <Navigate to="/login" replace />;
  }

  // Get the current user from localStorage (user data without tokens)
  const currentUser = getCurrentUser();
  
  // Handle admin-only routes
  if (adminOnly && currentUser?.Role !== 'Admin' && currentUser?.Role !== 'SAdmin') {
    toast.warning('You do not have permission to access this page');
    return <Navigate to="/dashboard" replace />;
  }

  // Handle employer redirects based on approval status
  if (currentUser?.Role === 'Employer') {
    const status = currentUser.Status || 'pending';
    
    // Redirect to pending page if not approved and not already on that page
    if (status !== 'approved' && window.location.pathname !== '/employer/pending') {
      return <Navigate to="/employer/pending" replace />;
    }
    
    // If they're approved but trying to access the pending page, redirect to dashboard
    if (status === 'approved' && window.location.pathname === '/employer/pending') {
      return <Navigate to="/employer/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;