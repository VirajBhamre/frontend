import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEmployerProfile, fetchAllRolesData } from '../../services/employerService';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { Users, UserPlus, Shield, FileText, Settings, HelpCircle, ChevronsRight, Home, Briefcase, Calendar, Clock } from 'lucide-react';
import SubAdminsManagement from './roleManagement/SubAdminsManagement';
import SupervisorsManagement from './roleManagement/SupervisorsManagement';
import AgentsManagement from './roleManagement/AgentsManagement';
import UsageSummary from './roleManagement/UsageSummary';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';

// Dashboard Overview Component
const DashboardOverview = ({ employerData, onNavigate }) => {
  const cardRefs = useRef([]);
  const buttonRefs = useRef([]);

  useEffect(() => {
    // Create an array to store all tweens for cleanup
    const tweens = [];
    
    // Animate cards on component mount - only if cards exist
    if (cardRefs.current && cardRefs.current.length > 0) {
      const cardTween = gsap.fromTo(
        cardRefs.current.filter(Boolean), // Filter out any null elements
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.15,
          ease: "power2.out"
        }
      );
      tweens.push(cardTween);
    }

    // Store event handlers for cleanup
    const enterHandlers = [];
    const leaveHandlers = [];

    // Add hover animation to buttons
    buttonRefs.current.forEach((button, index) => {
      if (!button) return;
      
      const arrowElement = button.querySelector('.arrow-icon');
      if (!arrowElement) return;
      
      // Create functions we can reference for cleanup
      const enterHandler = () => {
        gsap.to(arrowElement, {
          x: 5,
          duration: 0.3,
          ease: "power2.out"
        });
      };
      
      const leaveHandler = () => {
        gsap.to(arrowElement, {
          x: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      };
      
      // Store handlers for cleanup
      enterHandlers[index] = enterHandler;
      leaveHandlers[index] = leaveHandler;
      
      // Add event listeners
      button.addEventListener('mouseenter', enterHandler);
      button.addEventListener('mouseleave', leaveHandler);
    });

    return () => {
      // Kill all tweens
      tweens.forEach(tween => tween.kill());
      
      // Remove event listeners by referencing the same function
      buttonRefs.current.forEach((button, index) => {
        if (!button) return;
        if (enterHandlers[index]) button.removeEventListener('mouseenter', enterHandlers[index]);
        if (leaveHandlers[index]) button.removeEventListener('mouseleave', leaveHandlers[index]);
      });
      
      // Clear any lingering GSAP animations
      cardRefs.current.forEach(card => {
        if (card) gsap.killTweensOf(card);
      });
      
      buttonRefs.current.forEach(button => {
        if (button) {
          const arrow = button.querySelector('.arrow-icon');
          if (arrow) gsap.killTweensOf(arrow);
        }
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
            <Briefcase size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
        </div>
        <div className="space-y-3 text-gray-600">
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Name</span>
            <span className="font-medium text-gray-800">{employerData.Name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Company</span>
            <span className="font-medium text-gray-800">{employerData.CompanyName || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Email</span>
            <span className="font-medium text-gray-800">{employerData.EmailId}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase text-gray-500 font-medium mb-1">Mobile</span>
            <span className="font-medium text-gray-800">{employerData.MobileNo}</span>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div 
        ref={el => cardRefs.current[1] = el} 
        className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mr-3">
            <Calendar size={20} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Account Status</h2>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              employerData.Status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : employerData.Status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {employerData.Status === 'approved' 
                ? 'Active' 
                : employerData.Status === 'pending' 
                  ? 'Pending' 
                  : 'Inactive'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Registration Date</span>
            <span className="text-gray-800 font-medium">{new Date(employerData.LogDate || new Date()).toLocaleDateString()}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">License Usage</span>
              <span className="text-gray-800 font-medium">
                {employerData.UsedLicenses || 0}/{employerData.Licenses || 50}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ 
                  width: `${Math.min(100, ((employerData.UsedLicenses || 0) / (employerData.Licenses || 50)) * 100)}%` 
                }}
              ></div>
            </div>
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
            onClick={() => onNavigate('/employer/dashboard/subadmins')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Manage Sub-Admins
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
          <button 
            ref={el => buttonRefs.current[1] = el}
            onClick={() => onNavigate('/employer/dashboard/supervisors')}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Manage Supervisors
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
          <button 
            ref={el => buttonRefs.current[2] = el}
            onClick={() => onNavigate('/employer/dashboard/agents')}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Manage Agents
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
          <button 
            ref={el => buttonRefs.current[3] = el}
            onClick={() => onNavigate('/employer/dashboard/usage')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              License Usage
            </span>
            <ChevronsRight className="h-5 w-5 arrow-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const EmployerDashboard = () => {
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Create refs for animations
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const contentRef = useRef(null);

  const fetchEmployerData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmployerProfile();
      console.log("Employer data loaded:", data);
      setEmployerData(data);
      
      // Set employer ID in localStorage to ensure it's accessible by all components
      if (data && data.EmpId) {
        localStorage.setItem('empId', data.EmpId.toString());
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching employer data:', error);
      toast.error('Failed to load employer data. Please refresh the page.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to refresh employer data - can be passed to child components
  const refreshEmployerData = useCallback(() => {
    console.log("Refreshing employer data...");
    return fetchEmployerData();
  }, [fetchEmployerData]);

  useEffect(() => {
    fetchEmployerData();
  }, [fetchEmployerData]);

  // Apply animations when component mounts and data is loaded
  useEffect(() => {
    let tl;
    if (!loading && employerData && headerRef.current && navRef.current && contentRef.current) {
      // Kill any existing animations to prevent conflicts
      gsap.killTweensOf([headerRef.current, navRef.current.querySelectorAll('a'), contentRef.current]);
      
      // Create a timeline for smoother animations
      tl = gsap.timeline({ 
        onComplete: () => console.log("Dashboard animations completed"),
        paused: true
      });
      
      // Animate header
      tl.fromTo(
        headerRef.current, 
        { y: -20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
      
      // Animate navigation - check if elements exist first
      const navLinks = navRef.current.querySelectorAll('a');
      if (navLinks && navLinks.length > 0) {
        tl.fromTo(
          navLinks, 
          { y: -10, opacity: 0 }, 
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.3, ease: "power1.out" },
          "-=0.2"
        );
      }
      
      // Animate content
      tl.fromTo(
        contentRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 },
        "-=0.1"
      );
      
      // Play the timeline
      tl.play();
    }
    
    // Cleanup function
    return () => {
      // Kill the timeline on unmount to prevent memory leaks
      if (tl) {
        tl.kill();
      }
      
      // Clear any lingering GSAP animations on these elements
      if (headerRef.current) gsap.killTweensOf(headerRef.current);
      if (navRef.current) gsap.killTweensOf(navRef.current.querySelectorAll('a'));
      if (contentRef.current) gsap.killTweensOf(contentRef.current);
    };
  }, [loading, employerData]);

  // Get active path based on current location
  const getActivePath = () => {
    const path = location.pathname;
    if (path.includes('/subadmins')) return 'subadmins';
    if (path.includes('/supervisors')) return 'supervisors';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/usage')) return 'usage';
    return 'overview';
  };

  const activePath = getActivePath();

  // Handle navigation to specific pages with animation
  const handleNavigate = (path) => {
    if (!contentRef.current) return;
    
    // Kill any existing animations to prevent conflicts
    gsap.killTweensOf(contentRef.current);
    
    // Animate content fade out
    gsap.to(contentRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        // Navigate after animation completes
        navigate(path);
        
        // Wait for component to render before animating back in
        setTimeout(() => {
          if (contentRef.current) {
            gsap.to(contentRef.current, {
              opacity: 1,
              duration: 0.3,
              clearProps: "opacity" // Clear properties after animation to prevent stuck values
            });
          }
        }, 100);
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
  if (!employerData) {
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
                We couldn't load your employer data. Please try refreshing the page.
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div ref={headerRef} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {employerData.CompanyName || employerData.Name}</h1>
        <p className="text-gray-600">Manage your account and team members</p>
      </div>

      {/* Navigation Menu */}
      <div ref={navRef} className="bg-white shadow-sm rounded-xl mb-6 overflow-hidden">
        <div className="flex overflow-x-auto">
          <Link 
            to="/employer/dashboard" 
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
            to="/employer/dashboard/subadmins" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'subadmins' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <Shield size={18} className="mr-2" />
            Sub-Admins
          </Link>
          <Link 
            to="/employer/dashboard/supervisors" 
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
            to="/employer/dashboard/agents" 
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
            to="/employer/dashboard/usage" 
            className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activePath === 'usage' 
                ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            } flex items-center`}
          >
            <FileText size={18} className="mr-2" />
            License Usage
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="mt-6">
        <Routes>
          <Route 
            path="/" 
            element={<DashboardOverview employerData={employerData} onNavigate={handleNavigate} />} 
          />
          <Route 
            path="/subadmins" 
            element={
              <SubAdminsManagement 
                employerId={employerData.EmpId} 
                onLicenseUpdate={refreshEmployerData} 
                totalLicenses={employerData.Licenses || 50}
                usedLicenses={employerData.UsedLicenses || 0}
              />
            } 
          />
          <Route 
            path="/supervisors" 
            element={
              <SupervisorsManagement 
                employerId={employerData.EmpId} 
                onLicenseUpdate={refreshEmployerData} 
                totalLicenses={employerData.Licenses || 50}
                usedLicenses={employerData.UsedLicenses || 0}
              />
            } 
          />
          <Route 
            path="/agents" 
            element={
              <AgentsManagement 
                employerId={employerData.EmpId} 
                onLicenseUpdate={refreshEmployerData} 
                totalLicenses={employerData.Licenses || 50}
                usedLicenses={employerData.UsedLicenses || 0}
              />
            } 
          />
          <Route 
            path="/usage" 
            element={
              <UsageSummary 
                employerId={employerData.EmpId}
                totalLicenses={employerData.Licenses || 50}
                usedLicenses={employerData.UsedLicenses || 0}
                onRefresh={refreshEmployerData}
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default EmployerDashboard;