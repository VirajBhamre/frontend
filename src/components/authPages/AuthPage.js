// src/pages/auth/AuthPage.js
import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { login, getDashboardUrlByRole } from '../../services/authService';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    identifier: Yup.string().required('Email / Aadhaar / Mobile is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoginError('');
      console.log('Attempting login with:', values.identifier);
      const userData = await login(values);
      
      if (userData) {
        console.log('Login successful! User data:', userData);
        
        // Save EmpId to localStorage for easier access
        if (userData.EmpId) {
          localStorage.setItem('empId', userData.EmpId);
          console.log('Saved EmpId to localStorage:', userData.EmpId);
        }
        
        // Use the centralized function to determine where to redirect the user
        const dashboardUrl = getDashboardUrlByRole(userData);
        console.log('Redirecting to:', dashboardUrl);
        
        // Force a slight delay to ensure everything is saved
        setTimeout(() => {
          navigate(dashboardUrl);
        }, 100);
        
        toast.success(`Welcome back, ${userData.Name || 'user'}!`);
      } else {
        console.error('Login successful but no user data returned');
        setLoginError('Login successful but failed to get user data.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
      // The error toast is already shown in handleError, so we don't need to show it here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen pt-20 lg:grid-cols-2 bg-[#d0e1ff]">
      {/* Left illustration */}
      <div className="relative hidden lg:block bg-[#d0e1ff]">
        <img
          src="/AuthPage.png"
          alt="Authentication Illustration"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold">Welcome Back</h2>
              <p className="text-sm text-gray-600">Sign in to access your account</p>
            </div>

            {/* Server‑side error banner */}
            {loginError && (
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {loginError}
              </div>
            )}

            <Formik
              initialValues={{ identifier: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, values }) => (
                <Form className="space-y-5">
                  {/* Identifier field with floating label */}
                  <div className="relative">
                    <Field
                      id="identifier"
                      name="identifier"
                      className={`
                        peer w-full px-6 py-3 pr-14
                        rounded-tl-xl rounded-tr-xl rounded-br-xl
                        bg-white text-gray-800 border border-gray-300 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                    />
                    <label
                      htmlFor="identifier"
                      className={`
                        absolute left-5 px-1 bg-white rounded transition-all text-sm
                        ${values.identifier || touched.identifier ? '-top-2.5 text-xs text-blue-500' : 'top-3.5 text-gray-400'}
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-500
                        ${touched.identifier && errors.identifier ? 'text-red-600' : ''}
                      `}
                    >
                      Mobile / Aadhaar / Email
                    </label>
                    {errors.identifier && touched.identifier && (
                      <span className="absolute right-6 top-1 text-red-600 text-xs">* Required</span>
                    )}
                  </div>

                  {/* Password field with floating label & eye toggle */}
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`
                        peer w-full px-6 py-3 pr-14
                        rounded-tl-xl rounded-tr-xl rounded-br-xl
                        bg-white text-gray-800 border border-gray-300 shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute top-1/2 right-4 z-20 transform -translate-y-1/2 text-blue-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <label
                      htmlFor="password"
                      className={`
                        absolute left-5 px-1 bg-white rounded transition-all text-sm
                        ${values.password || touched.password ? '-top-2.5 text-xs text-blue-500' : 'top-3.5 text-gray-400'}
                        peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-500
                        ${touched.password && errors.password ? 'text-red-600' : ''}
                      `}
                    >
                      Password
                    </label>
                    {errors.password && touched.password && (
                      <span className="absolute right-6 top-1 text-red-600 text-xs">* Required</span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full bg-[#ff4473] px-6 py-4
                      rounded-tl-xl rounded-tr-xl rounded-br-xl
                      text-white text-sm font-semibold
                      hover:bg-[#679bfb] transition disabled:opacity-50
                    "
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
              {' '} or {' '}
              <Link to="/citizen-register" className="text-blue-600 hover:underline">
                Register as Citizen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
