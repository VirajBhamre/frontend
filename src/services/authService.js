// src/services/authService.js
import api, { authAPI } from './api';
import { toast } from 'react-toastify';
import { 
  setAuthCookies, 
  clearAuthCookies,
  isAuthenticatedByCookie,
  getAccessToken,
  getCookie
} from '../utils/cookieUtils';

// Helper function to standardize error handling
const handleError = (error, defaultMsg = 'Something went wrong') => {
  console.error('Auth Service Error:', error);

  // Extract the most relevant error message
  const errorMessage =
    error?.response?.data?.Message || // Prioritize API's message field (case-sensitive)
    error?.response?.data?.message ||
    error?.message ||
    defaultMsg;

  // Show error toast only if it hasn't been shown already
  if (!error.toastShown) {
    toast.error(errorMessage);
    error.toastShown = true; // Mark that we've shown a toast for this error
  }
  
  // Re-throw the error with a meaningful message for the component catch block
  throw new Error(errorMessage);
};

export const getIdentifierType = (identifier) => {
  if (!identifier) return '';
  if (identifier.includes('@')) return 'Email';
  // Check for phone number format (10 digits)
  if (/^\d{10}$/.test(identifier)) return 'PhoneNo';
  if (/^\d{12}$/.test(identifier)) return 'Aadhar';
  return 'Username'; // Default fallback or handle as needed
};

export const login = async (credentials) => {
  try {
    const { identifier, password, isAdminLogin } = credentials;
    
    // Check what kind of identifier we're dealing with
    let type = 'E'; // Default to Email
    
    // Check if identifier is a phone number (10 digits)
    if (/^\d{10}$/.test(identifier)) {
      type = 'P'; // Phone
    }
    // Check if identifier is Aadhaar (12-digit number)
    else if (/^\d{12}$/.test(identifier)) {
      type = 'A'; // Aadhaar
    }
    // Check if identifier is an email
    else if (identifier.includes('@')) {
      type = 'E'; // Email
    } 
    // Default to Mobile (M) for other cases
    else {
      type = 'M'; // Mobile (default)
    }
    
    // For admin login, use the admin-specific endpoint
    // For all other users, use the main login endpoint
    const endpoint = isAdminLogin ? '/accounts/admin-login' : '/accounts/login';
    
    console.log(`Sending login request: ${type}, ${identifier} to ${endpoint}`);

    // Match backend expectations with proper capitalization
    // The current controller expects UserId and Password directly in the Payload
    const requestData = {
      RequestId: `login-${Date.now()}`,
      AuthToken: '',
      Payload: {
        UserId: identifier,
        Password: password,
        // Include Type for the old controller that might expect it
        Type: type
      }
    };

    console.log('Login request data:', { 
      ...requestData, 
      Payload: { 
        ...requestData.Payload, 
        Password: '***' 
      } 
    });

    const response = await api.post(endpoint, requestData);
    
    // Handle potential case mismatch in response keys (Success vs success)
    const success = response.data.success || response.data.Success;
    const message = response.data.message || response.data.Message;
    const data = response.data.data || response.data.Data;
    
    console.log('Login response:', { success, message, hasData: !!data });
    
    if (!success) {
      throw new Error(message || 'Authentication failed. Invalid credentials or server issue.');
    }
    
    if (!data) {
      throw new Error('Authentication successful but no user data returned.');
    }
    
    // For admin login, verify the role
    if (isAdminLogin && data.Role !== 'Admin' && data.Role !== 'SAdmin' && data.Role !== 1) {
      throw new Error('Not authorized as admin. Please use the regular login page.');
    }
    
    // For regular login, verify that this is not an admin account
    if (!isAdminLogin && (data.Role === 'Admin' || data.Role === 'SAdmin' || data.Role === 1)) {
      throw new Error('Admin accounts must use the admin login portal.');
    }
    
    // Standardize role value (handle numeric role codes)
    let standardizedRole = data.Role;
    if (data.Role === 1) standardizedRole = 'Admin';
    if (data.Role === 2) standardizedRole = 'Employer';
    if (data.Role === 3) standardizedRole = 'SubAdmin';
    if (data.Role === 4) standardizedRole = 'Supervisor';
    if (data.Role === 5) standardizedRole = 'Agent';
    
    // Standardize status value
    let standardizedStatus = data.Status || 'active';
    if (standardizedStatus === 1 || standardizedStatus === '1') standardizedStatus = 'active';
    if (standardizedStatus === 0 || standardizedStatus === '0') standardizedStatus = 'inactive';
    
    // Simplify and standardize user data structure
    const userData = {
      UserId: data.UserId || data.EmpId,
      Role: standardizedRole,
      Name: data.Name,
      EmailId: data.EmailId,
      Status: standardizedStatus,
      RejectionReason: data.RejectionReason,
      // Store the company/employer information
      EmpId: data.EmpId,
      CompanyName: data.CompanyName || data.Name, // For employers, use their name as company name
      Licenses: data.Licenses,
      UsedLicenses: data.UsedLicenses
    };

    console.log('Processed user data:', userData);
    
    // Save token in cookie instead of localStorage
    setAuthCookies(
      data.AccessToken || data.accessToken,
      data.RefreshToken || data.refreshToken,
      30 // 30 minutes expiry
    );
    
    // Still store user info (but without tokens) in localStorage for UI needs
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Manually check if cookie was set properly
    const authCookieCheck = document.cookie.includes('accessToken');
    console.log('Auth cookie set verification:', authCookieCheck);
    
    toast.success(message || 'Login successful');
    return userData;
  } catch (error) {
    // Handle errors that come from the API response first
    if (error.response) {
      const responseMessage = 
        error.response.data?.Message || 
        error.response.data?.message || 
        'Authentication failed. Please check your credentials.';
      
      console.error('Login API error:', {
        status: error.response.status,
        data: error.response.data,
        message: responseMessage
      });
      
      toast.error(responseMessage);
      throw new Error(responseMessage);
    }
    
    // Otherwise, handle the regular error
    console.error('Auth Service Error:', error);
    toast.error(error.message || 'Login failed. Please check your credentials or connection.');
    throw error;
  }
};

// Update getDashboardUrlByRole function to handle OfficerMaster and SuperAdmin roles
export const getDashboardUrlByRole = (user) => {
  if (!user) {
    console.error('getDashboardUrlByRole called with no user data');
    return '/login';
  }
  
  console.log('Getting dashboard URL for user:', {
    role: user.Role,
    status: user.Status,
    userId: user.UserId
  });
  
  const role = user.Role;
  const status = user.Status;
  
  if (role === 'Employer') {
    console.log('Employer role detected with status:', status);
    if (status === 'pending') {
      return '/employer/pending';
    } else if (status === 'approved' || status === 'active') {
      return '/employer/dashboard';
    } else {
      console.warn('Employer has unknown status:', status);
      return '/employer/dashboard'; // Default to dashboard
    }
  } else if (role === 'SubAdmin') {
    return '/subadmin/dashboard';
  } else if (role === 'Supervisor') {
    return '/supervisor/dashboard';
  } else if (role === 'Agent') {
    return '/agent/dashboard';
  } else if (role === 'OfficerMaster') {
    return '/officermaster/dashboard';
  } else if (role === 'Admin') {
    return '/dashboard';
  } else if (role === 'SAdmin') {
    // SuperAdmin gets the admin dashboard for now
    // In future, could redirect to a specific superadmin dashboard
    return '/dashboard';
  } else if (role === 'Citizen') {
    return '/citizen/dashboard';
  }
  
  console.warn('Unknown role detected:', role);
  return '/login';
};

export const register = async (userData) => {
  try {
    // The mapping happens in the component before calling this function
    const response = await authAPI.register(userData);

    const success = response.data.Success || response.data.success;
    const message = response.data.Message || response.data.message;

    // API returns Success: true even for "already registered", check message
    if (success && message?.toLowerCase().includes('successful')) {
      toast.success(message || 'Registration successful. Please log in.');
      return response.data; // Return data which might be null as per CURL
    } else if (success && message) {
      // Handle cases like "already registered" - treat as error for UI flow
      toast.warn(message); // Use warn for existing accounts
      throw new Error(message);
    }
    else {
      // Handle explicit Success: false or missing message
      throw new Error(message || 'Registration failed.');
    }

  } catch (error) {
    // Let handleError display toast and re-throw
    handleError(error, 'Registration failed. Please try again later.');
    throw error; // Ensure error propagates
  }
};

export const changePassword = async (passwordData) => {
  try {
    const response = await authAPI.changePassword(passwordData);

    const success = response.data.Success || response.data.success;
    const message = response.data.Message || response.data.message;

    if (success) {
      toast.success(message || 'Password changed successfully');
      return response.data;
    } else {
      throw new Error(message || 'Password change failed.');
    }
  } catch (error) {
    handleError(error, 'Password change failed. Please try again.');
    throw error; // Ensure error propagates
  }
};

export const logout = async () => {
  try {
    // Call the backend logout endpoint
    const response = await authAPI.logout();
    
    // Clear authentication cookies client-side
    clearAuthCookies();
    
    // Clear user info from localStorage
    localStorage.removeItem('user');
    
    toast.success('Logged out successfully.');
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    // Even if the API call fails, clear cookies and localStorage
    clearAuthCookies();
    localStorage.removeItem('user');
    
    toast.error('Logout process encountered an issue, but you have been logged out successfully.');
    return true; // Still return true as the user is effectively logged out
  }
};

export const isLoggedIn = () => {
  try {
    // Check for authentication in cookies first
    if (isAuthenticatedByCookie()) {
      return true;
    }
    
    // Legacy check for localStorage (fallback during transition)
    const user = localStorage.getItem('user');
    if (user) {
      // If we have user info in localStorage but no cookies, consider as logged in
      // This helps users who logged in with the old system
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user'); // Clear corrupted item
    return null;
  }
};

// Get auth token from cookie
export const getAuthToken = () => {
  return getAccessToken();
};

export const getEmployerStatus = async (employerId) => {
  try {
    // If no employerId is provided, try to get it from localStorage
    if (!employerId) {
      const user = getCurrentUser();
      if (!user || !user.UserId) {
        throw new Error('No employer ID available');
      }
      employerId = user.UserId;
    }
    
    const response = await authAPI.getEmployerStatus(employerId);
    
    const responseData = response.data;
    const success = responseData.Success || responseData.success;
    const message = responseData.Message || responseData.message;
    const data = responseData.Data || responseData.data;

    if (success) {
      return {
        success: true,
        message,
        data
      };
    } else {
      throw new Error(message || 'Failed to fetch employer status');
    }
  } catch (error) {
    handleError(error, 'Failed to fetch employer status');
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};