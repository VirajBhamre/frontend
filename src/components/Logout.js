import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import { clearAuthCookies } from '../utils/cookieUtils';

const Logout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // First, call the backend logout endpoint to clear server session
      await logout();
      
      // Clear client-side cookies
      clearAuthCookies();
      
      // Get current user before we clear localStorage
      const currentUser = getCurrentUser();
      
      // Check if the user is a superadmin and redirect to admin portal instead
      if (currentUser?.Role === 'SAdmin') {
        navigate('/admin-portal', { replace: true });
      } else {
        // Navigate to login page for other users
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
      disabled={isLoggingOut}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  );
};

export default Logout;