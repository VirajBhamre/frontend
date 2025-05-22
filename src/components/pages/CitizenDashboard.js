import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { FileText, User, AlertCircle, Bell, Clipboard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import ComplaintForm from '../complaints/ComplaintForm';

const CitizenDashboard = () => {
  const [citizenData, setCitizenData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isComplaintFormOpen, setIsComplaintFormOpen] = useState(false);
  const navigate = useNavigate();

  // Create refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const cardRefs = useRef([]);

  const fetchCitizenData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser || !currentUser.UserId) {
        throw new Error('User data not found');
      }

      // Fetch citizen profile
      const response = await api.post('/citizen/profile', {
        RequestId: `get-citizen-profile-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { citizenId: currentUser.UserId }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        setCitizenData(data);
      } else {
        toast.error('Failed to load profile data');
      }
      
      // Fetch complaints
      const complaintsResponse = await api.post('/complaints/by-user', {
        RequestId: `get-citizen-complaints-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { citizenId: currentUser.UserId }
      });

      const complaintsSuccess = complaintsResponse.data.success || complaintsResponse.data.Success;
      const complaintsData = complaintsResponse.data.data || complaintsResponse.data.Data;

      if (complaintsSuccess && complaintsData) {
        setComplaints(complaintsData);
      } else {
        toast.error('Failed to load complaints data');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching citizen data:', error);
      toast.error('Failed to load profile data. Please refresh the page.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizenData();
  }, []);

  // Apply animations when component mounts and data is loaded
  useEffect(() => {
    let tl;
    if (!loading && citizenData) {
      try {
        // Wait a brief moment to ensure DOM elements are fully rendered
        const animationTimeout = setTimeout(() => {
          // Create a timeline for smoother animations
          tl = gsap.timeline();
          
          // Check if elements exist before animating them
          if (headerRef.current) {
            // Animate header
            tl.fromTo(
              headerRef.current, 
              { y: -20, opacity: 0 }, 
              { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
            );
          }
          
          // Make sure cardRefs.current is an array and contains valid elements
          const validCards = Array.isArray(cardRefs.current) ? 
            cardRefs.current.filter(card => card !== null && card !== undefined) : 
            [];
          
          if (validCards.length > 0) {
            // Animate content cards
            tl.fromTo(
              validCards, 
              { y: 30, opacity: 0 }, 
              { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out" },
              "-=0.2"
            );
          }
          
          // Animate other content if it exists
          if (contentRef.current) {
            tl.fromTo(
              contentRef.current, 
              { opacity: 0 }, 
              { opacity: 1, duration: 0.5 },
              "-=0.3"
            );
          }
        }, 100); // Small delay to ensure DOM is ready
        
        // Clean up timeout if component unmounts
        return () => {
          clearTimeout(animationTimeout);
          if (tl) tl.kill();
        };
      } catch (error) {
        console.error("GSAP animation error:", error);
        // Continue with the app even if animations fail
      }
    }
    
    // Cleanup function
    return () => {
      if (tl) tl.kill();
    };
  }, [loading, citizenData]);
  
  // Add a separate effect for cleanup when component unmounts
  useEffect(() => {
    return () => {
      try {
        // Kill any animations on the refs
        if (headerRef.current) gsap.killTweensOf(headerRef.current);
        if (contentRef.current) gsap.killTweensOf(contentRef.current);
        
        // Kill animations on card refs
        if (cardRefs.current) {
          if (Array.isArray(cardRefs.current)) {
            cardRefs.current.forEach(card => {
              if (card) gsap.killTweensOf(card);
            });
          }
        }
        
        // Force garbage collection on any potentially leaked animations
        gsap.globalTimeline.clear();
      } catch (err) {
        console.error("Error cleaning up GSAP animations:", err);
      }
    };
  }, []);

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} />;
      case 'assigned':
        return <Bell size={14} />;
      case 'in_progress':
        return <Clipboard size={14} />;
      case 'resolved':
        return <CheckCircle size={14} />;
      case 'closed':
        return <CheckCircle size={14} />;
      case 'rejected':
        return <XCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  if (!citizenData) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="bg-white border-l-4 border-yellow-400 p-5 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isComplaintFormOpen && (
        <ComplaintForm
          citizenData={citizenData}
          onClose={() => setIsComplaintFormOpen(false)}
          onSubmitSuccess={() => {
            setIsComplaintFormOpen(false);
            fetchCitizenData(); // Refresh complaints data
          }}
        />
      )}

      <div ref={headerRef} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {citizenData.Name}</h1>
        <p className="text-gray-600">Citizen Dashboard</p>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <button
          onClick={() => setIsComplaintFormOpen(true)}
          className="px-6 py-3 bg-[#ff4473] text-white rounded-lg shadow-sm hover:bg-[#679bfb] transition-colors flex items-center gap-2"
        >
          <FileText size={18} />
          File a New Complaint
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'overview'
                ? 'text-[#ff4473] border-b-2 border-[#ff4473]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'complaints'
                ? 'text-[#ff4473] border-b-2 border-[#ff4473]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('complaints')}
          >
            My Complaints
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'profile'
                ? 'text-[#ff4473] border-b-2 border-[#ff4473]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('profile')}
          >
            Profile
          </button>
        </div>
      </div>

      <div ref={contentRef}>
        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Card */}
            <div
              ref={(el) => (cardRefs.current[0] = el)}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                  <FileText size={20} />
                </div>
                <h3 className="ml-3 text-lg font-medium">Complaints Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Complaints</span>
                  <span className="font-semibold text-gray-800">{complaints.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-gray-800">
                    {complaints.filter(c => c.Status === 'pending' || c.Status === 'assigned' || c.Status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resolved</span>
                  <span className="font-semibold text-gray-800">
                    {complaints.filter(c => c.Status === 'resolved' || c.Status === 'closed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rejected</span>
                  <span className="font-semibold text-gray-800">
                    {complaints.filter(c => c.Status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Complaints */}
            <div
              ref={(el) => (cardRefs.current[1] = el)}
              className="bg-white p-6 rounded-xl shadow-sm md:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Complaints</h3>
                <button
                  onClick={() => setSelectedTab('complaints')}
                  className="text-blue-600 text-sm hover:underline"
                >
                  View All
                </button>
              </div>
              
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>You haven't filed any complaints yet</p>
                  <button
                    onClick={() => setIsComplaintFormOpen(true)}
                    className="mt-3 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    File Your First Complaint
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.slice(0, 3).map((complaint) => (
                    <div key={complaint.ComplaintId} className="flex items-start p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getStatusBadgeClasses(complaint.Status)} mr-3`}>
                        {getStatusIcon(complaint.Status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-800">
                            {complaint.Department} - {complaint.ComplaintCategory}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(complaint.Status)}`}>
                            {complaint.Status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{complaint.Description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          Filed on: {formatDate(complaint.CreatedOn)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {selectedTab === 'complaints' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">My Complaints</h2>
              <button
                onClick={() => setIsComplaintFormOpen(true)}
                className="px-4 py-2 bg-[#ff4473] text-white text-sm rounded-lg shadow-sm hover:bg-[#679bfb] transition-colors flex items-center gap-2"
              >
                <FileText size={16} />
                New Complaint
              </button>
            </div>

            {complaints.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Complaints Found</h3>
                <p className="text-gray-600 mb-4">You haven't filed any complaints yet</p>
                <button
                  onClick={() => setIsComplaintFormOpen(true)}
                  className="px-6 py-3 bg-[#ff4473] text-white rounded-lg shadow-sm hover:bg-[#679bfb] transition-colors"
                >
                  File Your First Complaint
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="px-4 py-4 text-left font-medium">ID</th>
                        <th className="px-4 py-4 text-left font-medium">Category</th>
                        <th className="px-4 py-4 text-left font-medium">Department</th>
                        <th className="px-4 py-4 text-left font-medium">Date Filed</th>
                        <th className="px-4 py-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.map((complaint) => (
                        <tr key={complaint.ComplaintId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-gray-800">#{complaint.ComplaintId}</td>
                          <td className="px-4 py-4 text-gray-800">{complaint.ComplaintCategory}</td>
                          <td className="px-4 py-4 text-gray-800">{complaint.Department}</td>
                          <td className="px-4 py-4 text-gray-600">{formatDate(complaint.CreatedOn)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(complaint.Status)}`}>
                              {getStatusIcon(complaint.Status)}
                              <span className="capitalize">{complaint.Status.replace('_', ' ')}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {selectedTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-full">
                <User size={24} />
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-800">Profile Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                  <div className="text-gray-800 font-medium">{citizenData.Name}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nickname</label>
                  <div className="text-gray-800 font-medium">{citizenData.Nickname || 'Not provided'}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Mobile Number</label>
                  <div className="text-gray-800 font-medium">{citizenData.MobileNo}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <div className="text-gray-800 font-medium">{citizenData.EmailId || 'Not provided'}</div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                  <div className="text-gray-800 font-medium">{citizenData.Gender || 'Not provided'}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Serviceman Status</label>
                  <div className="text-gray-800 font-medium">{citizenData.IsServiceman ? 'Yes' : 'No'}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Account Status</label>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${citizenData.Status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {citizenData.Status}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Registered On</label>
                  <div className="text-gray-800 font-medium">{formatDate(citizenData.CreatedOn)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">District</label>
                    <div className="text-gray-800 font-medium">{citizenData.District || 'Not provided'}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Block</label>
                    <div className="text-gray-800 font-medium">{citizenData.Block || 'Not provided'}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Village</label>
                    <div className="text-gray-800 font-medium">{citizenData.Village || 'Not provided'}</div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">WhatsApp Notifications</label>
                    <div className="text-gray-800 font-medium">{citizenData.WhatsAppNotification ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard; 