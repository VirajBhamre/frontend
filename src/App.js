// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth & Routing Components
import AuthRoute from './components/authPages/AuthRoute';
import ProtectedRoute from './components/ProtectedRoute'; // Updated import path
import checkAuthStatus from './utils/authChecker';
import { isAuthenticatedByCookie } from './utils/cookieUtils';
import { getCurrentUser, getDashboardUrlByRole } from './services/authService';

// Layouts & Pages
import Navbar from './components/Navbar';
import AuthPage from './components/authPages/AuthPage';
import Signup from './components/authPages/Signup';
import Employer from './components/authPages/Employer';
import EmployerPending from './components/authPages/EmployerPending';
import EmployerDashboard from './components/pages/EmployerDashboard';
import SubAdminDashboard from './components/pages/SubAdminDashboard';
import SupervisorDashboard from './components/pages/SupervisorDashboard';
import AgentDashboard from './components/pages/AgentDashboard';
import OfficerMasterDashboard from './components/pages/OfficerMasterDashboard';
import PendingStatus from './components/pages/PendingStatus';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

// Admin Components
import AdminLogin from './components/authPages/AdminLogin';
import PendingEmployers from './components/SAdmin/PendingEmployers';

// Dashboard Children
import Module from './components/masters/Module';
import SubModule from './components/masters/SubModule';
import Table from './components/masters/Table';
import Products from './components/masters/Products';
import Suggestion from './components/pages/Suggestion';
import Information from './components/pages/Information';

// Import citizen components
import CitizenRegister from './components/authPages/CitizenRegister';
import CitizenDashboard from './components/pages/CitizenDashboard';

// Component to handle root path redirects based on authentication status and user role
const RootRedirect = () => {
  const isAuthenticated = isAuthenticatedByCookie();
  const currentUser = getCurrentUser();

  if (isAuthenticated && currentUser) {
    // Redirect to the appropriate dashboard for the user's role
    return <Navigate to={getDashboardUrlByRole(currentUser)} replace />;
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
};

function App() {
  // Check authentication status when the app loads
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <Router>
      {/* Toast Container for Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Main Routes Configuration */}
      <Routes>
        {/* Redirect from root based on authentication status and role */}
        <Route path="/" element={<RootRedirect />} />

        {/* Secret Admin Login Route - Not linked from main application */}
        <Route
          path="/admin-portal"
          element={
            <AuthRoute>
              <AdminLogin />
            </AuthRoute>
          }
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Navbar />
              <AuthPage />
            </AuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <Navbar />
              <Signup />
            </AuthRoute>
          }
        />
        <Route
          path="/citizen-register"
          element={
            <AuthRoute>
              <Navbar />
              <CitizenRegister />
            </AuthRoute>
          }
        />
        <Route
          path="/employer"
          element={
            <AuthRoute>
              <Navbar />
              <Employer />
            </AuthRoute>
          }
        />
        
        {/* Employer Routes */}
        <Route
          path="/employer/pending"
          element={
            <ProtectedRoute>
              <Navbar />
              <PendingStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/dashboard/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Sub-Admin Routes */}
        <Route
          path="/subadmin/dashboard/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <SubAdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Supervisor Routes */}
        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Agent Routes */}
        <Route
          path="/agent/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        {/* OfficerMaster Routes */}
        <Route
          path="/officermaster/dashboard/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <OfficerMasterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes (Require Authentication) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Nested Routes */}
          <Route path="master/module" element={<Module />} />
          <Route path="master/submodule" element={<SubModule />} />
          <Route path="master/table" element={<Table />} />
          <Route path="master/products" element={<Products />} />
          <Route path="suggestions" element={<Suggestion />} />
          <Route path="information" element={<Information />} />
          
          {/* Admin Routes - Added as nested routes */}
          <Route path="admin/employers/pending" element={<PendingEmployers />} />
        </Route>

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navbar />
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Citizen Routes */}
        <Route
          path="/citizen/dashboard/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
