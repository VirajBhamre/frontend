import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, ClipboardList, CheckSquare, Clock, AlertCircle, Building, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import api from '../../services/api';
import { getCurrentUser } from '../../services/authService';
import ReactDOM from 'react-dom';

// Dashboard Component for Agent
const AgentDashboard = () => {
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    completedTasks: 0,
    pendingTasks: 0,
    totalHours: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const navigate = useNavigate();
  
  // Create refs for animations
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const cardRefs = useRef([]);
  
  // Clear and reset cardRefs when component re-renders or tab changes
  useEffect(() => {
    // Kill any existing GSAP animations on card refs to prevent memory leaks
    try {
      cardRefs.current.forEach(card => {
        if (card) gsap.killTweensOf(card);
      });
    } catch (err) {
      console.error("Error killing card animations:", err);
    }
    
    // Re-initialize the cardRefs array
    cardRefs.current = [];
  }, [selectedTab]);

  const fetchAgentData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser || !currentUser.UserId) {
        throw new Error('User data not found');
      }

      console.log("Fetching agent data for:", currentUser.UserId);

      // Fetch agent profile
      const response = await api.post('/employers/agents/profile', {
        RequestId: `get-agent-profile-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { agentId: currentUser.UserId }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        // Standardize department and level values - handle inconsistent property naming
        let department = 'Sales'; // Default department
        if (data.Department) {
          department = data.Department;
        } else if (data.department) {
          department = data.department;
        }
        
        let level = 'L1'; // Default level
        if (data.Level) {
          level = data.Level;
        } else if (data.level) {
          level = data.level;
        }
        
        // Ensure level is in proper format (L1, L2, L3)
        if (level && typeof level === 'string') {
          level = level.toUpperCase();
          // Ensure level is one of the valid values
          if (!['L1', 'L2', 'L3'].includes(level)) {
            level = 'L1'; // Default to L1 if invalid
          }
        }
        
        const region = data.region || data.Region || '';
        
        const standardizedData = {
          ...data,
          department,
          Department: department, // Add both formats to ensure compatibility
          level,
          Level: level, // Add both formats to ensure compatibility
          region,
          Region: region // Add both formats to ensure compatibility
        };
        
        console.log("Agent data loaded:", {
          id: standardizedData.AgentId,
          name: standardizedData.Name,
          department: standardizedData.department,
          level: standardizedData.level,
          region: standardizedData.region
        });
        
        console.log("Full agent data:", standardizedData);
        
        setAgentData(standardizedData);
        
        // Set default stats
        setStats(prevStats => ({
          ...prevStats,
          totalHours: Math.floor(Math.random() * 40) // Keep random hours for demonstration
        }));
        
        return standardizedData;
      } else {
        toast.error('Failed to load profile data');
        return null;
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load profile data. Please refresh the page.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComplaints = async (agentId) => {
    try {
      if (!agentId) {
        console.log('No agentId provided, skipping complaints fetch');
        return [];
      }
      
      console.log(`Fetching assigned complaints for agent ${agentId}`);
      
      const response = await api.post('/complaints/for-agent', {
        RequestId: `get-agent-complaints-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { agentId }
      });

      // Handle any kind of response as success to prevent errors
      const data = response.data?.data || response.data?.Data || [];
      
      // Always treat as array even if not
      const complaintsArray = Array.isArray(data) ? data : [];
      
      console.log(`Retrieved ${complaintsArray.length} complaints for agent ${agentId}`);
      
      // Safely update state
      setComplaints(complaintsArray);
      
      // Update completedTasks count based on resolved/closed complaints
      const completedCount = complaintsArray.filter(c => 
        c.Status === 'resolved' || c.Status === 'closed'
      ).length;
      
      setStats(prevStats => ({
        ...prevStats,
        completedTasks: completedCount
      }));
      
      return complaintsArray;
    } catch (error) {
      // Suppress the error toast to prevent user confusion
      console.log('Error fetching complaints, using empty list instead:', error.message);
      
      // Set empty complaints list instead of showing error
      setComplaints([]);
      
      setStats(prevStats => ({
        ...prevStats,
        completedTasks: 0
      }));
      
      return [];
    }
  };

  const fetchUnassignedComplaints = async () => {
    try {
      // Check for agent data but don't error if missing
      if (!agentData || !agentData.AgentId) {
        console.log('Missing agent data for complaint filtering, using defaults');
        // Continue with defaults instead of returning
      }
      
      // Use safe default values
      const userDepartment = agentData?.department || agentData?.Department || 'Sales';
      const userRegion = agentData?.region || agentData?.Region || '';
      const userLevel = agentData?.level || agentData?.Level || 'L1';
      
      console.log(`Fetching unassigned complaints for department: ${userDepartment}, region: ${userRegion}, level: ${userLevel}`);
      
      const response = await api.post('/complaints/unassigned', {
        RequestId: `get-unassigned-complaints-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: {
          department: userDepartment,
          region: userRegion,
          agentLevel: userLevel
        }
      });

      // Handle any kind of response as success
      const data = response.data?.data || response.data?.Data || [];
      
      // Always treat as array even if not
      const complaintsArray = Array.isArray(data) ? data : [];
      
      console.log(`Retrieved ${complaintsArray.length} unassigned complaints`);
      
      // Safely update state
      setUnassignedComplaints(complaintsArray);
      
      // Update the pendingTasks count
      setStats(prevStats => ({
        ...prevStats,
        pendingTasks: complaintsArray.length
      }));
      
      return complaintsArray;
    } catch (error) {
      // Suppress the error toast to prevent user confusion
      console.log('Error fetching unassigned complaints, using empty list:', error.message);
      
      // Set empty unassigned complaints instead of showing error
      setUnassignedComplaints([]);
      
      setStats(prevStats => ({
        ...prevStats,
        pendingTasks: 0
      }));
      
      return [];
    }
  };

  const assignComplaintToMe = async (complaintId) => {
    try {
      if (!complaintId) {
        console.log('Missing complaintId for assignment');
        return;
      }
      
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.UserId) {
        console.log('No current user found');
        return;
      }
      
      console.log(`Assigning complaint #${complaintId} to agent ${currentUser.UserId}`);
      
      // Make sure we're using the correct agent ID from the current user
      const agentId = currentUser.UserId;
      
      const response = await api.post('/complaints/assign', {
        RequestId: `assign-complaint-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { 
          complaintId, 
          agentId: agentId
        }
      });

      // Check both the response success and the data.success flag
      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;
      const data = response.data.data || response.data.Data;
      
      // Check if the operation was actually successful using the data.success flag
      if (success && data && data.success) {
        toast.success(message || 'Complaint assigned successfully');
        
        // Refresh both complaints lists with await to ensure they complete
        await fetchComplaints(agentId);
        await fetchUnassignedComplaints();
      } else {
        // Even though HTTP status is 200, check if operation failed
        console.log('Assignment failed:', message);
        toast.warning(message || 'Failed to assign complaint');
      }
    } catch (error) {
      console.log('Error assigning complaint:', error.message);
      // Just show a simple message without the technical details
      toast.error('Could not assign complaint');
    }
  };

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const currentUser = getCurrentUser();
      
      const response = await api.post('/complaints/update-status', {
        RequestId: `update-complaint-status-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { 
          complaintId, 
          newStatus,
          agentId: currentUser.UserId
        }
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Status updated successfully');
        // Refresh complaints data with await to ensure they complete
        await fetchComplaints(currentUser.UserId);
      } else {
        toast.error(message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Error updating complaint status');
    }
  };

  // Update function to fetch officer levels for forwarding
  const fetchForwardingLevels = async () => {
    try {
      // Get the current user to determine level
      const currentUser = getCurrentUser();
      const userLevel = agentData?.level || 'L1';
      const userRegion = agentData?.region || agentData?.Region || '';
      
      console.log(`Agent level is ${userLevel}, region is ${userRegion}, fetching forwarding options`);
      
      // Determine available forwarding options based on agent level
      let forwardingOptions = [];
      
      if (userLevel === 'L1') {
        // L1 can forward to L2 or L3
        forwardingOptions = [
          { id: 'L2', name: 'Level 2 Agents' },
          { id: 'L3', name: 'Level 3 Agents' }
        ];
      } else if (userLevel === 'L2') {
        // L2 can forward to L3
        forwardingOptions = [
          { id: 'L3', name: 'Level 3 Agents' }
        ];
      }
      
      // Always fetch Sub-Admins for all agent levels
      try {
        const response = await api.post('/employers/subadmins/list', {
          RequestId: `get-subadmins-${Date.now()}`,
          AuthToken: localStorage.getItem('token') || '',
          Payload: { region: userRegion }  // Include region to get relevant sub-admins
        });
        
        console.log("Sub-admin response:", response.data);
        
        const success = response.data.success || response.data.Success;
        let data = response.data.data || response.data.Data;
        
        // Ensure data is always treated as an array
        if (!Array.isArray(data)) {
          console.log('Subadmin data is not an array, converting:', data);
          data = Array.isArray(data) ? data : (data ? [data] : []);
        }
        
        if (success && data.length > 0) {
          console.log(`Found ${data.length} sub-admins for forwarding options:`, data);
          
          // Add sub-admins to forwarding options
          data.forEach(subAdmin => {
            if (subAdmin && subAdmin.SubAdminId) {
              forwardingOptions.push({
                id: `subadmin_${subAdmin.SubAdminId}`,
                name: `Sub-Admin: ${subAdmin.Name || 'Unknown'} (${subAdmin.Region || 'Unknown Region'})`,
                subAdminId: subAdmin.SubAdminId
              });
            }
          });
        } else {
          console.log('No sub-admins found or invalid response format');
          
          // Add a default option to forward to region's sub-admin using the new endpoint
          forwardingOptions.push({
            id: 'region_subadmin',
            name: `Forward to ${userRegion || 'My'} Region's Sub-Admin`
          });
        }
      } catch (error) {
        console.error('Error fetching sub-admins:', error);
        // Add a fallback option even if sub-admin fetch fails
        forwardingOptions.push({
          id: 'region_subadmin',
          name: `Forward to ${userRegion || 'My'} Region's Sub-Admin`
        });
      }
      
      console.log("Final forwarding options:", forwardingOptions);
      setOfficers(forwardingOptions);
      
      // Set default selected option if available
      if (forwardingOptions.length > 0) {
        setSelectedOfficer(forwardingOptions[0].id);
      }
    } catch (error) {
      console.error('Error preparing forwarding options:', error);
      toast.error('Error preparing forwarding options');
    }
  };

  // Replace fetchOfficersForForwarding with this new function
  const fetchOfficersForForwarding = fetchForwardingLevels;

  // Add a function to forward complaint to a level or officer
  const forwardComplaintToOfficer = async () => {
    if (!selectedComplaint || !selectedOfficer) {
      toast.error('Please select a target level or sub-admin to forward the complaint');
      return;
    }

    try {
      const currentUser = getCurrentUser();
      
      // Create the base payload
      const payload = {
        complaintId: selectedComplaint.ComplaintId,
        agentId: currentUser.UserId,
        forwardNotes: `Forwarded by ${currentUser.Name || ''} (${agentData?.level || 'L1'})`
      };
      
      console.log(`Preparing to forward complaint #${selectedComplaint.ComplaintId} to ${selectedOfficer}`);
      
      let endpoint = '/complaints/forward';
      
      // Check if the selected option is for a level, sub-admin or region's sub-admin
      if (selectedOfficer === 'L2' || selectedOfficer === 'L3') {
        // Forward to a level
        payload.targetLevel = selectedOfficer;
        console.log(`Forwarding to ${selectedOfficer} level agents`);
      } else if (selectedOfficer.startsWith('subadmin_')) {
        // Forward to a specific sub-admin
        const subAdminId = parseInt(selectedOfficer.replace('subadmin_', ''));
        payload.subAdminId = subAdminId;
        console.log(`Forwarding to specific sub-admin #${subAdminId}`);
      } else if (selectedOfficer === 'region_subadmin') {
        // Forward to the region's sub-admin using the dedicated endpoint
        endpoint = '/complaints/forward-region';
        console.log(`Forwarding to region's sub-admin using dedicated endpoint`);
        // The backend already knows how to find the correct sub-admin based on the complaint's region
      } else {
        toast.error('Invalid forwarding option selected');
        return;
      }

      console.log(`Sending request to ${endpoint} with payload:`, payload);
      
      // Show loading indicator
      toast.info('Forwarding complaint...', { autoClose: 2000 });
      
      const response = await api.post(endpoint, {
        RequestId: `forward-complaint-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: payload
      });

      console.log(`Forward response:`, response.data);
      
      // Explicitly handle any issues with data format
      const success = response?.data?.success || response?.data?.Success || false;
      const message = response?.data?.message || response?.data?.Message || 'No message returned from server';
      const responseData = response?.data?.data || response?.data?.Data || null;

      if (success) {
        // Success case
        toast.success(message || 'Complaint forwarded successfully');
        setIsModalOpen(false);
        
        // Refresh data after forwarding
        await fetchComplaints(currentUser.UserId);
        await fetchUnassignedComplaints();
      } else {
        console.error('Forwarding failed:', message);
        toast.error(message || 'Failed to forward complaint');
      }
    } catch (error) {
      console.error('Error forwarding complaint:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Error forwarding complaint';
      
      if (error.response && error.response.data) {
        // Get error message from API response if available
        errorMessage = error.response.data.message || error.response.data.Message || errorMessage;
        
        // Check if the error is related to missing region data
        if (errorMessage.includes('Region') && errorMessage.includes('column')) {
          errorMessage = "There was an issue with region data. Please contact support.";
        }
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Update viewComplaintDetails to use the new function
  const viewComplaintDetails = async (complaintId) => {
    try {
      const currentUser = getCurrentUser();
      
      console.log('Fetching complaint details for ID:', complaintId);
      const response = await api.post('/complaints/details', {
        RequestId: `get-complaint-details-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { 
          complaintId,
          agentId: currentUser.UserId
        }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;
      const message = response.data.message || response.data.Message;
      console.log('Complaint details response:', { success, data });

      if (success && data) {
        // If the complaint is in the unassignedComplaints list, merge the data to ensure we have all fields
        const pendingComplaint = unassignedComplaints.find(c => c.ComplaintId === complaintId);
        
        if (pendingComplaint) {
          // Merge data from pendingComplaint with data from API to ensure we have all fields
          setSelectedComplaint({
            ...pendingComplaint,
            ...data,
            // Ensure these fields exist for the UI
            CitizenName: data.CitizenName || pendingComplaint.CitizenName || pendingComplaint.Name,
            CitizenMobileNo: data.CitizenMobileNo || pendingComplaint.CitizenMobileNo || pendingComplaint.MobileNo,
          });
        } else {
          setSelectedComplaint(data);
        }
        
        setIsModalOpen(true);
        console.log('Modal should be open now, isModalOpen:', true);
        
        // Use the new function to fetch officers
        fetchOfficersForForwarding();
      } else {
        // Handle different error cases
        if (message && message.includes("other departments")) {
          toast.error("You don't have permission to view complaints from other departments");
        } else if (message && message.includes("assigned to another agent")) {
          toast.error("This complaint is assigned to another agent");
        } else {
          toast.error(message || 'Failed to load complaint details');
        }
        console.error('Failed to load complaint details - API success was false or no data');
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
      toast.error('Error loading complaint details');
    }
  };

  // Replace the old fetchOfficers with the new one
  useEffect(() => {
    if (isModalOpen) {
      fetchOfficersForForwarding();
    }
  }, [isModalOpen]);

  // Add a function to resolve a complaint
  const resolveComplaint = async (complaintId) => {
    try {
      const currentUser = getCurrentUser();
      
      const response = await api.post('/complaints/resolve', {
        RequestId: `resolve-complaint-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { 
          complaintId, 
          agentId: currentUser.UserId,
          resolutionNotes: 'Resolved by agent'
        }
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Complaint resolved successfully');
        setIsModalOpen(false);
        await fetchComplaints(currentUser.UserId);
      } else {
        toast.error(message || 'Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Error resolving complaint');
    }
  };

  // Add function to fix pending complaints
  const fixPendingComplaints = async () => {
    try {
      const response = await api.post('/complaints/fix-pending', {
        RequestId: `fix-pending-complaints-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;
      const data = response.data.data || response.data.Data;

      if (success) {
        toast.success(message || `Fixed ${data.fixed} inconsistent complaints`);
        // Refresh data after fixing
        const currentUser = getCurrentUser();
        await fetchComplaints(currentUser.UserId);
        await fetchUnassignedComplaints();
      } else {
        toast.error(message || 'Failed to fix pending complaints');
      }
    } catch (error) {
      console.error('Error fixing pending complaints:', error);
      toast.error('Error fixing pending complaints');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First load agent data
        const agentDataResponse = await fetchAgentData();
        
        // Proceed with or without agent data - use defaults if needed
        const currentUser = getCurrentUser();
        
        // Add delay between API calls to avoid race conditions
        if (currentUser && currentUser.UserId) {
          // Try to fetch complaints, but don't show errors
          try {
            await fetchComplaints(currentUser.UserId);
            console.log("Successfully fetched assigned complaints");
          } catch (error) {
            console.log("Error fetching assigned complaints:", error.message);
          }
          
          // Wait a bit before the next API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try to fetch unassigned complaints, but don't show errors
          try {
            await fetchUnassignedComplaints();
            console.log("Successfully fetched unassigned complaints");
          } catch (error) {
            console.log("Error fetching unassigned complaints:", error.message);
          }
        }
        
        console.log("Dashboard initialization completed");
      } catch (error) {
        console.log("Dashboard initialization error:", error.message);
      }
    };
    
    // Initialize data
    initializeData();
    
    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.UserId) {
        fetchComplaints(currentUser.UserId).catch(error => {
          console.log("Error refreshing complaints:", error.message);
        });
        
        fetchUnassignedComplaints().catch(error => {
          console.log("Error refreshing unassigned complaints:", error.message);
        });
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, []); // Only run once on component mount

  // Fetch unassigned complaints when the tab changes to complaints
  useEffect(() => {
    if (selectedTab === 'complaints' && !loading && agentData && agentData.AgentId) {
      console.log("Tab changed to complaints, refreshing data");
      fetchUnassignedComplaints();
    }
  }, [selectedTab, loading, agentData]);

  // Apply animations when component mounts and data is loaded
  useEffect(() => {
    if (!loading && agentData) {
      try {
        // Wait a brief moment to ensure DOM elements are fully rendered
        const animationTimeout = setTimeout(() => {
          // Create a timeline for smoother animations
          const tl = gsap.timeline();
          
          // Check if elements exist before animating them
          if (headerRef.current) {
            // Animate header
            tl.fromTo(
              headerRef.current, 
              { y: -20, opacity: 0 }, 
              { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
            );
          }
          
          // Check if card refs array is not empty before animating
          if (cardRefs.current && cardRefs.current.length > 0) {
            // Filter out any null or undefined elements for safety
            const validCards = cardRefs.current.filter(card => card !== null && card !== undefined);
            
            if (validCards.length > 0) {
              // Animate content cards
              tl.fromTo(
                validCards, 
                { y: 30, opacity: 0 }, 
                { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out" },
                "-=0.2"
              );
            }
          }
          
          // Check if content ref exists before animating
          if (contentRef.current) {
            // Animate other content
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
        };
      } catch (error) {
        console.error("GSAP animation error:", error);
        // Continue with the app even if animations fail
      }
    }
    
    // Cleanup function to kill any active GSAP animations when component unmounts
    return () => {
      try {
        // Safely kill animations on refs that might exist
        if (headerRef.current) gsap.killTweensOf(headerRef.current);
        if (contentRef.current) gsap.killTweensOf(contentRef.current);
        if (cardRefs.current) {
          cardRefs.current.forEach(card => {
            if (card) gsap.killTweensOf(card);
          });
        }
      } catch (err) {
        console.error("Error cleaning up GSAP animations:", err);
      }
    };
  }, [loading, agentData]);

  // Add cleanup for GSAP animations when component unmounts
  useEffect(() => {
    return () => {
      try {
        // Kill all animations and clear all GSAP instances
        gsap.killTweensOf([headerRef.current, contentRef.current]);
        
        if (cardRefs.current) {
          cardRefs.current.forEach(card => {
            if (card) gsap.killTweensOf(card);
          });
        }
        
        // Force garbage collection on any potentially leaked animations
        gsap.globalTimeline.clear();
      } catch (err) {
        console.error("Error cleaning up all GSAP animations:", err);
      }
    };
  }, []);

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
  if (!agentData) {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div ref={headerRef} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {agentData.Name}</h1>
        <p className="text-gray-600">
          {agentData.Level === 'L1' ? 'Level 1 Agent Dashboard' : 'Level 2 Agent Dashboard'}
        </p>
      </div>
      
      {/* Company Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center">
          <Building className="mr-3 h-6 w-6" />
          <div>
            <p className="text-sm text-purple-100">COMPANY</p>
            <h2 className="text-xl font-bold">{agentData.EmployerName || 'Your Company'}</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'overview'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'complaints'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('complaints')}
          >
            {agentData.department || 'Sales'} Complaints
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              selectedTab === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-600'
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
            {/* Profile Info Card */}
            <div 
              ref={el => {
                if (el) {
                  // Push into array only if the element exists
                  // First ensure we're not adding the same element twice
                  if (cardRefs.current.indexOf(el) === -1) {
                    cardRefs.current.push(el);
                  }
                }
              }} 
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
                  <span className="font-medium text-gray-800">{agentData.Name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500 font-medium mb-1">Email</span>
                  <span className="font-medium text-gray-800">{agentData.EmailId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500 font-medium mb-1">Mobile</span>
                  <span className="font-medium text-gray-800">{agentData.MobileNo}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-500 font-medium mb-1">Level</span>
                  <span className="font-medium text-gray-800">{agentData.Level || 'L1'}</span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div 
              ref={el => {
                if (el) {
                  // Push into array only if the element exists
                  // First ensure we're not adding the same element twice
                  if (cardRefs.current.indexOf(el) === -1) {
                    cardRefs.current.push(el);
                  }
                }
              }} 
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
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {agentData.Status || 'Active'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created Date</span>
                  <span className="text-gray-800 font-medium">{new Date(agentData.CreatedOn || new Date()).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Supervisor</span>
                  <span className="text-gray-800 font-medium">{agentData.SupervisorName || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sub-Admin</span>
                  <span className="text-gray-800 font-medium">{agentData.SubAdminName || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Task Stats Card */}
            <div 
              ref={el => {
                if (el) {
                  // Push into array only if the element exists
                  // First ensure we're not adding the same element twice
                  if (cardRefs.current.indexOf(el) === -1) {
                    cardRefs.current.push(el);
                  }
                }
              }} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 mr-3">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Task Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Tasks</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {stats.completedTasks}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Tasks</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {stats.pendingTasks}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Hours This Week</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stats.totalHours}
                  </span>
                </div>
              </div>
            </div>

            {/* Complaints Overview Card */}
            <div 
              ref={el => {
                if (el) {
                  // Push into array only if the element exists
                  // First ensure we're not adding the same element twice
                  if (cardRefs.current.indexOf(el) === -1) {
                    cardRefs.current.push(el);
                  }
                }
              }} 
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-3"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Recent {agentData.department || 'Sales'} Complaints</h2>
                </div>
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
                  <p>No complaints assigned to you yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Citizen</th>
                        <th className="px-4 py-3 text-left">Department</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.slice(0, 5).map((complaint) => (
                        <tr key={complaint.ComplaintId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">#{complaint.ComplaintId}</td>
                          <td className="px-4 py-3">{complaint.CitizenName}</td>
                          <td className="px-4 py-3">{complaint.Department}</td>
                          <td className="px-4 py-3">{complaint.ComplaintCategory}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(complaint.Status)}`}>
                              {complaint.Status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(complaint.CreatedOn)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {selectedTab === 'complaints' && (
          <div>
            {/* Replace Pending Complaints Section with Department Complaints */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Unassigned {agentData.department || 'Sales'} Complaints</h2>
              
              {unassignedComplaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>No unassigned complaints for your department and level</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Citizen</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unassignedComplaints.map((complaint) => (
                        <tr key={complaint.ComplaintId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">#{complaint.ComplaintId}</td>
                          <td className="px-4 py-3">{complaint.CitizenName || complaint.Name}</td>
                          <td className="px-4 py-3">{complaint.CitizenMobileNo || complaint.MobileNo}</td>
                          <td className="px-4 py-3">{complaint.ComplaintCategory}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(complaint.Status)}`}>
                              {complaint.Status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(complaint.CreatedOn)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => assignComplaintToMe(complaint.ComplaintId)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-xs"
                            >
                              Assign to Me
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Existing Assigned Complaints Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Assigned to Me</h2>
                {agentData?.accessLevel >= 2 && (
                  <button
                    onClick={fixPendingComplaints}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-1 px-2 rounded"
                    title="Fix inconsistent complaint assignments"
                  >
                    Fix Assignments
                  </button>
                )}
              </div>
              
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>No complaints assigned to you yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Citizen</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Department</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {complaints.map((complaint) => (
                        <tr key={complaint.ComplaintId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">#{complaint.ComplaintId}</td>
                          <td className="px-4 py-3">{complaint.CitizenName || complaint.Name}</td>
                          <td className="px-4 py-3">{complaint.CitizenMobileNo || complaint.MobileNo}</td>
                          <td className="px-4 py-3">{complaint.Department}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(complaint.Status)}`}>
                              {complaint.Status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(complaint.CreatedOn)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => viewComplaintDetails(complaint.ComplaintId)}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-xs"
                            >
                              View Complaint
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Complaint Details</h2>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 text-center">
                  Select a complaint to view details
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab - Keep existing code */}
        {selectedTab === 'profile' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 mr-3">
                <Briefcase size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
            </div>
            <div className="space-y-3 text-gray-600">
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Name</span>
                <span className="font-medium text-gray-800">{agentData.Name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Email</span>
                <span className="font-medium text-gray-800">{agentData.EmailId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Mobile</span>
                <span className="font-medium text-gray-800">{agentData.MobileNo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-medium mb-1">Level</span>
                <span className="font-medium text-gray-800">{agentData.Level || 'L1'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Complaint Details Modal - Enhanced Version */}
      {isModalOpen && selectedComplaint && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Complaint #{selectedComplaint.ComplaintId}
                </h2>
                <div className="flex items-center mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClasses(selectedComplaint.Status)}`}>
                    {selectedComplaint.Status.replace('_', ' ')}
                  </span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-sm text-gray-500">Submitted on {formatDate(selectedComplaint.CreatedOn)}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Left Column - Complaint Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Complaint Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedComplaint.Description}</p>
                  </div>
                  
                  {/* Complaint Info */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Complaint Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{selectedComplaint.Department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-medium">{selectedComplaint.Region || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sub-Department</p>
                        <p className="font-medium">{selectedComplaint.SubDepartment || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium">{selectedComplaint.ComplaintCategory || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{selectedComplaint.ComplaintType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">District</p>
                        <p className="font-medium">{selectedComplaint.ComplaintDistrict || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Village/City</p>
                        <p className="font-medium">{selectedComplaint.ComplaintVillageCity || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Village</p>
                        <p className="font-medium">{selectedComplaint.ComplaintVillage || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {selectedComplaint.AttachmentURL && (
                    <div className="bg-blue-50 p-5 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-800 mb-3">Attachments</h3>
                      <a 
                        href={selectedComplaint.AttachmentURL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        </svg>
                        View Attachment
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Right Column - Citizen Details and Actions */}
                <div className="space-y-6">
                  {/* Citizen Info */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Citizen Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{selectedComplaint.Name || selectedComplaint.CitizenName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mobile</p>
                        <p className="font-medium">{selectedComplaint.MobileNo || selectedComplaint.CitizenMobileNo || 'N/A'}</p>
                      </div>
                      {(selectedComplaint.EmailId || selectedComplaint.Email) && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedComplaint.EmailId || selectedComplaint.Email || 'N/A'}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedComplaint.Address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">
                          {selectedComplaint.ResidentDistrict || 'N/A'}, 
                          {selectedComplaint.ResidentBlock || 'N/A'}, 
                          {selectedComplaint.ResidentVillage || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Panel */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="p-5 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800">Actions</h3>
                    </div>
                    
                    <div className="p-5 space-y-5">
                      {/* Resolve Action */}
                      {(selectedComplaint.Status === 'pending' || selectedComplaint.Status === 'assigned' || selectedComplaint.Status === 'in_progress') && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Resolve Complaint</h4>
                          <button
                            onClick={() => resolveComplaint(selectedComplaint.ComplaintId)}
                            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors"
                          >
                            Mark as Resolved
                          </button>
                        </div>
                      )}
                      
                      {/* Forward Action */}
                      {(selectedComplaint.Status === 'assigned' || selectedComplaint.Status === 'in_progress') && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Forward Complaint</h4>
                          <div className="space-y-3">
                            <select 
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={selectedOfficer}
                              onChange={(e) => setSelectedOfficer(e.target.value)}
                            >
                              <option value="">Select target level</option>
                              {officers.map((officer) => (
                                <option key={officer.id} value={officer.id}>
                                  {officer.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={forwardComplaintToOfficer}
                              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
                              disabled={!selectedOfficer}
                            >
                              Forward Complaint
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* In Progress Action */}
                      {selectedComplaint.Status === 'assigned' && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Update Status</h4>
                          <button
                            onClick={() => updateComplaintStatus(selectedComplaint.ComplaintId, 'in_progress')}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors"
                          >
                            Mark In Progress
                          </button>
                        </div>
                      )}
                      
                      {/* Reject Action */}
                      {(selectedComplaint.Status === 'pending' || selectedComplaint.Status === 'assigned' || selectedComplaint.Status === 'in_progress') && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Reject Complaint</h4>
                          <button
                            onClick={() => updateComplaintStatus(selectedComplaint.ComplaintId, 'rejected')}
                            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
