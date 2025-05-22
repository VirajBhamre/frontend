// src/components/authPages/ChangePassword.js
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { changePassword } from '../../services/authService';
import { X } from 'lucide-react';

const ChangePassword = ({ onClose }) => {
  const [status, setStatus] = useState({ loading: false, error: null });

  const initial = { currentPassword: '', newPassword: '', confirmPassword: '' };

  const schema = Yup.object({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .min(6, 'New password must be at least 6 characters')
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const submit = async (vals, { resetForm }) => {
    setStatus({ loading: true, error: null });
    try {
      await changePassword(vals);
      resetForm();
      onClose();
    } catch (e) {
      setStatus({ loading: false, error: e.message });
    } finally {
      setStatus((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/10 flex items-center justify-center px-2 sm:px-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-white border border-slate-200 rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold text-center">Change Password</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Update your account password securely
        </p>

        <Formik
          initialValues={initial}
          validationSchema={schema}
          onSubmit={submit}
        >
          {() => (
            <Form className="space-y-4">
              {[
                ['currentPassword', 'Current Password'],
                ['newPassword', 'New Password'],
                ['confirmPassword', 'Confirm New Password'],
              ].map(([name, ph]) => (
                <div key={name}>
                  <Field
                    name={name}
                    type="password"
                    placeholder={ph}
                    className="w-full px-5 py-3 text-sm border rounded-tl-lg rounded-tr-lg rounded-br-lg border-gray-300 focus:ring-2 focus:ring-[#ff4473] focus:outline-none placeholder:text-gray-400"
                  />
                  <ErrorMessage
                    name={name}
                    component="div"
                    className="text-xs text-red-500 mt-1"
                  />
                </div>
              ))}

              {status.error && (
                <div className="text-center text-sm text-red-600">
                  {status.error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-5 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-tl-lg rounded-tr-lg rounded-br-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="flex-1 px-5 py-3 text-sm font-semibold text-white bg-[#ff4473] rounded-tl-lg rounded-tr-lg rounded-br-lg hover:bg-[#e03b65] disabled:opacity-50 transition"
                >
                  {status.loading ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ChangePassword;
