import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { registerEmployerRequest, getAllProducts, registerEmployerWithPayment } from '../../services/employerService';
import { toast } from 'react-toastify';
import { X, CreditCard, Check } from 'lucide-react';

const Employer = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [registrationData, setRegistrationData] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("credit-card");
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    
    // Payment form data
    const [paymentFormData, setPaymentFormData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        upiId: '',
    });

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const productsData = await getAllProducts();
            setProducts(productsData);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    const validationSchema = Yup.object().shape({
        Name: Yup.string().required('Company name is required'),
        establishedYear: Yup.number()
            .typeError('Invalid year')
            .required('Year is required')
            .min(1900, 'Too old')
            .max(new Date().getFullYear(), 'Future year not allowed'),
        employeeRange: Yup.string().required('Employee range is required'),
        licenses: Yup.number()
            .typeError('Number of licenses is required')
            .required('Number of licenses is required'),
        ProductId: Yup.number()
            .typeError('Product selection is required')
            .required('Product selection is required'),
        MobileNo: Yup.string()
            .matches(/^[6-9]\d{9}$/, 'Invalid mobile number')
            .required('Mobile number is required'),
        EmailId: Yup.string().email('Invalid email').required('Email is required'),
        AadharNo: Yup.string()
            .matches(/^\d{12}$/, 'Invalid Aadhaar number')
            .required('Aadhaar number is required'),
        Password: Yup.string()
            .min(6, 'Password must be at least 6 characters')
            .required('Password is required'),
        Ticket: Yup.string().required('Ticket is required'),
        isPaying: Yup.boolean()
    });

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setIsLoading(true);
        try {
            setError('');
            // Transform the form data to match the API structure
            const employerData = {
                Name: values.Name,
                CompanyName: values.Name, // Use same value for company name as name
                MobileNo: values.MobileNo,
                EmailId: values.EmailId,
                AadharNo: values.AadharNo,
                Password: values.Password,
                Ticket: values.Ticket,
                ProductId: values.ProductId,
                Licenses: values.licenses // Add the licenses field to the payload
            };
            
            // Find selected product for display in payment modal
            const product = products.find(p => p.ProductId.toString() === values.ProductId.toString());
            setSelectedProduct(product);
            
            // Store registration data for later use
            setRegistrationData(employerData);
            
            // If user wants to pay now, show payment modal
            if (values.isPaying) {
                setShowPaymentModal(true);
            } else {
                // Otherwise submit as pending approval
                await registerEmployerRequest(employerData);
                resetForm();
                toast.success('Registration request submitted! Please wait for admin approval.');
                navigate('/employer/pending');
            }
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
            setSubmitting(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        
        // Validate payment form based on payment method
        if (paymentMethod === 'credit-card') {
            if (!paymentFormData.cardNumber || !paymentFormData.cardName || !paymentFormData.expiryDate || !paymentFormData.cvv) {
                toast.error('Please fill all card details');
                return;
            }
        } else if (paymentMethod === 'upi') {
            if (!paymentFormData.upiId) {
                toast.error('Please enter UPI ID');
                return;
            }
        }
        
        try {
            setIsLoading(true);
            
            // In a real app, this would connect to a payment gateway
            // Here we'll simulate a payment process
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // After payment "succeeds", register employer with approved status
            const paymentInfo = {
                method: paymentMethod,
                amount: selectedProduct?.PricePerUserMonthly || 0,
                status: 'paid'
            };
            
            await registerEmployerWithPayment({...registrationData, paymentInfo});
            
            // Show success message
            setShowPaymentModal(false);
            setShowPaymentSuccess(true);
            
            // Reset payment form
            setPaymentFormData({
                cardNumber: '',
                cardName: '',
                expiryDate: '',
                cvv: '',
                upiId: '',
            });
            
            // After 3 seconds, redirect to dashboard
            setTimeout(() => {
                navigate('/employer/dashboard');
            }, 3000);
            
        } catch (error) {
            toast.error('Payment failed. Please try again.');
            console.error('Payment error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle payment input changes
    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentFormData({
            ...paymentFormData,
            [name]: value
        });
    };

    return (
        <div className="grid min-h-screen pt-10 lg:grid-cols-2 bg-[#d0e1ff]">
            {/* Left Illustration */}
            <div className="relative hidden lg:block">
                <img
                    src="/AuthPage.png"
                    alt="Employer Illustration"
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </div>

            {/* Right Form */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold">Employer Registration</h2>
                            <p className="text-sm text-gray-600">Register your company below</p>
                        </div>

                        {/* View Products Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => setShowProductModal(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 transition"
                            >
                                View Product Details
                            </button>
                        </div>

                        {error && (
                            <div className="text-center text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <Formik
                            initialValues={{
                                Name: '',
                                establishedYear: '',
                                employeeRange: '',
                                licenses: '',
                                ProductId: '',
                                MobileNo: '',
                                EmailId: '',
                                AadharNo: '',
                                Password: '',
                                Ticket: '',
                                isPaying: false
                            }}
                            validationSchema={validationSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
                                <Form className="space-y-3">
                                    {/* Regular Input Fields */}
                                    {[
                                        { name: 'Name', label: 'Company Name', type: 'text' },
                                        { name: 'establishedYear', label: 'Year Established', type: 'number' },
                                        { name: 'MobileNo', label: 'Mobile Number', type: 'text' },
                                        { name: 'EmailId', label: 'Email Address', type: 'email' },
                                        { name: 'AadharNo', label: 'Aadhaar Number', type: 'text' },
                                        { name: 'Password', label: 'Password', type: 'password' },
                                        { name: 'Ticket', label: 'Ticket ID', type: 'text' },
                                    ].map(({ name, label, type }) => (
                                        <div key={name} className="relative">
                                            <Field
                                                id={name}
                                                name={name}
                                                type={type}
                                                placeholder={label}
                                                className={`
                          w-full px-6 py-3 pr-14 
                          rounded-tl-xl rounded-tr-xl rounded-br-xl
                          bg-white text-gray-800 shadow-sm border border-gray-300
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                        `}
                                            />
                                            {errors[name] && touched[name] && (
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-600 text-xs">
                                                    * {errors[name]}
                                                </span>
                                            )}
                                        </div>
                                    ))}

                                    {/* Employee Range Dropdown */}
                                    <div className="relative">
                                        <Field
                                            as="select"
                                            name="employeeRange"
                                            className={`
                        w-full px-6 py-3
                        rounded-tl-xl rounded-tr-xl rounded-br-xl
                        bg-white text-gray-800 shadow-sm border border-gray-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                                        >
                                            <option value="">Select Employee Range</option>
                                            <option value="1-50">1 - 50</option>
                                            <option value="51-200">51 - 200</option>
                                            <option value="201-500">201 - 500</option>
                                            <option value="501+">501+</option>
                                        </Field>
                                        {errors.employeeRange && touched.employeeRange && (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-600 text-xs">
                                                * {errors.employeeRange}
                                            </span>
                                        )}
                                    </div>

                                    {/* Licenses Dropdown */}
                                    <div className="relative">
                                        <Field
                                            as="select"
                                            name="licenses"
                                            className={`
                        w-full px-6 py-3
                        rounded-tl-xl rounded-tr-xl rounded-br-xl
                        bg-white text-gray-800 shadow-sm border border-gray-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                                        >
                                            <option value="">Select Number of Licenses</option>
                                            <option value="50">50 Licenses</option>
                                            <option value="100">100 Licenses</option>
                                            <option value="200">200 Licenses</option>
                                            <option value="300">300 Licenses</option>
                                            <option value="500">500 Licenses</option>
                                        </Field>
                                        {errors.licenses && touched.licenses && (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-600 text-xs">
                                                * {errors.licenses}
                                            </span>
                                        )}
                                    </div>

                                    {/* Product Dropdown */}
                                    <div className="relative">
                                        <Field
                                            as="select"
                                            name="ProductId"
                                            className={`
                        w-full px-6 py-3
                        rounded-tl-xl rounded-tr-xl rounded-br-xl
                        bg-white text-gray-800 shadow-sm border border-gray-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                                        >
                                            <option value="">Select Product</option>
                                            {products.map(product => (
                                                <option key={product.ProductId} value={product.ProductId}>
                                                    {product.Name}
                                                </option>
                                            ))}
                                        </Field>
                                        {errors.ProductId && touched.ProductId && (
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-red-600 text-xs">
                                                * {errors.ProductId}
                                            </span>
                                        )}
                                    </div>

                                    {/* Payment Option */}
                                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                                        <div className="flex items-center mb-2">
                                            <Field
                                                type="checkbox"
                                                name="isPaying"
                                                id="isPaying"
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="isPaying" className="ml-2 text-sm font-medium text-gray-900">
                                                Pay now and get instant approval
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {values.isPaying 
                                                ? "Your account will be approved instantly after payment"
                                                : "Your account will require admin approval if you don't pay now"}
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isLoading}
                                        className="w-full bg-[#ff4473] px-6 py-3 rounded-tl-xl rounded-tr-xl rounded-br-xl text-white text-sm font-semibold hover:bg-[#679bfb] transition disabled:opacity-50"
                                    >
                                        {isSubmitting || isLoading ? 'Submitting...' : values.isPaying ? 'Continue to Payment' : 'Submit'}
                                    </button>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>

            {/* Products Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">Products Information</h3>
                                <button
                                    onClick={() => setShowProductModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {products.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">Loading products or no products available...</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-3">Product Name</th>
                                                <th className="px-6 py-3">Description</th>
                                                <th className="px-6 py-3">Price Per User (Monthly)</th>
                                                <th className="px-6 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(product => (
                                                <tr key={product.ProductId} className="border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium">{product.Name}</td>
                                                    <td className="px-6 py-4">{product.Description}</td>
                                                    <td className="px-6 py-4">₹{product.PricePerUserMonthly}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                            {product.IsActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={() => setShowProductModal(false)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">Complete Payment</h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <h4 className="font-medium text-sm text-gray-700">Order Summary</h4>
                                    <div className="mt-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Product:</span>
                                            <span className="font-medium">{selectedProduct?.Name}</span>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-gray-600">Price:</span>
                                            <span className="font-medium">₹{selectedProduct?.PricePerUserMonthly}/user/month</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex space-x-4 mb-4">
                                        <button
                                            type="button"
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${paymentMethod === 'credit-card' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                                            onClick={() => setPaymentMethod('credit-card')}
                                        >
                                            <CreditCard size={16} />
                                            <span>Card</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${paymentMethod === 'upi' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                                            onClick={() => setPaymentMethod('upi')}
                                        >
                                            <span className="font-bold">UPI</span>
                                            <span>Pay</span>
                                        </button>
                                    </div>
                                    
                                    <form onSubmit={handlePaymentSubmit}>
                                        {paymentMethod === 'credit-card' ? (
                                            <>
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                                                    <input
                                                        type="text"
                                                        name="cardNumber"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={paymentFormData.cardNumber}
                                                        onChange={handlePaymentInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                        maxLength={19}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                                                    <input
                                                        type="text"
                                                        name="cardName"
                                                        placeholder="John Doe"
                                                        value={paymentFormData.cardName}
                                                        onChange={handlePaymentInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                        <input
                                                            type="text"
                                                            name="expiryDate"
                                                            placeholder="MM/YY"
                                                            value={paymentFormData.expiryDate}
                                                            onChange={handlePaymentInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                            maxLength={5}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                                                        <input
                                                            type="text"
                                                            name="cvv"
                                                            placeholder="123"
                                                            value={paymentFormData.cvv}
                                                            onChange={handlePaymentInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                            maxLength={3}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                                                <input
                                                    type="text"
                                                    name="upiId"
                                                    placeholder="name@upi"
                                                    value={paymentFormData.upiId}
                                                    onChange={handlePaymentInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        )}
                                        
                                        <div className="mt-6">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-[#ff4473] py-2 px-4 rounded-md text-white font-medium hover:bg-[#e03b65] transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Processing...' : `Pay ₹${selectedProduct?.PricePerUserMonthly || 0}`}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                
                                <p className="text-xs text-gray-500 text-center">
                                    This is a demo payment form. No actual payment will be processed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Success Modal */}
            {showPaymentSuccess && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                        <p className="text-gray-600 mb-6">
                            Your payment has been processed successfully and your account has been activated. You will be redirected to your dashboard shortly.
                        </p>
                        <div className="animate-pulse">
                            <span className="text-sm text-gray-500">Redirecting to dashboard...</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employer;