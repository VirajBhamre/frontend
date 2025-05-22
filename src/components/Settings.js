import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService'; // Ensure paths are correct
import { toast } from 'react-toastify';
import ChangePassword from './authPages/ChangePassword'; // Ensure path is correct
import { Menu as MenuIcon, LogOut, User, Settings, Lock } from 'lucide-react'; // Renamed Menu import

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Initialize with null
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Manage sidebar visibility for mobile
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login'); // Redirect if not logged in
    } else {
      setUser(currentUser); // Set user data
    }
  }, [navigate]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every 60 seconds
    return () => clearInterval(timer); // Cleanup timer on unmount
  }, []);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Logout successful');
      
      // Check if the user is a superadmin and redirect to admin portal instead
      if (user?.Role === 'SAdmin') {
        navigate('/admin-portal');
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  }, [navigate, user]);

  // Format date consistently
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(date);
  };

  // Format time consistently
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(date);
  };

  // Placeholder dashboard stats data
  const dashboardModules = [
    { id: 1, title: 'Users', count: 243, icon: '👥' },
    { id: 2, title: 'Products', count: 156, icon: '📦' },
    { id: 3, title: 'Orders', count: 64, icon: '🛒' },
    { id: 4, title: 'Revenue', count: '₹45,390', icon: '💰' },
  ];

  // --- Loading State ---
  // Render loading indicator ONLY if user data is not yet available
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-600">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Render Dashboard ---
  return (
    <div className="min-h-screen flex bg-[#f5f7fa]">
      {/* Conditionally render Change Password Modal */}
      {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}

      {/* Sidebar Navigation */}
      {/* Sidebar visibility controlled by state, responsive transition */}
      <aside className={`fixed top-0 left-0 h-full z-40 bg-[#d0e1ff] shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-60 md:translate-x-0 md:w-60`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-800">WeERP</h2>
          {/* Close button for mobile */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-600 text-xl hover:text-gray-800">
            ×
          </button>
        </div>

        {/* User Profile Section in Sidebar */}
        <div className="flex flex-col items-center gap-2 py-6 border-b border-gray-300 mx-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-white text-[#ff4473] flex items-center justify-center text-xl font-bold overflow-hidden">
            {/* **FIXED HERE**: Check user and user.name before accessing charAt */}
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          {/* Display user name safely */}
          <h3 className="text-sm font-semibold truncate max-w-full px-2">{user.name || 'User'}</h3>
          <p className="text-xs text-gray-500">{user.role || 'Role not assigned'}</p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-4">
          {/* Example Nav Structure - adapt with actual routes/components */}
           <button className="w-full flex items-center gap-3 text-left text-sm px-4 py-2 rounded-md text-[#ff4473] bg-white font-medium">
            <MenuIcon size={16} /> Dashboard
           </button>
           <button className="w-full flex items-center gap-3 text-left text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-white/70">
             <User size={16} /> Profile
           </button>
           <button onClick={() => setShowChangePassword(true)} className="w-full flex items-center gap-3 text-left text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-white/70">
             <Lock size={16} /> Change Password
           </button>
           <button className="w-full flex items-center gap-3 text-left text-sm px-4 py-2 rounded-md text-gray-700 hover:bg-white/70">
             <Settings size={16} /> Settings
           </button>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 text-left text-sm px-4 py-2 rounded-md text-red-600 hover:bg-red-50">
             <LogOut size={16} /> Logout
           </button>
        </nav>
      </aside>

       {/* Overlay for mobile when sidebar is open */}
       {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
       )}

      {/* Main Content Area */}
      {/* Adjust left margin based on sidebar visibility on medium+ screens */}
      <main className="flex-1 ml-0 md:ml-60 min-h-screen p-4 sm:p-6">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-6">
          {/* Hamburger menu button for mobile */}
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-xl p-2 -ml-2 text-gray-700 hover:bg-gray-200 rounded-full">
            <MenuIcon />
          </button>
          {/* Ensure div takes space even when button is hidden */}
          <div className="hidden md:block w-8"></div>

          {/* Date and Time Display */}
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-500">{formatDate(currentTime)}</div>
            <div className="text-base sm:text-lg font-semibold text-gray-800">{formatTime(currentTime)}</div>
          </div>
        </header>

        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome, {user.name || 'User'} 👋</h1>
          <p className="text-sm text-gray-500">Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {dashboardModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between gap-3">
              <div className="text-3xl flex-shrink-0">{module.icon}</div>
              <div className="text-right overflow-hidden">
                <h3 className="text-sm font-medium text-gray-600 truncate">{module.title}</h3>
                <p className="text-lg sm:text-xl font-semibold text-[#ff4473] truncate">{module.count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* User Account Information Card */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Account Information</h2>
          <div className="grid gap-3 text-sm text-gray-700">
            {/* Display user details safely */}
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium text-gray-600">Name:</span>
              <span>{user.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium text-gray-600">Email:</span>
              <span>{user.email || 'N/A'}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-600">Phone:</span>
                <span>{user.phone}</span>
              </div>
            )}
            {user.aadhaar && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-600">Aadhaar:</span>
                {/* Simple masking example */}
                <span>{'**** **** ' + user.aadhaar.slice(-4)}</span>
              </div>
            )}
            {user.dob && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-gray-600">Date of Birth:</span>
                <span>{new Date(user.dob).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            {user.gender && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Gender:</span>
                <span>{user.gender}</span>
              </div>
            )}

            {/* Change Password Button */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowChangePassword(true)}
                className="rounded-md bg-[#ff4473] text-white px-5 py-2 text-sm font-semibold hover:bg-[#e03b65] transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
