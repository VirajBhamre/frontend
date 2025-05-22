// src/services/employerService.js
import api from './api'; // Import the configured axios instance
import { toast } from 'react-toastify';
import { getCurrentUser, getAuthToken } from './authService'; // To get AuthToken if needed from cookie
import { getAccessToken } from '../utils/cookieUtils';

// Helper to handle API errors consistently
const handleApiError = (error, defaultMessage = 'An error occurred') => {
    console.error("API Error:", error);
    // Attempt to get message from nested structure
    const message = error?.response?.data?.Message ||
        error?.response?.data?.message ||
        error?.message ||
        defaultMessage;
    toast.error(message);
    // Re-throw the error so the calling component knows it failed
    throw new Error(message);
};

// Function to get all products from mst_products table (using public endpoint)
export const getAllProducts = async () => {
    try {
        console.log("[getAllProducts] Making request to fetch products from public endpoint");
        
        // Remove the /api prefix since it's already in the baseURL
        const endpoint = '/master/product/public'; 
        console.log("[getAllProducts] Endpoint:", endpoint);
        
        // For debugging, log the actual full URL
        console.log("[getAllProducts] Full URL (should be):", 
            process.env.REACT_APP_API_URL + endpoint);
        
        // Make the API call
        const response = await api.get(endpoint);
        
        console.log("[getAllProducts] Products Response:", response.data);

        // Check the success flag from the response body - handle both upper and lowercase keys
        const success = response.data.Success || response.data.success;
        
        if (success) {
            // Handle both upper and lowercase Data/data
            return response.data.Data || response.data.data || []; 
        } else {
            // API indicated failure even with a 2xx response
            const message = response.data.Message || response.data.message;
            throw new Error(message || 'Failed to fetch products.');
        }
    } catch (error) {
        // Log the error details
        console.error("[getAllProducts] Caught error:", error);
        if (error.response) {
            console.error("[getAllProducts] Error response data:", error.response.data);
            console.error("[getAllProducts] Error response status:", error.response.status);
            console.error("[getAllProducts] Error response headers:", error.response.headers);
        }
        // Use the helper to handle and display the error
        handleApiError(error, 'Failed to fetch products. Please try again.');
        // Error is re-thrown by handleApiError
        return []; // Return empty array if there's an error
    }
};

// Function to save or update employer data
export const saveOrUpdateEmployer = async (employerData) => {
    try {
        // Get token from cookie
        const token = getAccessToken();

        const requestPayload = {
            RequestId: `save-employer-${Date.now()}`, // Unique request ID
            AuthToken: token || "", // Get token from cookie
            Payload: {
                EmpId: employerData.EmpId || 0, // Use provided EmpId or 0 for new
                ...employerData, // Spread the rest of the employer form data
            }
        };

        console.log("Sending Employer Payload:", requestPayload);

        // Use the configured api instance for the POST request
        const response = await api.post('/master/employers/saveOrUpdate', requestPayload);

        console.log("Employer Save/Update Response:", response.data);

        // Check the success flag from the response body
        const success = response.data.Success || response.data.success; // Handle potential case differences
        const message = response.data.Message || response.data.message;

        if (success) {
            toast.success(message || "Employer data saved successfully!");
            return response.data; // Return the full response data on success
        } else {
            // API indicated failure even with a 2xx response
            throw new Error(message || 'Failed to save employer data.');
        }
    } catch (error) {
        // Use the helper to handle and display the error
        handleApiError(error, 'Failed to save employer data. Please try again.');
        // Error is re-thrown by handleApiError
    }
};

// Employer self-registration (pending approval)
export const registerEmployerRequest = async (employerData) => {
    try {
        // Add explicit debug logging for license value
        console.log("REGISTER DEBUG - Requested license count:", employerData.licenses);
        
        const requestPayload = {
            RequestId: `register-employer-${Date.now()}`,
            AuthToken: "", // No token needed for registration
            Payload: {
                name: employerData.Name,
                companyName: employerData.CompanyName || employerData.Name,
                mobileNo: employerData.MobileNo,
                emailId: employerData.EmailId,
                aadharNo: employerData.AadharNo,
                password: employerData.Password,
                ticket: employerData.Ticket,
                licenses: employerData.licenses // Add the licenses parameter here
            }
        };
        
        // Log the full payload being sent
        console.log("REGISTER DEBUG - Full registration payload:", JSON.stringify(requestPayload));
        
        const response = await api.post('/accounts/employer-register', requestPayload);
        const success = response.data.Success || response.data.success;
        const message = response.data.Message || response.data.message;
        
        console.log("REGISTER DEBUG - Server response:", JSON.stringify(response.data));
        
        if (success) {
            toast.success(message || 'Registration request submitted!');
            return response.data;
        } else {
            throw new Error(message || 'Failed to submit registration request.');
        }
    } catch (error) {
        handleApiError(error, 'Failed to submit registration request. Please try again.');
    }
};

// Employer self-registration with payment (instant approval)
export const registerEmployerWithPayment = async (employerData) => {
    try {
        const { paymentInfo, ...employerInfo } = employerData;
        
        const requestPayload = {
            RequestId: `register-employer-paid-${Date.now()}`,
            AuthToken: "", // No token needed for registration
            Payload: {
                name: employerInfo.Name,
                companyName: employerInfo.CompanyName || employerInfo.Name,
                mobileNo: employerInfo.MobileNo,
                emailId: employerInfo.EmailId,
                aadharNo: employerInfo.AadharNo,
                password: employerInfo.Password,
                ticket: employerInfo.Ticket,
                productId: employerInfo.ProductId,
                licenses: employerInfo.licenses, // Add the licenses parameter here
                isPaid: true,
                paymentMethod: paymentInfo.method,
                paymentAmount: paymentInfo.amount
            }
        };
        
        // Call the API endpoint for paid registration (will set status as 'approved')
        const response = await api.post('/accounts/employer-register-paid', requestPayload);
        
        const success = response.data.Success || response.data.success;
        const message = response.data.Message || response.data.message;
        const data = response.data.Data || response.data.data;
        
        if (success) {
            toast.success(message || 'Registration successful!');
            return response.data;
        } else {
            throw new Error(message || 'Failed to register with payment.');
        }
    } catch (error) {
        handleApiError(error, 'Failed to register with payment. Please try again.');
    }
};

// Get employer profile for dashboard
export const getEmployerProfile = async () => {
    try {
        const user = getCurrentUser();
        if (!user || !user.UserId) throw new Error('No employer user found');
        
        const token = getAccessToken();
        
        // Make a direct call to get full employer details including license information
        const response = await api.post('/employers/employer', {
            RequestId: `get-employer-profile-${Date.now()}`,
            AuthToken: token || '',
            Payload: { empId: user.UserId }
        });
        
        console.log("Employer profile response:", response.data);
        
        const success = response.data.Success || response.data.success;
        if (success) {
            const employerData = response.data.Data || response.data.data;
            // Ensure license data is included, defaulting to sane values if missing
            return {
                ...employerData,
                Licenses: employerData.Licenses || 50, // Default to 50 if not present
                UsedLicenses: employerData.UsedLicenses || 0 // Default to 0 if not present
            };
        } else {
            // If the specific endpoint fails, fall back to the status endpoint
            console.log("Falling back to get-employer-status endpoint");
            const fallbackResponse = await api.post('/accounts/get-employer-status', {
                RequestId: `get-employer-status-${Date.now()}`,
                AuthToken: token || '',
                Payload: { EmpId: user.UserId }
            });
            
            if (fallbackResponse.data.Success || fallbackResponse.data.success) {
                return fallbackResponse.data.Data || fallbackResponse.data.data;
            } else {
                throw new Error(fallbackResponse.data.Message || fallbackResponse.data.message || 'Failed to fetch employer profile');
            }
        }
    } catch (error) {
        console.error('Error in getEmployerProfile:', error);
        
        // Instead of throwing an error, return a basic profile with data from localStorage
        // This is a fallback solution until a proper endpoint is available
        const user = getCurrentUser();
        if (user) {
            return {
                EmpId: user.UserId,
                Name: user.Name,
                EmailId: user.EmailId,
                Status: user.Status || 'unknown',
                CompanyName: user.Name, // Fallback to Name if CompanyName is not available
                Licenses: 50, // Default value
                UsedLicenses: 0 // Default value
            };
        }
        
        // If we can't even get user from localStorage, then throw the error
        handleApiError(error, 'Failed to fetch employer profile.');
    }
};

// Get employer status for pending/approval
export const getEmployerStatus = async () => {
    try {
        const user = getCurrentUser();
        if (!user || !user.UserId) throw new Error('No employer user found');
        
        const token = getAccessToken();
        
        const response = await api.post('/accounts/get-employer-status', {
            RequestId: `get-employer-status-${Date.now()}`,
            AuthToken: token || '',
            Payload: { EmpId: user.UserId }
        });
        const success = response.data.Success || response.data.success;
        if (success) {
            return response.data.Data || response.data.data;
        } else {
            throw new Error(response.data.Message || response.data.message || 'Failed to fetch employer status');
        }
    } catch (error) {
        handleApiError(error, 'Failed to fetch employer status.');
    }
};

// Role Management Functions

// Get all sub-admins for an employer
export const getSubAdmins = async (empId) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/subadmins', {
      RequestId: `get-subadmins-${Date.now()}`,
      AuthToken: token || '',
      Payload: { empId }
    });
    
    const success = response.data.success || response.data.Success;
    if (success) {
      return response.data.data || response.data.Data || [];
    } else {
      throw new Error(response.data.message || response.data.Message || 'Failed to fetch sub-admins');
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch sub-admins.');
    return [];
  }
};

// Save or update a sub-admin
export const saveOrUpdateSubAdmin = async (subAdminData) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/subadmins/save', {
      RequestId: `save-subadmin-${Date.now()}`,
      AuthToken: token || '',
      Payload: subAdminData
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Sub-admin saved successfully');
      return response.data;
    } else {
      throw new Error(message || 'Failed to save sub-admin');
    }
  } catch (error) {
    handleApiError(error, 'Failed to save sub-admin.');
  }
};

// Delete a sub-admin
export const deleteSubAdmin = async (subAdminId, empId) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/subadmins/delete', {
      RequestId: `delete-subadmin-${Date.now()}`,
      AuthToken: token || '',
      Payload: { subAdminId, empId }
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Sub-admin deleted successfully');
      return true;
    } else {
      throw new Error(message || 'Failed to delete sub-admin');
    }
  } catch (error) {
    handleApiError(error, 'Failed to delete sub-admin.');
    return false;
  }
};

// Get all supervisors for an employer
export const getSupervisors = async (empId, subAdminId = null) => {
  try {
    const token = getAccessToken();
    
    const payload = { empId };
    if (subAdminId) {
      payload.subAdminId = subAdminId;
    }
    
    const response = await api.post('/employers/supervisors', {
      RequestId: `get-supervisors-${Date.now()}`,
      AuthToken: token || '',
      Payload: payload
    });
    
    const success = response.data.success || response.data.Success;
    if (success) {
      return response.data.data || response.data.Data || [];
    } else {
      throw new Error(response.data.message || response.data.Message || 'Failed to fetch supervisors');
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch supervisors.');
    return [];
  }
};

// Save or update a supervisor
export const saveOrUpdateSupervisor = async (supervisorData) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/supervisors/save', {
      RequestId: `save-supervisor-${Date.now()}`,
      AuthToken: token || '',
      Payload: supervisorData
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Supervisor saved successfully');
      return response.data;
    } else {
      throw new Error(message || 'Failed to save supervisor');
    }
  } catch (error) {
    handleApiError(error, 'Failed to save supervisor.');
  }
};

// Delete a supervisor
export const deleteSupervisor = async (supervisorId, subAdminId, empId) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/supervisors/delete', {
      RequestId: `delete-supervisor-${Date.now()}`,
      AuthToken: token || '',
      Payload: { supervisorId, subAdminId, empId }
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Supervisor deleted successfully');
      return true;
    } else {
      throw new Error(message || 'Failed to delete supervisor');
    }
  } catch (error) {
    handleApiError(error, 'Failed to delete supervisor.');
    return false;
  }
};

// Get all agents for an employer
export const getAgents = async (empId, subAdminId = null) => {
  try {
    const token = getAccessToken();
    
    const payload = { empId };
    if (subAdminId) {
      payload.subAdminId = subAdminId;
    }
    
    const response = await api.post('/employers/agents', {
      RequestId: `get-agents-${Date.now()}`,
      AuthToken: token || '',
      Payload: payload
    });
    
    const success = response.data.success || response.data.Success;
    if (success) {
      return response.data.data || response.data.Data || [];
    } else {
      throw new Error(response.data.message || response.data.Message || 'Failed to fetch agents');
    }
  } catch (error) {
    handleApiError(error, 'Failed to fetch agents.');
    return [];
  }
};

// Save or update an agent
export const saveOrUpdateAgent = async (agentData) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/agents/save', {
      RequestId: `save-agent-${Date.now()}`,
      AuthToken: token || '',
      Payload: agentData
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Agent saved successfully');
      return response.data;
    } else {
      throw new Error(message || 'Failed to save agent');
    }
  } catch (error) {
    handleApiError(error, 'Failed to save agent.');
  }
};

// Delete an agent
export const deleteAgent = async (agentId, subAdminId, empId) => {
  try {
    const token = getAccessToken();
    
    const response = await api.post('/employers/agents/delete', {
      RequestId: `delete-agent-${Date.now()}`,
      AuthToken: token || '',
      Payload: { agentId, subAdminId, empId }
    });
    
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    
    if (success) {
      toast.success(message || 'Agent deleted successfully');
      return true;
    } else {
      throw new Error(message || 'Failed to delete agent');
    }
  } catch (error) {
    handleApiError(error, 'Failed to delete agent.');
    return false;
  }
};

export const fetchAllRolesData = async (empId) => {
  try {
    const token = getAccessToken();
    console.log('Fetching all roles data with token:', token ? 'Valid token' : 'No token');

    // Fetch sub-admins
    const subAdminsResponse = await api.post('/employers/subadmins', {
      RequestId: `get-subadmins-${Date.now()}`,
      AuthToken: token || '',
      Payload: { empId },
    });

    // Normalize subAdmins data - handle both array and object responses
    let subAdmins = [];
    if (subAdminsResponse.data.success || subAdminsResponse.data.Success) {
      const data = subAdminsResponse.data.data || subAdminsResponse.data.Data || [];
      if (Array.isArray(data)) {
        subAdmins = data;
      } else if (data && typeof data === 'object') {
        subAdmins = [data]; // Handle case where API returns a single object
      }
    }
    console.log('SubAdmins fetched in fetchAllRolesData:', subAdmins.length);

    // Fetch supervisors
    const supervisorsResponse = await api.post('/employers/supervisors', {
      RequestId: `get-supervisors-${Date.now()}`,
      AuthToken: token || '',
      Payload: { empId },
    });

    // Normalize supervisors data - handle both array and object responses
    let supervisors = [];
    if (supervisorsResponse.data.success || supervisorsResponse.data.Success) {
      const data = supervisorsResponse.data.data || supervisorsResponse.data.Data || [];
      if (Array.isArray(data)) {
        supervisors = data;
      } else if (data && typeof data === 'object') {
        supervisors = [data]; // Handle case where API returns a single object
      }
    }
    console.log('Supervisors fetched in fetchAllRolesData:', supervisors.length);

    // Fetch agents
    const agentsResponse = await api.post('/employers/agents', {
      RequestId: `get-agents-${Date.now()}`,
      AuthToken: token || '',
      Payload: { empId },
    });

    // Normalize agents data - handle both array and object responses
    let agents = [];
    if (agentsResponse.data.success || agentsResponse.data.Success) {
      const data = agentsResponse.data.data || agentsResponse.data.Data || [];
      if (Array.isArray(data)) {
        agents = data;
      } else if (data && typeof data === 'object') {
        agents = [data]; // Handle case where API returns a single object
      }
    }
    console.log('Agents fetched in fetchAllRolesData:', agents.length);

    return { subAdmins, supervisors, agents };
  } catch (error) {
    console.error('Error fetching all roles data:', error);
    return { subAdmins: [], supervisors: [], agents: [] };
  }
};