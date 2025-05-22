import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  UserCog, Edit2, Trash2, Search, Plus, Eye, 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, ShieldAlert,
  Check, X
} from 'lucide-react';
import api from '../../../services/api';
import { getCurrentUser } from '../../../services/authService';

const SupervisorsManagement = ({ employerId, subAdminId, onLicenseUpdate, totalLicenses, usedLicenses }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentSupervisor, setCurrentSupervisor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    department: 'Sales',
    password: '',
    confirmPassword: ''
  });
  const [selectedSubAdmin, setSelectedSubAdmin] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch both supervisors and sub-admins data when component mounts or employerId changes
    if (employerId) {
      fetchSubAdmins();
      fetchSupervisors();
    } else {
      // If no employerId is passed, try to get it from localStorage
      const empIdFromStorage = localStorage.getItem('empId');
      if (empIdFromStorage) {
        fetchSubAdmins(empIdFromStorage);
        fetchSupervisors(true, empIdFromStorage);
      }
    }
    
    // Set up an interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      if (employerId) {
        fetchSubAdmins(false);
        fetchSupervisors(false);
      }
    }, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [employerId, subAdminId]);

  // Effect to ensure we always have a selected sub-admin when the list loads
  useEffect(() => {
    if (subAdmins.length > 0 && !selectedSubAdmin && !isEditing) {
      // Pre-select the first sub-admin if none is selected and we're not editing
      setSelectedSubAdmin(String(subAdmins[0].SubAdminId));
      console.log('Pre-selected first Sub-Admin:', subAdmins[0].Name, subAdmins[0].SubAdminId);
    }
  }, [subAdmins, selectedSubAdmin, isEditing]);

  const fetchSupervisors = async (showLoadingState = true, empId) => {
    if (showLoadingState) setLoading(true);
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If employerId is not provided, try to get it from the parameters or user object
      const empIdToUse = empId || employerId || user.UserId;
      
      if (!empIdToUse) {
        toast.error('Employer ID not found');
        if (showLoadingState) setLoading(false);
        return;
      }

      // If we have a subAdminId (from props or current user is a Sub-Admin), use it for filtering
      const currentUserRole = user?.Role;
      const payloadSubAdminId = subAdminId || (currentUserRole === 'SubAdmin' ? user.UserId : null);
      
      console.log('Fetching supervisors for employer:', empIdToUse, 'SubAdminId:', payloadSubAdminId);
      
      const payload = { empId: empIdToUse };
      
      // If we have a subAdminId, add it to the payload
      if (payloadSubAdminId) {
        payload.subAdminId = payloadSubAdminId;
      }
      
      const response = await api.post('/employers/supervisors', {
        RequestId: `get-supervisors-${Date.now()}`,
        AuthToken: token,
        Payload: payload
      });

      console.log('Supervisors API Response:', response.data);

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || [];

      if (success) {
        // Ensure we properly handle different response formats and empty arrays
        let supervisorsArray = [];
        
        if (Array.isArray(data)) {
          supervisorsArray = data;
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Handle case where data is an object but not an array
          supervisorsArray = [data];
        }
        
        setSupervisors(supervisorsArray);
        console.log('Supervisors loaded:', supervisorsArray.length);
      } else {
        console.error('Failed to fetch supervisors:', response.data);
        if (showLoadingState) toast.error('Failed to fetch supervisors');
        setSupervisors([]);
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
      if (showLoadingState) toast.error('Failed to fetch supervisors: ' + (error.message || 'Unknown error'));
      setSupervisors([]);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const fetchSubAdmins = async (empId, showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empIdToUse = empId || employerId || user.UserId;
      
      if (!empIdToUse) {
        console.error('Employer ID not found for fetching sub-admins');
        if (showLoadingState) setLoading(false);
        return;
      }
      
      console.log('Fetching sub-admins for employer in SupervisorsManagement:', empIdToUse);
      
      const response = await api.post('/employers/subadmins', {
        RequestId: `get-subadmins-${Date.now()}`,
        AuthToken: token,
        Payload: { empId: empIdToUse }
      });

      console.log('SubAdmins API Response in SupervisorsManagement:', response.data);

      const success = response.data.success || response.data.Success;
      let data = response.data.data || response.data.Data || [];
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = data ? [data] : [];
      }

      if (success) {
        console.log('SubAdmins loaded in SupervisorsManagement, count:', data.length);
        setSubAdmins(data);
        
        // If we have sub-admins and no selection yet, pre-select the first one
        if (data.length > 0 && !selectedSubAdmin) {
          setSelectedSubAdmin(String(data[0].SubAdminId));
        }
      } else {
        console.error('Failed to fetch sub-admins:', response.data);
        setSubAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      setSubAdmins([]);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!isEditing) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Only require sub-admin selection if the current user is not a sub-admin
    const currentUser = getCurrentUser();
    if (currentUser?.Role !== 'SubAdmin' && !selectedSubAdmin) {
      newErrors.subAdmin = 'Please select a Sub-Admin';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check license availability before creating a new supervisor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check license availability for new supervisor
    if (!isEditing && usedLicenses >= totalLicenses) {
      toast.error(`No available licenses. You have used ${usedLicenses}/${totalLicenses} licenses. Please upgrade your plan or delete existing roles.`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || '';
      const user = getCurrentUser();
      const empId = employerId || user?.UserId;
      
      if (!empId) {
        toast.error('Employer ID not found');
        return;
      }
      
      let subAdminIdToUse = selectedSubAdmin;
      
      // If the current user is a sub-admin, use their own ID
      if (user?.Role === 'SubAdmin') {
        subAdminIdToUse = user.UserId;
        console.log('Using current SubAdmin ID:', subAdminIdToUse);
      } else {
        console.log('Selected SubAdmin ID:', subAdminIdToUse);
      }
      
      // Ensure we have a SubAdminId if the current user is not a sub-admin
      if (user?.Role !== 'SubAdmin' && !subAdminIdToUse) {
        toast.error('Please select a Sub-Admin for this Supervisor');
        return;
      }
      
      const payload = {
        EmpId: empId,
        Name: formData.name,
        EmailId: formData.email,
        MobileNo: formData.phone,
        Status: formData.status,
        Department: formData.department,
        SubAdminId: subAdminIdToUse || null
      };
      
      if (!isEditing) {
        payload.Password = formData.password;
      }
      
      if (isEditing && currentSupervisor) {
        payload.SupervisorId = currentSupervisor.SupervisorId;
      }
      
      console.log('Saving supervisor with data:', payload);
      
      // Use the correct API endpoint based on the backend routes
      const response = await api.post('/employers/supervisors/save', {
        RequestId: `${isEditing ? 'update' : 'create'}-supervisor-${Date.now()}`,
        AuthToken: token,
        Payload: payload
      });
      
      console.log('Save Supervisor Response:', response.data);
      
      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message || 
                     (isEditing ? 'Supervisor updated successfully' : 'Supervisor created successfully');
      
      if (success) {
        toast.success(message);
        resetForm();
        setShowAddModal(false);
        fetchSupervisors();
        
        // Update license count in the parent component if not editing (new supervisor)
        if (!isEditing && typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Operation failed');
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} supervisor:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} supervisor: ` + 
                 (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (supervisor) => {
    setCurrentSupervisor(supervisor);
    setFormData({
      name: supervisor.Name || '',
      email: supervisor.EmailId || '',
      phone: supervisor.MobileNo || '',
      status: supervisor.Status || 'active',
      department: supervisor.Department || 'Sales',
      password: '',
      confirmPassword: ''
    });
    setSelectedSubAdmin(supervisor.SubAdminId ? String(supervisor.SubAdminId) : '');
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleView = (supervisor) => {
    setCurrentSupervisor(supervisor);
    setShowViewModal(true);
  };

  const handleDelete = async (supervisorId) => {
    try {
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empId = employerId || user.UserId;
      
      if (!empId) {
        toast.error('Employer ID not found');
        return;
      }
      
      console.log('Deleting supervisor:', supervisorId, 'for employer:', empId);
      
      const response = await api.post('/employers/supervisors/delete', {
        RequestId: `delete-supervisor-${Date.now()}`,
        AuthToken: token,
        Payload: {
          empId: empId,
          supervisorId: supervisorId,
          subAdminId: null // If the supervisor belongs to a sub-admin, this should be specified
        }
      });
      
      console.log('Delete Supervisor Response:', response.data);
      
      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message || 'Supervisor deleted successfully';
      
      if (success) {
        toast.success(message);
        fetchSupervisors();
        
        // Update license count in the parent component
        if (typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting supervisor:', error);
      toast.error('Failed to delete supervisor: ' + (error.message || 'Unknown error'));
    } finally {
      setConfirmDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'active',
      department: 'Sales',
      password: '',
      confirmPassword: ''
    });
    
    // If we have sub-admins, select the first one by default, otherwise clear the selection
    if (subAdmins.length > 0) {
      setSelectedSubAdmin(String(subAdmins[0].SubAdminId));
    } else {
      setSelectedSubAdmin('');
    }
    
    setIsEditing(false);
    setCurrentSupervisor(null);
    setErrors({});
  };

  const filteredSupervisors = supervisors.filter(supervisor => {
    return supervisor.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supervisor.EmailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supervisor.MobileNo?.includes(searchTerm);
  });

  const getSubAdminNameById = (id) => {
    if (!id) return 'N/A';
    
    // Convert id to string for comparison
    const idStr = String(id);
    
    // Find sub-admin with case-insensitive property matching
    const subAdmin = subAdmins.find(admin => {
      // Check for different possible case variations of SubAdminId
      const adminId = admin.SubAdminId || admin.subAdminId || admin.subadminid || admin.SUBADMINID;
      return String(adminId) === idStr;
    });
    
    // Also handle different property name case variations for Name
    return subAdmin ? (subAdmin.Name || subAdmin.name || subAdmin.NAME || 'N/A') : 'N/A';
  };

  // Display a message if there are no sub-admins
  if (!loading && subAdmins.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Sub-Admins Available</h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>
                  You need to create at least one Sub-Admin before you can manage Supervisors.
                  Please create a Sub-Admin first.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                // Use React Router navigation pattern
                if (typeof window !== 'undefined') {
                  window.location.href = '/employer/dashboard/subadmins';
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Sub-Admins
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        {/* License check warning banner */}
        {!isEditing && !loading && usedLicenses >= totalLicenses && (
          <div className="mb-6 w-full bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">License limit reached</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You have used all available licenses ({usedLicenses}/{totalLicenses}). 
                     To add more supervisors, please upgrade your plan or delete existing roles.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <UserCog className="mr-2" size={24} />
            Supervisors Management
          </h2>
          <p className="text-gray-600 mt-1">
            Create and manage supervisors for your organization
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search supervisors..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                fetchSubAdmins();
                fetchSupervisors();
              }}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              <Plus size={18} className="mr-1" />
              Add Supervisor
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* No Supervisors State */}
      {!loading && supervisors.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <UserCog size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Supervisors Found</h3>
          <p className="text-gray-600 mb-6">
            You haven't created any supervisors yet. Start by adding your first supervisor.
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={18} className="inline mr-1" />
            Add Your First Supervisor
          </button>
        </div>
      )}

      {/* Supervisors List */}
      {!loading && supervisors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Admin</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSupervisors.map((supervisor) => (
                <tr key={supervisor.SupervisorId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{supervisor.Name || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{supervisor.EmailId || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{supervisor.MobileNo || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{supervisor.Department || 'N/A'}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {supervisor.SubAdminId ? getSubAdminNameById(supervisor.SubAdminId) : 'N/A'}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supervisor.Status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supervisor.Status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(supervisor)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(supervisor)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      {confirmDelete === supervisor.SupervisorId ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(supervisor.SupervisorId)}
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
                          onClick={() => setConfirmDelete(supervisor.SupervisorId)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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

      {/* Add/Edit Supervisor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Edit Supervisor' : 'Add New Supervisor'}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="phone">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    id="phone"
                    className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="1234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="department">
                    Department *
                  </label>
                  <select
                    id="department"
                    className={`w-full px-3 py-2 border ${errors.department ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Presales">Presales</option>
                    <option value="Support">Support</option>
                    <option value="Technical">Technical</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>
                
                {/* If it's adding a new supervisor, show password fields */}
                {!isEditing && (
                  <>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                        Password *
                      </label>
                      <input
                        type="password"
                        id="password"
                        className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </>
                )}
                
                {/* If it's editing, show an optional password field */}
                {isEditing && (
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                      Password (Leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      id="password"
                      className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                )}
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className={`w-full px-3 py-2 border ${errors.status ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                </div>
                
                {/* Sub-Admin dropdown - only show if user is not a sub-admin */}
                {getCurrentUser()?.Role !== 'SubAdmin' && (
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="subAdmin">
                      Sub-Admin *
                    </label>
                    <select
                      id="subAdmin"
                      className={`w-full px-3 py-2 border ${errors.subAdmin ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      value={selectedSubAdmin}
                      onChange={(e) => setSelectedSubAdmin(e.target.value)}
                    >
                      <option value="">Select a Sub-Admin</option>
                      {subAdmins.map(admin => (
                        <option key={admin.SubAdminId} value={admin.SubAdminId}>
                          {admin.Name} ({admin.Region || 'No Region'})
                        </option>
                      ))}
                    </select>
                    {errors.subAdmin && <p className="text-red-500 text-xs mt-1">{errors.subAdmin}</p>}
                    {subAdmins.length === 0 && (
                      <p className="text-amber-600 text-xs mt-1">No Sub-Admins found. Please create a Sub-Admin first.</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {isEditing ? 'Update Supervisor' : 'Add Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supervisor Modal */}
      {showViewModal && currentSupervisor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Supervisor Details</h3>
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowViewModal(false)}
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCog size={24} />
                  </div>
                </div>
                
                <h4 className="text-lg font-medium text-center text-gray-800 mb-2">
                  {currentSupervisor.Name || 'No Name'}
                </h4>
                
                <div className="text-center">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    currentSupervisor.Status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentSupervisor.Status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center border-b border-gray-100 pb-3">
                  <div className="text-gray-500 w-32">Email:</div>
                  <div className="text-gray-800 font-medium">{currentSupervisor.EmailId || 'N/A'}</div>
                </div>
                
                <div className="flex items-center border-b border-gray-100 pb-3">
                  <div className="text-gray-500 w-32">Phone:</div>
                  <div className="text-gray-800 font-medium">{currentSupervisor.MobileNo || 'N/A'}</div>
                </div>
                
                <div className="flex items-center border-b border-gray-100 pb-3">
                  <div className="text-gray-500 w-32">Department:</div>
                  <div className="text-gray-800 font-medium">{currentSupervisor.Department || 'N/A'}</div>
                </div>
                
                <div className="flex items-center border-b border-gray-100 pb-3">
                  <div className="text-gray-500 w-32">Sub-Admin:</div>
                  <div className="text-gray-800 font-medium">
                    {currentSupervisor.SubAdminId 
                      ? getSubAdminNameById(currentSupervisor.SubAdminId)
                      : 'Not assigned'}
                  </div>
                </div>
                
                <div className="flex items-center border-b border-gray-100 pb-3">
                  <div className="text-gray-500 w-32">Created:</div>
                  <div className="text-gray-800 font-medium">
                    {currentSupervisor.CreatedAt 
                      ? new Date(currentSupervisor.CreatedAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(currentSupervisor);
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorsManagement;