// src/components/authPages/AdminLogin.js
import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { login, getDashboardUrlByRole } from '../../services/authService';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    identifier: Yup.string().required('Username / Email / Phone Number is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoginError('');
      // Add an admin flag to differentiate admin login from regular login
      const userData = await login({ ...values, isAdminLogin: true });
      
      if (userData) {
        // Verify this is actually an admin account
        if (userData.Role !== 'Admin' && userData.Role !== 'SAdmin' && userData.Role !== 1) {
          throw new Error('Not authorized as admin');
        }
        
        // Navigate to admin dashboard
        const dashboardUrl = getDashboardUrlByRole(userData);
        navigate(dashboardUrl);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-sm text-gray-600">Restricted access. Authorized personnel only.</p>
        </div>

        {/* Server-side error banner */}
        {loginError && (
          <div className="px-4 py-2 mb-4 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {loginError}
          </div>
        )}

        <Formik
          initialValues={{ identifier: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Email / Phone Number
                </label>
                <Field
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Enter your email or phone number"
                  className={`w-full px-3 py-2 border ${
                    touched.identifier && errors.identifier ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {touched.identifier && errors.identifier && (
                  <div className="mt-1 text-sm text-red-600">{errors.identifier}</div>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 border ${
                      touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <div className="mt-1 text-sm text-red-600">{errors.password}</div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in as Admin'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminLogin;