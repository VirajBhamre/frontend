import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getEmployerStatus, logout } from '../../services/authService';
import { LogOut } from 'lucide-react';

const PendingStatus = () => {
  const navigate = useNavigate();
  
  // Handle logout function
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await getEmployerStatus();
        if (response.status === 'approved') {
          navigate('/employer/dashboard');
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    checkStatus(); // Initial check

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Logout Button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/WeWinLogo.png" alt="WeWin ERP" className="h-8" />
            <h1 className="ml-3 text-xl font-semibold text-gray-900">Employer Portal</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <LogOut size={18} className="mr-1" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Under Review</h2>
            <p className="text-gray-600">
              Thank you for registering! Your account is currently pending approval from our administrators.
            </p>
          </div>
          <div className="animate-pulse flex justify-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-500">
            You will be automatically redirected once your account is approved. This page refreshes every 30 seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingStatus;