import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ComplaintForm = ({ citizenData, onClose, onSubmitSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch departments and regions when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch departments
        const deptResponse = await api.post('/employers/supervisors/departments', {
          RequestId: `get-departments-${Date.now()}`,
          AuthToken: localStorage.getItem('token') || '',
          Payload: {}
        });

        const deptSuccess = deptResponse.data.success || deptResponse.data.Success;
        const deptData = deptResponse.data.data || deptResponse.data.Data || [];

        if (deptSuccess && Array.isArray(deptData)) {
          setDepartments(deptData);
        } else {
          console.error('Failed to fetch departments:', deptResponse.data);
          toast.error('Failed to load departments');
        }
        
        // Fetch regions
        const regionResponse = await api.post('/employers/regions', {
          RequestId: `get-regions-${Date.now()}`,
          AuthToken: localStorage.getItem('token') || '',
          Payload: {}
        });

        const regionSuccess = regionResponse.data.success || regionResponse.data.Success;
        const regionData = regionResponse.data.data || regionResponse.data.Data || [];

        if (regionSuccess && Array.isArray(regionData)) {
          // If the response is an array of objects with Region property
          if (regionData.length > 0 && regionData[0].Region) {
            setRegions(regionData);
          } else if (regionData.length > 0) {
            // If it's just an array of strings
            setRegions(regionData.map(region => ({ Region: region })));
          } else {
            // Default regions if none are returned
            setRegions([
              { Region: 'East' },
              { Region: 'West' },
              { Region: 'North' },
              { Region: 'South' }
            ]);
          }
        } else {
          console.error('Failed to fetch regions:', regionResponse.data);
          // Set default regions
          setRegions([
            { Region: 'East' },
            { Region: 'West' },
            { Region: 'North' },
            { Region: 'South' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading form data');
        
        // Set default regions in case of error
        setRegions([
          { Region: 'East' },
          { Region: 'West' },
          { Region: 'North' },
          { Region: 'South' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Validation schema
  const validationSchema = Yup.object({
    complaintType: Yup.string().required('Required'),
    department: Yup.string().required('Required'),
    region: Yup.string().required('Region is required'),
    subDepartment: Yup.string().required('Required'),
    complaintCategory: Yup.string().required('Required'),
    complaintDistrict: Yup.string().required('Required'),
    complaintVillageCity: Yup.string().required('Required'),
    complaintVillage: Yup.string().required('Required'),
    description: Yup.string()
      .required('Required')
      .min(50, 'Must be at least 50 characters'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const complaintData = {
        citizenId: citizenData.CitizenId,
        mobileNo: citizenData.MobileNo,
        name: citizenData.Name,
        nickname: citizenData.Nickname,
        otherMobileNos: citizenData.OtherMobileNos || '',
        compositeId: citizenData.CompositeId || '',
        emailId: citizenData.EmailId || '',
        isServiceman: citizenData.IsServiceman || false,
        gender: citizenData.Gender || '',
        residentDistrict: citizenData.District || values.residentDistrict,
        residentBlock: citizenData.Block || values.residentBlock,
        residentVillage: citizenData.Village || values.residentVillage,
        address: citizenData.Address || values.address,
        ...values,
      };

      const response = await api.post('/complaints/submit', {
        RequestId: `submit-complaint-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: complaintData,
      });

      const success = response.data.success || response.data.Success;
      const message = response.data.message || response.data.Message;

      if (success) {
        toast.success(message || 'Complaint submitted successfully');
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        toast.error(message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      toast.error(error.response?.data?.message || 'Error submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">File a New Complaint</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Formik
              initialValues={{
                complaintType: '',
                department: '',
                region: '',
                subDepartment: '',
                complaintCategory: '',
                complaintDistrict: '',
                complaintVillageCity: '',
                complaintVillage: '',
                description: '',
                residentDistrict: citizenData.District || '',
                residentBlock: citizenData.Block || '',
                residentVillage: citizenData.Village || '',
                address: citizenData.Address || '',
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-6">
                  {/* Personal Details - Read-only */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <div className="p-2 border border-gray-300 rounded-md bg-gray-100">{citizenData.Name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <div className="p-2 border border-gray-300 rounded-md bg-gray-100">{citizenData.MobileNo}</div>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Type and Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="complaintType" className="block text-sm font-medium text-gray-700 mb-1">
                        Complaint Type*
                      </label>
                      <Field
                        as="select"
                        id="complaintType"
                        name="complaintType"
                        className={`w-full p-2 border ${
                          touched.complaintType && errors.complaintType ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      >
                        <option value="">Select Type</option>
                        <option value="Urban">Urban</option>
                        <option value="Rural">Rural</option>
                      </Field>
                      <ErrorMessage name="complaintType" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                        Department*
                      </label>
                      <Field
                        as="select"
                        id="department"
                        name="department"
                        className={`w-full p-2 border ${
                          touched.department && errors.department ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept.Department}>
                            {dept.Department}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="department" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  {/* Region and Sub Department */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                        Region*
                      </label>
                      <Field
                        as="select"
                        id="region"
                        name="region"
                        className={`w-full p-2 border ${
                          touched.region && errors.region ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region, index) => (
                          <option key={index} value={region.Region}>
                            {region.Region}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="region" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label htmlFor="subDepartment" className="block text-sm font-medium text-gray-700 mb-1">
                        Sub Department*
                      </label>
                      <Field
                        type="text"
                        id="subDepartment"
                        name="subDepartment"
                        className={`w-full p-2 border ${
                          touched.subDepartment && errors.subDepartment ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      />
                      <ErrorMessage name="subDepartment" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  {/* Complaint Category */}
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="complaintCategory" className="block text-sm font-medium text-gray-700 mb-1">
                        Complaint Category*
                      </label>
                      <Field
                        type="text"
                        id="complaintCategory"
                        name="complaintCategory"
                        className={`w-full p-2 border ${
                          touched.complaintCategory && errors.complaintCategory ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      />
                      <ErrorMessage name="complaintCategory" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="complaintDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                        District*
                      </label>
                      <Field
                        type="text"
                        id="complaintDistrict"
                        name="complaintDistrict"
                        className={`w-full p-2 border ${
                          touched.complaintDistrict && errors.complaintDistrict ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      />
                      <ErrorMessage name="complaintDistrict" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label htmlFor="complaintVillageCity" className="block text-sm font-medium text-gray-700 mb-1">
                        Village Panchayat / City*
                      </label>
                      <Field
                        type="text"
                        id="complaintVillageCity"
                        name="complaintVillageCity"
                        className={`w-full p-2 border ${
                          touched.complaintVillageCity && errors.complaintVillageCity ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      />
                      <ErrorMessage name="complaintVillageCity" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label htmlFor="complaintVillage" className="block text-sm font-medium text-gray-700 mb-1">
                        Village*
                      </label>
                      <Field
                        type="text"
                        id="complaintVillage"
                        name="complaintVillage"
                        className={`w-full p-2 border ${
                          touched.complaintVillage && errors.complaintVillage ? 'border-red-500' : 'border-gray-300'
                        } rounded-md`}
                      />
                      <ErrorMessage name="complaintVillage" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description*
                    </label>
                    <Field
                      as="textarea"
                      id="description"
                      name="description"
                      rows="5"
                      placeholder="Enter complaint description (at least 50 characters)"
                      className={`w-full p-2 border ${
                        touched.description && errors.description ? 'border-red-500' : 'border-gray-300'
                      } rounded-md`}
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                    <div className="text-sm text-gray-500 mt-1">200 words are mandatory in complaint details!</div>
                  </div>

                  {/* Address fields - optional if needed */}
                  {(!citizenData.District || !citizenData.Block || !citizenData.Village || !citizenData.Address) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Residence Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!citizenData.District && (
                          <div>
                            <label htmlFor="residentDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                              District of Residence*
                            </label>
                            <Field
                              type="text"
                              id="residentDistrict"
                              name="residentDistrict"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        )}
                        {!citizenData.Block && (
                          <div>
                            <label htmlFor="residentBlock" className="block text-sm font-medium text-gray-700 mb-1">
                              Inhabit Block*
                            </label>
                            <Field
                              type="text"
                              id="residentBlock"
                              name="residentBlock"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        )}
                        {!citizenData.Village && (
                          <div>
                            <label htmlFor="residentVillage" className="block text-sm font-medium text-gray-700 mb-1">
                              Resident Village/City*
                            </label>
                            <Field
                              type="text"
                              id="residentVillage"
                              name="residentVillage"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        )}
                        {!citizenData.Address && (
                          <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                              Address*
                            </label>
                            <Field
                              as="textarea"
                              id="address"
                              name="address"
                              rows="2"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-[#ff4473] text-white rounded-md hover:bg-[#679bfb] disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm; 