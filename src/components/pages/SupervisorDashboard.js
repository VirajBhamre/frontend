import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Users, UserPlus, List, Settings, ChevronsRight, Home, Briefcase, Calendar, ClipboardCheck, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';

// Dashboard Overview Component for Supervisor
const SupervisorDashboard = () => {
  const [supervisorData, setSupervisorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ agents: 0 });
  const [employerData, setEmployerData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Create refs for animations
  const headerRef = useRef(null);
  const companyRef = useRef(null);
  const contentRef = useRef(null);
  const cardRefs = useRef([]);

  const fetchSupervisorData = useCallback(async () => {
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

      // Fetch supervisor profile
      const response = await api.post('/employers/supervisors/profile', {
        RequestId: `get-supervisor-profile-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { supervisorId: currentUser.UserId }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        setSupervisorData(data);
        
        // Get employer data if we don't have it already
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
        
        // Get agents count
        try {
          const agentsResponse = await api.post('/employers/agents', {
            RequestId: `get-agents-${Date.now()}`,
            AuthToken: localStorage.getItem('token') || '',
            Payload: { 
              supervisorId: data.SupervisorId,
              empId: data.EmpId
            }
          });
          
          if (agentsResponse.data.success || agentsResponse.data.Success) {
            const agentsData = agentsResponse.data.data || agentsResponse.data.Data || [];
            const agentsCount = Array.isArray(agentsData) ? agentsData.length : (agentsData ? 1 : 0);
            setStats({ agents: agentsCount });
          }
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
        }
      } else {
        toast.error('Failed to load profile data');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching supervisor data:', error);
      toast.error('Failed to load profile data. Please refresh the page.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupervisorData();
  }, [fetchSupervisorData]);

  // Apply animations when component mounts and data is loaded
  useEffect(() => {
    if (!loading && supervisorData) {
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
      
      // Animate content cards
      tl.fromTo(
        cardRefs.current, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out" },
        "-=0.2"
      );
      
      // Animate other content
      tl.fromTo(
        contentRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 },
        "-=0.3"
      );
    }
  }, [loading, supervisorData]);

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
  if (!supervisorData) {
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

  const companyName = employerData?.CompanyName || supervisorData.EmployerName || "Your Company";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div ref={headerRef} className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {supervisorData.Name}</h1>
        <p className="text-gray-600">
          {supervisorData.Level === 'L1' ? 'Level 1 Supervisor Dashboard' : 'Level 2 Supervisor Dashboard'}
        </p>
      </div>

      {/* Company Banner */}
      <div 
        ref={companyRef}
        className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 rounded-xl shadow-sm mb-6"
      >
        <div className="flex items-center">
          <Building className="mr-3 h-6 w-6" />
          <div>
            <p className="text-sm text-indigo-100">COMPANY</p>
            <h2 className="text-xl font-bold">{companyName}</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-indigo-100">AGENTS</p>
            <p className="text-lg font-medium">{stats.agents} assigned</p>
          </div>
        </div>
      </div>

      <div ref={contentRef} className="mt-6">
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
                <span className="font-medium text-gray-800">{companyName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Sub-Admin</span>
                <span className="font-medium text-gray-800">{supervisorData.SubAdminName || 'N/A'}</span>
              </div>
              {employerData && (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Total Licenses</span>
                    <span className="font-medium text-gray-800">{employerData.Licenses || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Used Licenses</span>
                    <span className="font-medium text-gray-800">{employerData.UsedLicenses || 'N/A'}</span>
                  </div>
                </>
              )}
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
                <span className="font-medium text-gray-800">{supervisorData.Name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Email</span>
                <span className="font-medium text-gray-800">{supervisorData.EmailId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Mobile</span>
                <span className="font-medium text-gray-800">{supervisorData.MobileNo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Level</span>
                <span className="font-medium text-gray-800">{supervisorData.Level || 'L1'}</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div 
            ref={el => cardRefs.current[2] = el} 
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 mr-3">
                <ClipboardCheck size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Agents Assigned</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {stats.agents}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {supervisorData.Status || 'Active'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created Date</span>
                <span className="text-gray-800 font-medium">{new Date(supervisorData.CreatedOn || new Date()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Coming Soon</h2>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Additional supervisor functionality is currently in development and will be available soon:
            </p>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-blue-500">•</span>
                <span>Agent tracking and performance metrics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-blue-500">•</span>
                <span>Task assignment and management</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-blue-500">•</span>
                <span>Reports and analytics dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;