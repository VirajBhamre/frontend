import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';
import { getAllProducts } from '../../services/employerService';
import { getEmployerStatus, logout } from '../../services/authService';
import { toast } from 'react-toastify';

const EmployerPending = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('pending');
    const [reason, setReason] = useState('');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Handle logout function
    const handleLogout = () => {
        // Call the logout function from authService
        logout();
        // Navigate to login page - we don't need to check for superadmin here as employers won't be superadmins
        navigate('/login');
    };

    useEffect(() => {
        // Get current user from localStorage
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser || currentUser.Role !== 'Employer') {
            navigate('/login');
            return;
        }
        setUser(currentUser);

        // Fetch employer status and products
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch products to display
                const productsData = await getAllProducts();
                setProducts(productsData);

                // If the status is in the user object from login, use that
                if (currentUser.Status) {
                    setStatus(currentUser.Status);
                    setReason(currentUser.RejectionReason || '');
                } else {
                    // Otherwise fetch the latest status
                    const statusResponse = await getEmployerStatus(currentUser.UserId);
                    if (statusResponse.success) {
                        setStatus(statusResponse.data.Status);
                        setReason(statusResponse.data.RejectionReason || '');
                        
                        // If approved, redirect to dashboard
                        if (statusResponse.data.Status === 'approved') {
                            navigate('/employer/dashboard');
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Set up polling to check status every minute
        const intervalId = setInterval(async () => {
            try {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser && currentUser.Role === 'Employer') {
                    const statusResponse = await getEmployerStatus(currentUser.UserId);
                    if (statusResponse.success) {
                        setStatus(statusResponse.data.Status);
                        setReason(statusResponse.data.RejectionReason || '');
                        
                        // If approved, redirect to dashboard
                        if (statusResponse.data.Status === 'approved') {
                            clearInterval(intervalId);
                            navigate('/employer/dashboard');
                        }
                    }
                }
            } catch (error) {
                console.error('Error polling status:', error);
            }
        }, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, [navigate]);

    // Status badge component
    const StatusBadge = () => {
        if (status === 'pending') {
            return (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                    <Clock size={18} />
                    <span>Pending Review</span>
                </div>
            );
        } else if (status === 'approved') {
            return (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <CheckCircle size={18} />
                    <span>Approved</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full">
                    <XCircle size={18} />
                    <span>Rejected</span>
                </div>
            );
        }
    };

    // Status message component
    const StatusMessage = () => {
        if (status === 'pending') {
            return (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Registration Pending</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    Your registration is currently under review by our administrators. This typically takes 1-2 business days.
                                    You'll receive full access to the system once your registration is approved.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else if (status === 'approved') {
            return (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Registration Approved</h3>
                            <div className="mt-2 text-sm text-green-700">
                                <p>
                                    Your registration has been approved! You now have full access to the dashboard.
                                    <button 
                                        onClick={() => navigate('/employer/dashboard')}
                                        className="ml-2 text-green-800 font-medium hover:underline flex items-center"
                                    >
                                        Go to Dashboard <ArrowRight size={14} className="ml-1" />
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Registration Rejected</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    We're sorry, but your registration request has been rejected.
                                    {reason && (
                                        <span className="block mt-1 font-medium">Reason: {reason}</span>
                                    )}
                                </p>
                                <p className="mt-2">
                                    Please contact our support team at support@wewinerp.com for assistance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/WeWinLogo.png" alt="WeWin ERP" className="h-8" />
                        <h1 className="ml-3 text-xl font-semibold text-gray-900">Employer Portal</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <StatusBadge />
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} className="mr-1" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium mb-4">Welcome, {user?.Name || 'Employer'}</h2>
                    
                    <StatusMessage />

                    <div className="mt-8">
                        <h3 className="text-lg font-medium mb-4">Available Products</h3>
                        
                        {products.length === 0 ? (
                            <p className="text-gray-500">No products available at the moment.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <div key={product.ProductId} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                                        <div className="p-4 border-b bg-gray-50">
                                            <h4 className="text-md font-semibold">{product.Name}</h4>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-gray-600 mb-4">{product.Description}</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-900">₹{product.PricePerUserMonthly}/user/month</span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {product.IsActive ? 'Available' : 'Unavailable'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-sm text-gray-500 text-center">
                        &copy; {new Date().getFullYear()} WeWin ERP. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default EmployerPending;