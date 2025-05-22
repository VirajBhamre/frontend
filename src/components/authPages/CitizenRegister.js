import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const CitizenRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpData, setOtpData] = useState(null);
  const [formValues, setFormValues] = useState({});
  const navigate = useNavigate();

  // Validation schema for Step 1 (Mobile Verification)
  const validationSchemaStep1 = Yup.object({
    mobileNo: Yup.string()
      .required('Mobile number is required')
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  });

  // Validation schema for Step 2 (OTP Verification)
  const validationSchemaStep2 = Yup.object({
    otp: Yup.string()
      .required('OTP is required')
      .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
  });

  // Validation schema for Step 3 (Registration Form)
  const validationSchemaStep3 = Yup.object({
    name: Yup.string().required('Name is required'),
    nickname: Yup.string().required('Nickname is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  // Handle mobile number submission and OTP generation
  const handleMobileSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await api.post('/citizen/generate-otp', {
        RequestId: `generate-otp-${Date.now()}`,
        AuthToken: '',
        Payload: {
          mobileNo: values.mobileNo,
        },
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        toast.success(message || 'OTP generated successfully');
        setOtpData(data);
        setFormValues({ ...formValues, mobileNo: values.mobileNo });
        setCurrentStep(2);
      } else {
        toast.error(message || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('OTP generation error:', error);
      toast.error(error.response?.data?.message || 'Error generating OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async (values, { setSubmitting }) => {
    try {
      const response = await api.post('/citizen/verify-otp', {
        RequestId: `verify-otp-${Date.now()}`,
        AuthToken: '',
        Payload: {
          mobileNo: formValues.mobileNo,
          otp: values.otp,
        },
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'OTP verified successfully');
        setFormValues({ ...formValues, verified: true });
        setCurrentStep(3);
      } else {
        toast.error(message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.message || 'Error verifying OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle final registration
  const handleRegister = async (values, { setSubmitting }) => {
    try {
      const registerData = {
        name: values.name,
        nickname: values.nickname,
        mobileNo: formValues.mobileNo,
        emailId: values.emailId || null,
        isServiceman: values.isServiceman || false,
        gender: values.gender || null,
        password: values.password,
      };

      const response = await api.post('/citizen/register', {
        RequestId: `citizen-register-${Date.now()}`,
        AuthToken: '',
        Payload: registerData,
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Registration successful');
        // Redirect to login page
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        toast.error(message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Error during registration');
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
          alt="Citizen Registration"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Right form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold">Citizen Registration</h2>
              <p className="text-sm text-gray-600 mt-2">
                {currentStep === 1 && 'Enter your mobile number to get started'}
                {currentStep === 2 && 'Enter the OTP sent to your mobile'}
                {currentStep === 3 && 'Complete your profile information'}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-[#ff4473] text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-[#ff4473]' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-[#ff4473] text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                <div className={`w-12 h-1 ${currentStep >= 3 ? 'bg-[#ff4473]' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-[#ff4473] text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
              </div>
            </div>

            {/* Step 1: Mobile Verification */}
            {currentStep === 1 && (
              <Formik
                initialValues={{ mobileNo: '' }}
                validationSchema={validationSchemaStep1}
                onSubmit={handleMobileSubmit}
              >
                {({ isSubmitting, touched, errors }) => (
                  <Form className="space-y-5">
                    <div className="relative">
                      <label htmlFor="mobileNo" className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number*
                      </label>
                      <Field
                        type="text"
                        id="mobileNo"
                        name="mobileNo"
                        placeholder="10-digit mobile number"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          touched.mobileNo && errors.mobileNo ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <ErrorMessage name="mobileNo" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#ff4473] px-6 py-4 rounded-lg text-white text-sm font-semibold hover:bg-[#679bfb] transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <div className="text-center text-sm mt-4">
                      Already have an account?{' '}
                      <Link to="/login" className="text-blue-600 hover:underline">
                        Sign In
                      </Link>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <Formik
                initialValues={{ otp: '' }}
                validationSchema={validationSchemaStep2}
                onSubmit={handleOtpVerify}
              >
                {({ isSubmitting, touched, errors }) => (
                  <Form className="space-y-5">
                    <div className="relative">
                      <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter OTP*
                      </label>
                      <Field
                        type="text"
                        id="otp"
                        name="otp"
                        placeholder="6-digit OTP"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          touched.otp && errors.otp ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <ErrorMessage name="otp" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* For development: Display OTP */}
                    {process.env.NODE_ENV !== 'production' && otpData?.otp && (
                      <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                        <p className="text-sm">
                          <span className="font-bold">Development mode:</span> OTP is {otpData.otp}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="w-1/3 bg-gray-300 px-6 py-4 rounded-lg text-gray-800 text-sm font-semibold hover:bg-gray-400 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 bg-[#ff4473] px-6 py-4 rounded-lg text-white text-sm font-semibold hover:bg-[#679bfb] transition disabled:opacity-50"
                      >
                        {isSubmitting ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>
                    </div>

                    <div className="text-center text-sm mt-2">
                      Didn't receive OTP?{' '}
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-blue-600 hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}

            {/* Step 3: Registration Form */}
            {currentStep === 3 && (
              <Formik
                initialValues={{
                  name: '',
                  nickname: '',
                  emailId: '',
                  gender: '',
                  isServiceman: false,
                  password: '',
                  confirmPassword: '',
                }}
                validationSchema={validationSchemaStep3}
                onSubmit={handleRegister}
              >
                {({ isSubmitting, touched, errors, values }) => (
                  <Form className="space-y-5">
                    <div className="relative">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name*
                      </label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Your full name"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="relative">
                      <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                        Nickname*
                      </label>
                      <Field
                        type="text"
                        id="nickname"
                        name="nickname"
                        placeholder="Your nickname"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          touched.nickname && errors.nickname ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <ErrorMessage name="nickname" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="relative">
                      <label htmlFor="emailId" className="block text-sm font-medium text-gray-700 mb-1">
                        Email (Optional)
                      </label>
                      <Field
                        type="email"
                        id="emailId"
                        name="emailId"
                        placeholder="Your email address"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="relative">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                        Gender (Optional)
                      </label>
                      <Field
                        as="select"
                        id="gender"
                        name="gender"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Field>
                    </div>

                    <div className="relative flex items-center">
                      <Field
                        type="checkbox"
                        id="isServiceman"
                        name="isServiceman"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor="isServiceman" className="ml-2 block text-sm text-gray-700">
                        I am a serviceman / ex-serviceman
                      </label>
                    </div>

                    <div className="relative">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password*
                      </label>
                      <div className="relative">
                        <Field
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          placeholder="Create a password"
                          className={`w-full px-4 py-3 rounded-lg border ${
                            touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute top-1/2 right-4 transform -translate-y-1/2 text-blue-500"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="relative">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password*
                      </label>
                      <Field
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          touched.confirmPassword && errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="w-1/3 bg-gray-300 px-6 py-4 rounded-lg text-gray-800 text-sm font-semibold hover:bg-gray-400 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 bg-[#ff4473] px-6 py-4 rounded-lg text-white text-sm font-semibold hover:bg-[#679bfb] transition disabled:opacity-50"
                      >
                        {isSubmitting ? 'Registering...' : 'Register'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenRegister; 