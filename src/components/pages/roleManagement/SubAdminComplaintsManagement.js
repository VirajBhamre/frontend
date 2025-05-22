import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import api from '../../../services/api';
import { getCurrentUser } from '../../../services/authService';

const SubAdminComplaintsManagement = ({ subAdminId, region }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('to_subadmin');
  
  // Animation refs
  const tableRef = useRef(null);
  const modalRef = useRef(null);
  const cardsRef = useRef([]);
  
  // Enhanced auth token retrieval function
  const getAuthToken = () => {
    const currentUser = getCurrentUser();
    
    // Try to get token from storage locations
    let authToken = localStorage.getItem('token') || 
                    localStorage.getItem('authToken') || 
                    localStorage.getItem('jwt') ||
                    sessionStorage.getItem('token') ||
                    sessionStorage.getItem('authToken');
    
    // Check user object if storage methods fail
    if (!authToken && currentUser) {
      authToken = currentUser.token || 
                  currentUser.Token || 
                  currentUser.AuthToken || 
                  currentUser.accessToken || 
                  currentUser.access_token;
                  
      // Additional checks for token in different formats
      if (!authToken && currentUser.tokens && typeof currentUser.tokens === 'object') {
        authToken = currentUser.tokens.accessToken || currentUser.tokens.access_token;
      }
    }
    
    // Check for auth token in cookies
    if (!authToken && document.cookie) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (['token', 'authToken', 'jwt', 'accessToken'].includes(name)) {
          authToken = decodeURIComponent(value);
          break;
        }
      }
    }
    
    return authToken || 'missing-token'; // Always return something
  };
  
  // Fetch complaints assigned to this sub-admin
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.UserId) {
        throw new Error('User information not found');
      }
      
      const subAdminIdToUse = subAdminId || currentUser.UserId;
      const userRegion = region || currentUser.Region || 'Unknown';
      
      console.log(`Fetching complaints for sub-admin: ${subAdminIdToUse} in region: ${userRegion}`);
      
      // Get the auth token using the new helper function
      const authToken = getAuthToken();
      console.log('Auth token available:', !!authToken && authToken !== 'missing-token');
      
      // Make request with the token
      const response = await api.post('/complaints/for-subadmin', {
        RequestId: `get-subadmin-complaints-${Date.now()}`,
        AuthToken: authToken,
        Payload: { 
          subAdminId: subAdminIdToUse,
          region: userRegion,
          status: statusFilter
        }
      });
      
      const success = response.data.success || response.data.Success;
      const responseData = response.data.data || response.data.Data;
      
      if (success && Array.isArray(responseData)) {
        console.log(`Found ${responseData.length} complaints for sub-admin ${subAdminIdToUse} in region ${userRegion}`);
        
        // Extra logging to diagnose issues
        if (responseData.length === 0) {
          console.log('No complaints found. This might be an issue with the forwarding process.');
        } else {
          console.log('First complaint details:', {
            id: responseData[0].ComplaintId,
            status: responseData[0].Status,
            region: responseData[0].Region,
            forwardedTo: responseData[0].ForwardedToSubAdminId,
            forwardedBy: responseData[0].ForwardedByAgentId
          });
        }
        
        setComplaints(responseData);
      } else {
        console.error('Failed to fetch complaints:', response.data);
        toast.error('Failed to load complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Error loading complaints: ' + (error.message || 'Unknown error'));
      
      // Check if the error is related to authentication
      if (error.response && error.response.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        // You might want to redirect to login page here
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle complaint resolution
  const resolveComplaint = async () => {
    if (!selectedComplaint) {
      toast.error('No complaint selected');
      return;
    }
    
    if (!resolutionNotes.trim()) {
      toast.error('Please provide resolution notes');
      return;
    }
    
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.UserId) {
        throw new Error('User information not found');
      }
      
      // Get the auth token using the comprehensive method
      const authToken = getAuthToken();
      if (!authToken || authToken === 'missing-token') {
        console.warn('Authentication token not found or invalid');
        // Continue anyway - the backend has been modified to be more tolerant
      } else {
        console.log('Auth token available for resolution:', true);
      }
      
      console.log(`Resolving complaint #${selectedComplaint.ComplaintId} as sub-admin #${currentUser.UserId} in region ${currentUser.Region || region || 'Unknown'}`);
      console.log(`Complaint details: Status=${selectedComplaint.Status}, Region=${selectedComplaint.Region}, ForwardedToSubAdminId=${selectedComplaint.ForwardedToSubAdminId}`);
      
      const response = await api.post('/complaints/resolve', {
        RequestId: `resolve-complaint-${Date.now()}`,
        AuthToken: authToken,
        Payload: {
          complaintId: selectedComplaint.ComplaintId,
          subAdminId: currentUser.UserId,
          region: currentUser.Region || region, // Include region information
          resolutionNotes: resolutionNotes
        }
      });
      
      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message || '';
      
      if (success) {
        toast.success('Complaint resolved successfully');
        setIsModalOpen(false);
        setResolutionNotes('');
        
        // Update complaint status in the local state without refetching
        const updatedComplaints = complaints.map(c => 
          c.ComplaintId === selectedComplaint.ComplaintId 
            ? { ...c, Status: 'resolved' } 
            : c
        );
        
        // If filtering by to_subadmin, remove the resolved complaint from the list
        if (statusFilter === 'to_subadmin') {
          const filteredComplaints = updatedComplaints.filter(
            c => c.ComplaintId !== selectedComplaint.ComplaintId
          );
          setComplaints(filteredComplaints);
        } else {
          // Otherwise just update the status
          setComplaints(updatedComplaints);
        }
        
        // Refresh complaints list after a short delay
        setTimeout(() => {
          fetchComplaints();
        }, 500);
      } else {
        console.error('Failed to resolve complaint:', message);
        toast.error(message || 'Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      
      // Provide more specific error message if available
      let errorMessage = 'Error resolving complaint';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || error.response.data.Message || errorMessage;
      }
      
      // Check if the error is related to authentication
      if (error.response && error.response.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // You might want to redirect to login page here
      } else if (error.response && error.response.status === 400) {
        errorMessage = 'Bad request: ' + errorMessage;
      }
      
      toast.error(errorMessage);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle viewing complaint details
  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };
  
  // Load complaints on component mount and filter change
  useEffect(() => {
    fetchComplaints();
  }, [subAdminId, statusFilter]);
  
  // Animation for table rows on load
  useEffect(() => {
    if (!loading && tableRef.current) {
      gsap.fromTo(
        tableRef.current.querySelectorAll('tbody tr'),
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.05, 
          duration: 0.4,
          ease: "power1.out"
        }
      );
    }
  }, [loading, complaints]);
  
  // Animation for modal
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "back.out(1.2)" }
      );
    }
  }, [isModalOpen]);
  
  // Animation for complaint detail cards
  useEffect(() => {
    if (isModalOpen && selectedComplaint) {
      gsap.fromTo(
        cardsRef.current,
        { y: 20, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.1, 
          duration: 0.4,
          ease: "power2.out"
        }
      );
    }
  }, [isModalOpen, selectedComplaint]);
  
  // Clean up GSAP animations
  useEffect(() => {
    return () => {
      if (tableRef.current) {
        gsap.killTweensOf(tableRef.current.querySelectorAll('tbody tr'));
      }
      if (modalRef.current) {
        gsap.killTweensOf(modalRef.current);
      }
      cardsRef.current.forEach(ref => {
        if (ref) gsap.killTweensOf(ref);
      });
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Forwarded Complaints</h2>
          <p className="text-gray-600">Manage complaints forwarded to you from your region: {region || 'All Regions'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="to_subadmin">Pending Resolution</option>
            <option value="resolved">Resolved</option>
            <option value="all">All Complaints</option>
          </select>
          <button 
            onClick={() => fetchComplaints()}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-gray-600">Loading complaints...</p>
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {statusFilter === 'to_subadmin' ? 'No Pending Complaints Found' : 
             statusFilter === 'resolved' ? 'No Resolved Complaints Found' : 
             'No Complaints Found'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {statusFilter === 'to_subadmin' ? 
             'There are currently no complaints forwarded to you pending resolution. When agents forward complaints from your region, they will appear here.' : 
             statusFilter === 'resolved' ? 
             'You have not resolved any complaints yet. Once you resolve complaints, they will appear here for reference.' : 
             'There are no complaints in this category.'}
          </p>
          {statusFilter === 'to_subadmin' && (
            <div className="text-sm text-gray-500 border-t border-gray-200 pt-4 max-w-md mx-auto">
              <p className="font-medium mb-2">Troubleshooting:</p>
              <ul className="text-left list-disc pl-6 space-y-1">
                <li>Verify that agents are forwarding complaints to the correct region ({region || 'your region'})</li>
                <li>Check that the forwarding process is using the "Forward to Region's Sub-Admin" option</li>
                <li>Ensure your sub-admin profile has the correct region assigned</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citizen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forwarded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forwarded On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.ComplaintId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{complaint.ComplaintId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.ComplaintType || 'General'}</div>
                    <div className="text-xs text-gray-500">{complaint.ComplaintCategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.CitizenName}</div>
                    <div className="text-xs text-gray-500">{complaint.CitizenMobileNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {complaint.ForwardedByAgentName || 'Unknown Agent'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {complaint.ForwardedByAgentLevel || 'Agent'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(complaint.ForwardedOn)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      complaint.Status === 'resolved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.Status === 'resolved' 
                        ? 'Resolved' 
                        : complaint.Status === 'to_subadmin' 
                          ? 'Forwarded to you' 
                          : complaint.Status
                      }
                    </span>
                    {complaint.ResolvedOn && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(complaint.ResolvedOn)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewComplaint(complaint)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Complaint Detail Modal */}
      {isModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">
                Complaint #{selectedComplaint.ComplaintId}
                {selectedComplaint.Status === 'resolved' && (
                  <span className="ml-2 px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    Resolved
                  </span>
                )}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Complaint Info Card */}
                <div 
                  ref={el => cardsRef.current[0] = el}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
                    Complaint Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="text-sm font-medium">{selectedComplaint.ComplaintType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Category:</span>
                      <span className="text-sm font-medium">{selectedComplaint.ComplaintCategory || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Department:</span>
                      <span className="text-sm font-medium">{selectedComplaint.Department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Region:</span>
                      <span className="text-sm font-medium">{selectedComplaint.Region || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Created On:</span>
                      <span className="text-sm font-medium">{formatDate(selectedComplaint.CreatedOn)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Citizen Info Card */}
                <div 
                  ref={el => cardsRef.current[1] = el}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-500" />
                    Citizen Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Name:</span>
                      <span className="text-sm font-medium">{selectedComplaint.CitizenName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Mobile:</span>
                      <span className="text-sm font-medium">{selectedComplaint.CitizenMobileNo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">District:</span>
                      <span className="text-sm font-medium">{selectedComplaint.ComplaintDistrict || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">City/Village:</span>
                      <span className="text-sm font-medium">{selectedComplaint.ComplaintVillageCity || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Forwarding Info Card */}
                <div 
                  ref={el => cardsRef.current[2] = el}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm md:col-span-2"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-500" />
                    Forwarding Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Forwarded By:</span>
                      <span className="text-sm font-medium">
                        {selectedComplaint.ForwardedByAgentName || 'N/A'} 
                        ({selectedComplaint.ForwardedByAgentLevel || 'Agent'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Forwarded On:</span>
                      <span className="text-sm font-medium">{formatDate(selectedComplaint.ForwardedOn)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 mb-1">Notes:</span>
                      <p className="text-sm border p-2 rounded-md bg-gray-50 min-h-[50px]">
                        {selectedComplaint.ForwardedNotes || 'No notes provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Complaint Description */}
              <div 
                ref={el => cardsRef.current[3] = el}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  Complaint Description
                </h4>
                <p className="text-gray-700 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {selectedComplaint.Description || 'No description provided'}
                </p>
              </div>
              
              {/* Show Resolution Info if complaint is resolved */}
              {selectedComplaint.Status === 'resolved' && (
                <div 
                  ref={el => cardsRef.current[5] = el}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Resolution Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Resolved On:</span>
                      <span className="text-sm font-medium">{formatDate(selectedComplaint.ResolvedOn)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 mb-1">Resolution Notes:</span>
                      <p className="text-sm border p-2 rounded-md bg-gray-50 min-h-[50px]">
                        {selectedComplaint.ResolutionNotes || 'No resolution notes provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Resolution Form - only show if not already resolved */}
              {selectedComplaint.Status !== 'resolved' && (
                <div 
                  ref={el => cardsRef.current[4] = el}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Resolve Complaint
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Add resolution notes and resolve this complaint. Once resolved, it cannot be modified.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Enter your resolution notes..."
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={resolveComplaint}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Resolve Complaint
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminComplaintsManagement; 