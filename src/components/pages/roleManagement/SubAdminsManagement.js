import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Check, X, RefreshCw, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { getAccessToken } from '../../../utils/cookieUtils';

const SubAdminsManagement = ({ employerId, onLicenseUpdate, totalLicenses, usedLicenses }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    SubAdminId: 0,
    EmpId: employerId,
    Name: '',
    EmailId: '',
    MobileNo: '',
    Password: '',
    Status: 'active',
    Region: 'East'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    // Fetch data when component mounts or when employerId changes
    if (employerId) {
      fetchSubAdmins();
    } else {
      // If no employerId is passed, try to get it from localStorage
      const empIdFromStorage = localStorage.getItem('empId');
      if (empIdFromStorage) {
        fetchSubAdmins(true, empIdFromStorage);
      }
    }
    
    // Set up an interval to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchSubAdmins(false);
    }, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [employerId]);

  // Update form data when employerId changes
  useEffect(() => {
    if (employerId) {
      setFormData(prev => ({ ...prev, EmpId: employerId }));
    }
  }, [employerId]);

  const fetchSubAdmins = async (showLoadingState = true, empId) => {
    if (showLoadingState) setLoading(true);
    try {
      // Get the token directly from localStorage for consistency
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If employerId is not provided, try to get it from the user object
      const empIdToUse = empId || employerId || user.UserId;
      
      if (!empIdToUse) {
        toast.error('Employer ID not found');
        if (showLoadingState) setLoading(false);
        return;
      }

      console.log('Fetching subadmins for employer:', empIdToUse);
      
      const response = await api.post('/employers/subadmins', {
        RequestId: `get-subadmins-${Date.now()}`,
        AuthToken: token, // Use the actual token instead of empty string
        Payload: { empId: empIdToUse }
      });

      console.log('SubAdmins API Response:', response.data);

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || [];
      
      if (success) {
        // Ensure we properly handle different response formats and empty arrays
        let subAdminsArray = [];
        
        if (Array.isArray(data)) {
          subAdminsArray = data;
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Handle case where data is an object but not an array
          subAdminsArray = [data];
        }
        
        setSubAdmins(subAdminsArray);
        console.log('SubAdmins loaded:', subAdminsArray.length);
      } else {
        console.error('Failed to fetch sub-admins:', response.data);
        if (showLoadingState) toast.error('Failed to fetch sub-admins');
        setSubAdmins([]);
      }
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      if (showLoadingState) toast.error('Failed to fetch sub-admins: ' + (error.message || 'Unknown error'));
      setSubAdmins([]);
    } finally {
      // Always ensure loading is set to false regardless of outcome
      if (showLoadingState) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      SubAdminId: 0,
      EmpId: employerId,
      Name: '',
      EmailId: '',
      MobileNo: '',
      Password: '',
      Status: 'active',
      Region: 'East'
    });
    setIsEditing(false);
  };

  const handleEdit = (subAdmin) => {
    setFormData({
      SubAdminId: subAdmin.SubAdminId,
      EmpId: employerId,
      Name: subAdmin.Name,
      EmailId: subAdmin.EmailId,
      MobileNo: subAdmin.MobileNo,
      Password: '', // Password field is blank when editing
      Status: subAdmin.Status,
      Region: subAdmin.Region || 'East'
    });
    setIsEditing(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.Name || !formData.EmailId || !formData.MobileNo || (!isEditing && !formData.Password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check license availability for new sub-admin
    if (!isEditing && usedLicenses >= totalLicenses) {
      toast.error(`No available licenses. You have used ${usedLicenses}/${totalLicenses} licenses. Please upgrade your plan or delete existing roles.`);
      return;
    }

    try {
      // Get token properly from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empId = employerId || user.UserId;
      
      // Make sure EmpId is set in the form data
      const updatedFormData = {
        ...formData,
        EmpId: empId
      };
      
      console.log('Saving subadmin with data:', updatedFormData);
      
      const response = await api.post('/employers/subadmins/save', {
        RequestId: `save-subadmin-${Date.now()}`,
        AuthToken: token, // Use the token directly instead of empty string
        Payload: updatedFormData
      });

      console.log('Save SubAdmin Response:', response.data);

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Sub-admin saved successfully');
        resetForm();
        setShowForm(false);
        fetchSubAdmins();
        
        // Update license count in the parent component if not editing
        if (!isEditing && typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Failed to save sub-admin');
      }
    } catch (error) {
      console.error('Error saving sub-admin:', error);
      toast.error('Failed to save sub-admin: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (subAdminId) => {
    try {
      // Get token properly from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empId = employerId || user.UserId;
      
      console.log('Deleting subadmin:', subAdminId, 'for employer:', empId);
      
      const response = await api.post('/employers/subadmins/delete', {
        RequestId: `delete-subadmin-${Date.now()}`,
        AuthToken: token, // Use the token directly instead of empty string
        Payload: { 
          subAdminId: subAdminId,
          empId: empId
        }
      });

      console.log('Delete SubAdmin Response:', response.data);

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Sub-admin deleted successfully');
        fetchSubAdmins();
        
        // Update license count in the parent component
        if (typeof onLicenseUpdate === 'function') {
          onLicenseUpdate();
        }
      } else {
        toast.error(message || 'Failed to delete sub-admin');
      }
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      toast.error('Failed to delete sub-admin: ' + (error.message || 'Unknown error'));
    } finally {
      setConfirmDelete(null);
    }
  };

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
                   To add more sub-admins, please upgrade your plan or delete existing roles.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Sub-Admins Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchSubAdmins}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {!showForm && (
            <button
              onClick={() => {
                if (usedLicenses >= totalLicenses) {
                  toast.error('No available licenses. Please upgrade your plan or delete existing roles to add more sub-admins.');
                  return;
                }
                resetForm();
                setShowForm(true);
              }}
              className={`flex items-center px-4 py-2 ${usedLicenses >= totalLicenses ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } text-white rounded transition`}
              disabled={usedLicenses >= totalLicenses}
            >
              <Plus size={18} className="mr-1" />
              Add Sub-Admin
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {isEditing ? 'Edit Sub-Admin' : 'Add New Sub-Admin'}
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
                Password {isEditing ? '(Leave blank to keep current)' : '*'}
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
                Region *
              </label>
              <select
                name="Region"
                value={formData.Region}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
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
                {isEditing ? 'Update' : 'Create'} Sub-Admin
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

      {/* No Sub-Admins State */}
      {!loading && subAdmins.length === 0 && !showForm && (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Admins Found</h3>
          <p className="text-gray-500 mb-6">
            You haven't added any sub-admins yet. Sub-admins can help you manage your account by creating and managing supervisors and agents.
          </p>
          <button
            onClick={() => {
              if (usedLicenses >= totalLicenses) {
                toast.error('No available licenses. Please upgrade your plan to add sub-admins.');
                return;
              }
              setShowForm(true);
            }}
            className={`inline-flex items-center px-4 py-2 ${usedLicenses >= totalLicenses ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } text-white rounded transition`}
            disabled={usedLicenses >= totalLicenses}
          >
            <Plus size={18} className="mr-1" />
            Add Your First Sub-Admin
          </button>
        </div>
      )}

      {/* Sub-Admins List */}
      {!loading && subAdmins.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subAdmins.map((subAdmin) => (
                <tr key={subAdmin.SubAdminId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subAdmin.Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subAdmin.EmailId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subAdmin.MobileNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subAdmin.Region || 'East'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      subAdmin.Status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {subAdmin.Status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(subAdmin)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      {confirmDelete === subAdmin.SubAdminId ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDelete(subAdmin.SubAdminId)}
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
                          onClick={() => setConfirmDelete(subAdmin.SubAdminId)}
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
    </div>
  );
};

export default SubAdminsManagement;