// src/components/authPages/Signup.js
import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService'; // Ensure path is correct
import { Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Update Yup messages for fields that should show '* Required' inline
  const validationSchema = Yup.object({
    name: Yup.string().required('* Required'), // Use AuthPage style error
    mobile: Yup.string()
      .matches(/^[6-9]\d{9}$/, 'Invalid mobile number') // Keep descriptive error for specific rules
      .required('* Required'), // Use AuthPage style error
    aadhaar: Yup.string()
      .matches(/^\d{12}$/, 'Invalid Aadhaar number') // Keep descriptive error
      .nullable(), // Aadhaar is optional
    email: Yup.string().email('Invalid email format').required('* Required'), // Use AuthPage style error
    password: Yup.string()
      .min(6, 'Min 6 chars') // Keep descriptive error (shortened)
      .required('* Required'), // Use AuthPage style error
    // DOB and Gender keep their specific short errors for inline display next to static label
    dob: Yup.date()
      .required('*')
      .max(new Date(), "Error")
      .typeError("Error"),
    gender: Yup.string().required('*').oneOf(['Male', 'Female', 'Other'], '*'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    const apiPayload = {
      name: values.name,
      mobileNo: values.mobile,
      aadharNo: values.aadhaar || "",
      emailId: values.email,
      password: values.password,
      dob: values.dob,
      gender: values.gender,
    };

    try {
      await register(apiPayload);
      navigate('/login');
    } catch (err) {
      console.error("Signup component caught error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Floating label class helper (consistent with AuthPage logic)
  const getFloatingLabelClasses = (name, values, touched, errors) => {
    const hasValue = !!values[name];
    const isTouched = !!touched[name];
    const hasError = !!errors[name];
    // Using AuthPage focus logic: focus depends on document.activeElement which might not always be reliable
    // Simplified logic based on value/touch/error is often more robust
    const isActive = typeof document !== 'undefined' && document.activeElement?.id === name;

    let classes = 'absolute left-6 px-1 bg-white rounded text-sm transition-all cursor-text '; // Using left-6 from previous Signup

    // Determine floating state
    if (hasValue || isActive) { // Float up if has value OR is active (focused)
        classes += '-top-2.5 text-xs ';
    } else {
        classes += 'top-3.5 '; // Initial position (matches py-3 padding)
    }

    // Determine color
    if (isTouched && hasError) {
        classes += 'text-red-600'; // Error color
    } else if (isActive || hasValue) { // Use active color if focused OR has value
        classes += 'text-blue-500';
    } else {
        classes += 'text-gray-400'; // Default placeholder color
    }

    return classes;
  };


  return (
    <div className="grid min-h-screen pt-10 lg:grid-cols-2 bg-[#d0e1ff]">
      <div className="relative hidden lg:block bg-[#d0e1ff]">
        <img src="/SquarePng.png" alt="Signup Illustration" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-2 p-6 md:p-10"> {/* Adjusted gap */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-3"> {/* Adjusted space */}
            <div className="text-center">
              <h2 className="text-3xl font-bold">Create an Account</h2>
              <p className="text-sm text-gray-600">Join us and get started today</p>
            </div>
            <Formik
              initialValues={{ name: '', mobile: '', aadhaar: '', email: '', password: '', dob: '', gender: '' }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, touched, errors, isSubmitting }) => ( // Removed setFieldValue if not needed elsewhere
                <Form className="space-y-3"> {/* Adjusted space */}
                  {/* Fields with AuthPage Style (Floating Label + Inline Error Span) */}
                  {[
                    { name: 'name', label: 'Full Name', type: 'text' },
                    { name: 'mobile', label: 'Mobile Number', type: 'tel' },
                    { name: 'aadhaar', label: 'Aadhaar Number', type: 'text' }, // Note: Aadhaar is nullable, won't show '* Required' unless rule changes
                    { name: 'email', label: 'Email Address', type: 'email' },
                  ].map(({ name, label, type = 'text' }) => (
                    <div className="relative" key={name}> {/* No outer div needed */}
                      <Field
                        id={name}
                        name={name}
                        type={type}
                        className={`
                          peer w-full px-6 py-3 pr-16 /* Padding for potential error text */
                          rounded-tl-xl rounded-tr-xl rounded-br-xl
                          bg-white text-gray-800 border ${touched[name] && errors[name] ? 'border-red-500' : 'border-gray-300'} shadow-sm
                          focus:outline-none focus:ring-2 ${touched[name] && errors[name] ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
                          /* Removed placeholder-transparent to match AuthPage implicit style */
                        `}
                         placeholder={label} // Use placeholder for accessibility when label floats
                      />
                      <label
                        htmlFor={name}
                        className={getFloatingLabelClasses(name, values, touched, errors)}
                      >
                        {label}
                      </label>
                       {/* Inline Error Span - AuthPage Style */}
                       {errors[name] && touched[name] && (
                         <span className="absolute right-6 top-1 text-red-600 text-xs">
                           {errors[name]} {/* Display actual Yup error message */}
                         </span>
                       )}
                    </div>
                  ))}

                  {/* Password Field (AuthPage Style) */}
                  <div className="relative">
                      <Field
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`
                          peer w-full px-6 py-3 pr-16 /* Padding for eye + error */
                          rounded-tl-xl rounded-tr-xl rounded-br-xl
                          bg-white text-gray-800 border ${touched.password && errors.password ? 'border-red-500' : 'border-gray-300'} shadow-sm
                          focus:outline-none focus:ring-2 ${touched.password && errors.password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}
                        `}
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute top-1/2 right-4 z-20 transform -translate-y-1/2 text-gray-500 hover:text-blue-500" // z-20 to be above error potentially
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <label
                        htmlFor="password"
                        className={getFloatingLabelClasses('password', values, touched, errors)}
                      >
                        Password
                      </label>
                      {/* Inline Error Span - AuthPage Style, positioned left of eye icon */}
                      {errors.password && touched.password && (
                        <span className="absolute right-12 top-1 text-red-600 text-xs">
                          {errors.password} {/* Display actual Yup error message */}
                        </span>
                      )}
                  </div>

                  {/* DOB + Gender Grid (Static Label + Inline Label Error) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* DOB Field */}
                    <div>
                      <label
                        htmlFor="dob"
                        className={`flex justify-between items-center text-sm font-medium mb-1 ${touched.dob && errors.dob ? 'text-red-600' : 'text-gray-700'}`}
                      >
                        <span>Date of Birth</span>
                        {errors.dob && touched.dob && (
                          <span className="text-xs font-semibold">{errors.dob}</span>
                        )}
                      </label>
                      <Field
                        id="dob"
                        name="dob"
                        type="date"
                        className={`w-full px-4 py-3 rounded-tl-xl rounded-tr-xl rounded-br-xl bg-white text-gray-800 border ${touched.dob && errors.dob ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 ${touched.dob && errors.dob ? 'focus:ring-red-500' : 'focus:ring-blue-500'} ${!values.dob ? 'text-gray-500' : 'text-gray-800'}`}
                      />
                    </div>

                    {/* Gender Field */}
                    <div>
                      <label
                        htmlFor="gender"
                        className={`flex justify-between items-center text-sm font-medium mb-1 ${touched.gender && errors.gender ? 'text-red-600' : 'text-gray-700'}`}
                      >
                         <span>Gender</span>
                         {errors.gender && touched.gender && (
                           <span className="text-xs font-semibold">{errors.gender}</span>
                         )}
                      </label>
                      <div className="relative">
                        <Field
                          as="select"
                          id="gender"
                          name="gender"
                          className={`w-full px-4 py-3 pr-10 appearance-none rounded-tl-xl rounded-tr-xl rounded-br-xl bg-white border ${touched.gender && errors.gender ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:outline-none focus:ring-2 ${touched.gender && errors.gender ? 'focus:ring-red-500' : 'focus:ring-blue-500'} ${!values.gender ? 'text-gray-500' : 'text-gray-800'}`}
                        >
                          <option value="" disabled>Select Gender</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </Field>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" disabled={isSubmitting} className="w-full bg-[#ff4473] px-6 py-4 rounded-tl-xl rounded-tr-xl rounded-br-xl text-white text-sm font-semibold hover:bg-[#679bfb] transition disabled:opacity-50 mt-6">
                    {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </Form>
              )}
            </Formik>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;