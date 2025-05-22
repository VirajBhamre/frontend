import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Users, UserPlus, FileText, Settings, HelpCircle, ChevronsRight, Home, Briefcase, Calendar, Building, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import api from '../../services/api';
import SupervisorsManagement from './roleManagement/SupervisorsManagement';
import AgentsManagement from './roleManagement/AgentsManagement';
import SubAdminComplaintsManagement from './roleManagement/SubAdminComplaintsManagement';
import { getCurrentUser } from '../../services/authService';

// Dashboard Overview Component for SubAdmin
const DashboardOverview = ({ subAdminData, employerData, onNavigate }) => {
  const cardRefs = useRef([]);
  const buttonRefs = useRef([]);

  useEffect(() => {
    // Animate cards on component mount
    gsap.fromTo(
      cardRefs.current,
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.15,
        ease: "power2.out"
      }
    );

    // Add hover animation to buttons
    buttonRefs.current.forEach(button => {
      if (!button) return;
      
      const arrowElement = button.querySelector('.arrow-icon');
      
      button.addEventListener('mouseenter', () => {
        gsap.to(arrowElement, {
          x: 5,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(arrowElement, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });

    return () => {
      // Cleanup event listeners
      buttonRefs.current.forEach(button => {
        if (!button) return;
        button.removeEventListener('mouseenter', () => {});
        button.removeEventListener('mouseleave', () => {});
      });
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Company Info Card */}
      <div 
        ref={el => cardRefs.current[0] = el} 
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mr-3">
            <Building size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
        </div>
        <div className="space-y-3 text-gray-600">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Company Name</span>
            <span className="font-medium text-gray-800">{employerData?.CompanyName || subAdminData.EmployerName || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Total Licenses</span>
            <span className="font-medium text-gray-800">{employerData?.Licenses || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Used Licenses</span>
            <span className="font-medium text-gray-800">{employerData?.UsedLicenses || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Available Licenses</span>
            <span className="font-medium text-gray-800">
              {employerData?.Licenses && employerData?.UsedLicenses 
                ? (employerData.Licenses - employerData.UsedLicenses) 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Info Card */}
      <div 
        ref={el => cardRefs.current[1] = el} 
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
            <Briefcase size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
        </div>
        <div className="space-y-3 text-gray-600">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Name</span>
            <span className="font-medium text-gray-800">{subAdminData.Name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Email</span>
            <span className="font-medium text-gray-800">{subAdminData.EmailId}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Mobile</span>
            <span className="font-medium text-gray-800">{subAdminData.MobileNo}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Role</span>
            <span className="font-medium text-gray-800">Sub-Admin</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div 
        ref={el => cardRefs.current[2] = el} 
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 mr-3">
            <Settings size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
        </div>
        <div className="space-y-3">
          <button 
            ref={el => buttonRefs.current[0] = el}
            onClick={() => onNavigate('/subadmin/dashboard/supervisors')}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Manage Supervisors
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
          <button 
            ref={el => buttonRefs.current[1] = el}
            onClick={() => onNavigate('/subadmin/dashboard/agents')}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Manage Agents
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
          <button 
            ref={el => buttonRefs.current[2] = el}
            onClick={() => onNavigate('/subadmin/dashboard/complaints')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              View Complaints
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const SubAdminDashboard = () => {
  const [subAdminData, setSubAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employerData, setEmployerData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Create refs for animations
  const headerRef = useRef(null);
  const companyRef = useRef(null);
  const navRef = useRef(null);
  const contentRef = useRef(null);

  const fetchSubAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser || !currentUser.UserId) {
        throw new Error('User data not found');
      }

      // Check if we already have company information from login
      if (currentUser.CompanyName && currentUser.EmpId) {
        setEmployerData({
          EmpId: currentUser.EmpId,
          CompanyName: currentUser.CompanyName,
          Licenses: currentUser.Licenses || 50,
          UsedLicenses: currentUser.UsedLicenses || 0
        });
      }

      // Fetch sub-admin profile
      const response = await api.post('/employers/subadmins/profile', {
        RequestId: `get-subadmin-profile-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { subAdminId: currentUser.UserId }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        setSubAdminData(data);
        
        // Get employer data to use for license info if we don't have it already
        if (!currentUser.CompanyName || !currentUser.EmpId) {
          try {
            const empResponse = await api.post('/employers/employer', {
              RequestId: `get-employer-profile-${Date.now()}`,
              AuthToken: localStorage.getItem('token') || '',
              Payload: { empId: data.EmpId }
            });
            
            if (empResponse.data.success || empResponse.data.Success) {
              const empData = empResponse.data.data || empResponse.data.Data;
              setEmployerData(empData);
              
              // Store this information for future use
              const updatedUser = {
                ...currentUser,
                EmpId: empData.EmpId,
                CompanyName: empData.CompanyName || empData.Name,
                Licenses: empData.Licenses,
                UsedLicenses: empData.UsedLicenses
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (empError) {
            console.error('Error fetching employer data:', empError);
          }
        }
      } else {
        toast.error('Failed to load profile data');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching sub-admin data:', error);
      toast.error('Failed to load profile data. Please refresh the page.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refresh sub-admin data
  const refreshData = useCallback(() => {
    console.log("Refreshing sub-admin data...");
    return fetchSubAdminData();
  }, [fetchSubAdminData]);

  useEffect(() => {
    fetchSubAdminData();
  }, [fetchSubAdminData]);

  // Apply animations when component mounts and data is loaded
  useEffect(() => {
    if (!loading && subAdminData) {
      // Create a timeline for smoother animations
      const tl = gsap.timeline();
      
      // Animate header
      tl.fromTo(
        headerRef.current, 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
      
      // Animate company banner if it exists
      if (companyRef.current) {
        tl.fromTo(
          companyRef.current,
          { y: -10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
          "-=0.3"
        );
      }
      
      // Animate navigation
      tl.fromTo(
        navRef.current.querySelectorAll('a'), 
        { y: -10, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.3, ease: "power1.out" },
        "-=0.2"
      );
      
      // Animate content
      tl.fromTo(
        contentRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 },
        "-=0.1"
      );
    }
  }, [loading, subAdminData]);

  // Get active path based on current location
  const getActivePath = () => {
    const path = location.pathname;
    if (path.includes('/supervisors')) return 'supervisors';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/complaints')) return 'complaints';
    return 'overview';
  };

  const activePath = getActivePath();

  // Handle navigation to specific pages with animation
  const handleNavigate = (path) => {
    // Animate content fade out
    gsap.to(contentRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        navigate(path);
        // Animate content fade in
        gsap.to(contentRef.current, {
          opacity: 1,
          duration: 0.3,
          delay: 0.1
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Handle case where data couldn't be loaded
  if (!subAdminData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border-l-4 border-yellow-400 p-5 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-800">Could not load data</h3>
              <p className="text-gray-600 mt-1">
                We couldn't load your profile data. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companyName = employerData?.CompanyName || subAdminData.EmployerName || "Your Company";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div ref={headerRef} className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {subAdminData.Name}</h1>
        <p className="text-gray-600">Sub-Admin Dashboard | Manage supervisors and agents</p>
      </div>

      {/* Company Banner */}
      <div 
        ref={companyRef}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm mb-6"
      >
        <div className="flex items-center">
          <Building className="mr-3 h-6 w-6" />
          <div>
            <p className="text-sm text-blue-100">COMPANY</p>
            <h2 className="text-xl font-bold">{companyName}</h2>
          </div>
          {employerData && (
            <div className="ml-auto text-right">
              <p className="text-sm text-blue-100">LICENSES</p>
              <p className="text-lg font-medium">
                {employerData.UsedLicenses || 0} / {employerData.Licenses || 50}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div ref={navRef} className="bg-white shadow-sm rounded-xl mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          <Link 
            to="/subadmin/dashboard" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <Home size={18} className="mr-2" />
            Overview
          </Link>
          <Link 
            to="/subadmin/dashboard/supervisors" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'supervisors' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <Users size={18} className="mr-2" />
            Supervisors
          </Link>
          <Link 
            to="/subadmin/dashboard/agents" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'agents' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <UserPlus size={18} className="mr-2" />
            Agents
          </Link>
          <Link 
            to="/subadmin/dashboard/complaints" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'complaints' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <MessageSquare size={18} className="mr-2" />
            Complaints
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="mt-6">
        <Routes>
          <Route 
            path="/" 
            element={<DashboardOverview 
              subAdminData={subAdminData} 
              employerData={employerData}
              onNavigate={handleNavigate} 
            />} 
          />
          <Route 
            path="/supervisors" 
            element={
              <SupervisorsManagement 
                employerId={subAdminData.EmpId}
                subAdminId={subAdminData.SubAdminId}
                onLicenseUpdate={refreshData}
                totalLicenses={employerData?.Licenses || 50}
                usedLicenses={employerData?.UsedLicenses || 0}
                companyName={companyName}
              />
            } 
          />
          <Route 
            path="/agents" 
            element={
              <AgentsManagement 
                employerId={subAdminData.EmpId}
                subAdminId={subAdminData.SubAdminId}
                onLicenseUpdate={refreshData}
                totalLicenses={employerData?.Licenses || 50}
                usedLicenses={employerData?.UsedLicenses || 0}
                companyName={companyName}
              />
            } 
          />
          <Route 
            path="/complaints" 
            element={
              <SubAdminComplaintsManagement 
                subAdminId={subAdminData.SubAdminId}
                region={subAdminData.Region}
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default SubAdminDashboard;