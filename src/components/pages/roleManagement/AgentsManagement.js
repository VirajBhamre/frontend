import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Check, X, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { getCurrentUser } from '../../../services/authService';

const AgentsManagement = ({ employerId, subAdminId, onLicenseUpdate, totalLicenses, usedLicenses }) => {
  const [agents, setAgents] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    AgentId: 0,
    SubAdminId: null,
    SupervisorId: null,
    EmpId: employerId,
    Name: '',
    EmailId: '',
    MobileNo: '',
    Password: '',
    Level: 'L1',
    Status: 'active'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState('');
  const [filteredSupervisors, setFilteredSupervisors] = useState([]);

  useEffect(() => {
    // Fetch subadmins, supervisors, and agents when component mounts or employerId changes
    if (employerId) {
      fetchSubAdmins();
      fetchSupervisors();
      fetchAgents();
    }
    
    // Set up an interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      if (employerId) {
        fetchSubAdmins(false);
        fetchSupervisors(false);
        fetchAgents(false);
      }
    }, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [employerId]);

  // Set employerId in formData when it changes
  useEffect(() => {
    if (employerId) {
      setFormData(prev => ({ ...prev, EmpId: employerId }));
    }
  }, [employerId]);

  // Update the filtered supervisors when subadmin selection changes
  useEffect(() => {
    if (selectedSubAdmin) {
      console.log('Filtering supervisors for SubAdminId:', selectedSubAdmin);
      console.log('Available supervisors:', supervisors.map(s => ({ id: s.SupervisorId, subAdminId: s.SubAdminId, name: s.Name })));
      
      const filtered = supervisors.filter(supervisor => 
        String(supervisor.SubAdminId) === String(selectedSubAdmin)
      );
      
      console.log('Filtered supervisors:', filtered.length, filtered.map(s => s.Name));
      setFilteredSupervisors(filtered);
      
      // If the currently selected supervisor is not in the filtered list, reset it
      if (formData.SupervisorId && !filtered.some(s => String(s.SupervisorId) === String(formData.SupervisorId))) {
        console.log('Selected supervisor not in filtered list, resetting');
        setFormData(prev => ({ ...prev, SupervisorId: null }));
      }
    } else {
      setFilteredSupervisors([]);
      setFormData(prev => ({ ...prev, SupervisorId: null }));
    }
  }, [selectedSubAdmin, supervisors, formData.SupervisorId]);

  // Add a new function to fetch supervisors
  const fetchSupervisors = async (showLoadingState = true) => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If employerId is not provided, try to get it from the user object
      const empIdToUse = employerId || user.UserId;
      
      if (!empIdToUse) {
        return;
      }

      // Create the payload based on available data
      const payload = { empId: empIdToUse };
      
      console.log('Fetching supervisors with payload:', payload);
      
      const response = await api.post('/employers/supervisors', {
        RequestId: `get-supervisors-${Date.now()}`,
        AuthToken: token,
        Payload: payload
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || [];

      if (success) {
        // Ensure we properly handle different response formats
        let supervisorsArray = Array.isArray(data) ? data : [data];
        setSupervisors(supervisorsArray);
        console.log('Supervisors loaded:', supervisorsArray.length);
      } else {
        console.error('Failed to fetch supervisors:', response.data);
        setSupervisors([]);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      setSupervisors([]);
    }
  };

  const fetchAgents = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If employerId is not provided, try to get it from the user object
      const empIdToUse = employerId || user.UserId;
      
      if (!empIdToUse) {
        toast.error('Employer ID not found');
        if (showLoadingState) setLoading(false);
        return;
      }

      // Create the payload based on available data
      const payload = { empId: empIdToUse };
      
      // If we have a specific subAdminId (from props or current user is a Sub-Admin), use it for filtering
      const currentUserRole = user?.Role;
      const payloadSubAdminId = subAdminId || (currentUserRole === 'SubAdmin' ? user.UserId : null);
      
      if (payloadSubAdminId) {
        payload.subAdminId = payloadSubAdminId;
      }
      
      console.log('Fetching agents with payload:', payload);
      
      const response = await api.post('/employers/agents', {
        RequestId: `get-agents-${Date.now()}`,
        AuthToken: token,
        Payload: payload
      });

      console.log('Agents API Response:', response.data);

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || [];

      if (success) {
        // Ensure we properly handle different response formats and empty arrays
        let agentsArray = [];
        
        if (Array.isArray(data)) {
          agentsArray = data;
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Handle case where data is an object but not an array
          agentsArray = [data];
        }
        
        setAgents(agentsArray);
        console.log('Agents loaded:', agentsArray.length);
      } else {
        console.error('Failed to fetch agents:', response.data);
        if (showLoadingState) toast.error('Failed to fetch agents');
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      if (showLoadingState) toast.error('Failed to fetch agents: ' + (error.message || 'Unknown error'));
      setAgents([]);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const fetchSubAdmins = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empIdToUse = employerId || user.UserId;
      
      if (!empIdToUse) {
        console.error('Employer ID not found for fetching sub-admins');
        if (showLoadingState) setLoading(false);
        return;
      }
      
      console.log('Fetching sub-admins for agents management, empId:', empIdToUse);
      
      const response = await api.post('/employers/subadmins', {
        RequestId: `get-subadmins-${Date.now()}`,
        AuthToken: token,
        Payload: { empId: empIdToUse }
      });

      console.log('SubAdmins API Response for agents:', response.data);

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || [];
      
      if (success) {
        // Ensure data is treated as an array
        let subAdminsArray = [];
        
        if (Array.isArray(data)) {
          subAdminsArray = data;
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Handle case where data is an object but not an array
          subAdminsArray = [data];
        }
        
        console.log('SubAdmins loaded for agents:', subAdminsArray.length);
        
        setSubAdmins(subAdminsArray);
        
        // If we have sub-admins, pre-select the first one for the form
        if (subAdminsArray.length > 0 && !formData.SubAdminId) {
          setFormData(prev => ({ ...prev, SubAdminId: subAdminsArray[0].SubAdminId }));
        }
      } else {
        console.error('Failed to fetch sub-admins for agents:', response.data);
        setSubAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching sub-admins for agents:', error);
      setSubAdmins([]);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'SubAdminId') {
      setSelectedSubAdmin(value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value ? parseInt(value) : null,
        SupervisorId: null // Reset supervisor when subadmin changes
      }));
    } else if (name === 'SupervisorId') {
      // Convert SupervisorId from string to number
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : null
      }));
      console.log('Selected supervisor:', value ? parseInt(value) : null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      AgentId: 0,
      SubAdminId: null,
      SupervisorId: null,
      EmpId: employerId,
      Name: '',
      EmailId: '',
      MobileNo: '',
      Password: '',
      Level: 'L1',
      Status: 'active'
    });
    setSelectedSubAdmin('');
    setIsEditing(false);
  };

  const handleEdit = (agent) => {
    setFormData({
      AgentId: agent.AgentId,
      SubAdminId: agent.SubAdminId,
      SupervisorId: agent.SupervisorId,
      EmpId: agent.EmpId || employerId,
      Name: agent.Name,
      EmailId: agent.EmailId,
      MobileNo: agent.MobileNo,
      Password: '', // Password field is blank when editing
      Level: agent.Level,
      Status: agent.Status
    });
    setSelectedSubAdmin(agent.SubAdminId?.toString() || '');
    
    // Filter supervisors for this subadmin
    const filtered = supervisors.filter(
      supervisor => supervisor.SubAdminId === agent.SubAdminId
    );
    setFilteredSupervisors(filtered);
    
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.Name || !formData.EmailId || !formData.MobileNo || (!isEditing && !formData.Password) || !formData.Level) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.SubAdminId) {
      toast.error('Please select a Sub-Admin');
      return;
    }

    if (!formData.SupervisorId) {
      toast.error('Please select a Supervisor');
      return;
    }

    // Check license availability for new agent
    if (!isEditing && usedLicenses >= totalLicenses) {
      toast.error(`No available licenses. You have used ${usedLicenses}/${totalLicenses} licenses. Please upgrade your plan or delete existing roles.`);
      return;
    }

    try {
      // Get token properly from localStorage
      const token = localStorage.getItem('token') || '';
      
      // Convert SubAdminId and SupervisorId to integers if they are strings
      const payload = {
        ...formData,
        SubAdminId: typeof formData.SubAdminId === 'string' ? parseInt(formData.SubAdminId) : formData.SubAdminId,
        SupervisorId: typeof formData.SupervisorId === 'string' ? parseInt(formData.SupervisorId) : formData.SupervisorId
      };
      
      console.log('Saving agent with data:', payload);
      
      const response = await api.post('/employers/agents/save', {
        RequestId: `save-agent-${Date.now()}`,
        AuthToken: token,
        Payload: payload
      });

      console.log('Save Agent Response:', response.data);

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Agent saved successfully');
        resetForm();
        setShowForm(false);
        fetchAgents();
        
        // Update license count in the parent component if not editing
        if (!isEditing && typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Failed to save agent');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Error saving agent: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (agentId, subAdminId) => {
    try {
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empId = employerId || user.UserId;
      
      console.log('Deleting agent:', agentId, 'for employer:', empId);
      
      const response = await api.post('/employers/agents/delete', {
        RequestId: `delete-agent-${Date.now()}`,
        AuthToken: token,
        Payload: { 
          agentId,
          subAdminId,
          empId: empId
        }
      });

      console.log('Delete Agent Response:', response.data);

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Agent deleted successfully');
        fetchAgents();
        
        // Update license count in the parent component
        if (typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent: ' + (error.message || 'Unknown error'));
    } finally {
      setConfirmDelete(null);
    }
  };

  const getSubAdminName = (subAdminId) => {
    const subAdmin = subAdmins.find(sa => sa.SubAdminId === subAdminId);
    return subAdmin ? subAdmin.Name : 'Unknown';
  };

  const getSupervisorName = (supervisorId) => {
    if (!supervisorId) return 'N/A';
    
    const supervisor = supervisors.find(sup => sup.SupervisorId === supervisorId);
    return supervisor ? supervisor.Name : 'N/A';
  };

  const getLevelBadgeColor = (level) => {
    switch(level) {
      case 'L1': return 'bg-blue-100 text-blue-800';
      case 'L2': return 'bg-purple-100 text-purple-800';
      case 'L3': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Display a message if there are no sub-admins
  if (!loading && subAdmins.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Sub-Admins Available</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  You need to create at least one Sub-Admin before you can manage Agents.
                  Please create a Sub-Admin first.
                </p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/employer/dashboard/subadmins';
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Sub-Admins
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* License check warning banner */}
      {!isEditing && !loading && usedLicenses >= totalLicenses && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">License limit reached</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You have used all available licenses ({usedLicenses}/{totalLicenses}). 
                   To add more agents, please upgrade your plan or delete existing roles.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Agents Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              fetchSubAdmins();
              fetchAgents();
            }}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {!showForm && (
            <button
              onClick={() => {
                if (usedLicenses >= totalLicenses) {
                  toast.error('No available licenses. Please upgrade your plan or delete existing roles to add more agents.');
                  return;
                }
                resetForm();
                setShowForm(true);
              }}
              className={`flex items-center px-4 py-2 ${
                usedLicenses >= totalLicenses ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded transition`}
              disabled={usedLicenses >= totalLicenses}
              id="addAgentButton"
            >
              <Plus size={18} className="mr-1" />
              Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {isEditing ? 'Edit Agent' : 'Add New Agent'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SubAdmin Selection - Show only if user is not a SubAdmin */}
            {getCurrentUser()?.Role !== 'SubAdmin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-Admin *
                </label>
                <select
                  name="SubAdminId"
                  value={selectedSubAdmin}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Sub-Admin</option>
                  {subAdmins.map(admin => (
                    <option key={admin.SubAdminId} value={admin.SubAdminId}>
                      {admin.Name} ({admin.Region || 'No Region'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Supervisor Selection - Only show if a SubAdmin is selected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor *
              </label>
              <select
                name="SupervisorId"
                value={formData.SupervisorId || ''}
                onChange={(e) => {
                  console.log('Supervisor selection changed to:', e.target.value);
                  handleInputChange(e);
                }}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedSubAdmin}
              >
                <option value="">Select Supervisor</option>
                {filteredSupervisors.map(supervisor => {
                  console.log('Supervisor option:', supervisor.SupervisorId, supervisor.Name);
                  return (
                    <option key={supervisor.SupervisorId} value={supervisor.SupervisorId}>
                      {supervisor.Name} ({supervisor.Department || 'No Department'})
                    </option>
                  );
                })}
              </select>
              {!selectedSubAdmin && (
                <p className="text-sm text-red-500 mt-1">Please select a Sub-Admin first</p>
              )}
              {selectedSubAdmin && filteredSupervisors.length === 0 && (
                <p className="text-sm text-red-500 mt-1">No supervisors found for this Sub-Admin</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level *
              </label>
              <select
                name="Level"
                value={formData.Level}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="L1">Level 1 (L1)</option>
                <option value="L2">Level 2 (L2)</option>
                <option value="L3">Level 3 (L3)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="EmailId"
                value={formData.EmailId}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                name="MobileNo"
                value={formData.MobileNo}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEditing ? 'Password (Leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                name="Password"
                value={formData.Password}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isEditing ? 'Update' : 'Create'} Agent
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* No Agents State */}
      {!loading && agents.length === 0 && !showForm && (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Found</h3>
          <p className="text-gray-500 mb-6">
            You haven't created any agents yet. Start by adding your first agent.
          </p>
          <button
            onClick={() => {
              if (usedLicenses >= totalLicenses) {
                toast.error('No available licenses. Please upgrade your plan or delete existing roles to add more agents.');
                return;
              }
              setShowForm(true);
            }}
            className={`inline-flex items-center px-4 py-2 ${
              usedLicenses >= totalLicenses ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded transition`}
            disabled={usedLicenses >= totalLicenses}
          >
            <Plus size={18} className="mr-1" />
            Add Your First Agent
          </button>
        </div>
      )}

      {/* Agents List */}
      {!loading && agents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.AgentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agent.Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.EmailId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSubAdminName(agent.SubAdminId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getSupervisorName(agent.SupervisorId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${getLevelBadgeColor(agent.Level)}`}>
                      {agent.Level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.Department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${agent.Status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {agent.Status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={18} />
                      </button>
                      {confirmDelete === agent.AgentId ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(agent.AgentId, agent.SubAdminId)}
                            className="text-green-600 hover:text-green-900"
                            title="Confirm Delete"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(agent.AgentId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentsManagement;