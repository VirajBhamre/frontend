import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const PendingEmployers = () => {
    const [pendingEmployers, setPendingEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployer, setSelectedEmployer] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("PendingEmployers component mounted");
        fetchPendingEmployers();
    }, []);

    const fetchPendingEmployers = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching pending employers...");
            const response = await api.post('/master/employers/pending', {
                RequestId: `get-pending-employers-${Date.now()}`,
                AuthToken: '',
                Payload: {}
            });

            console.log('Pending employers API response:', response.data);
            
            const success = response.data.Success || response.data.success;
            let data = response.data.Data || response.data.data || [];

            console.log(`Found ${data.length} pending employers before filtering`);

            data = data.filter(emp => {
                if (!emp || !emp.EmpId || !emp.Name || !emp.EmailId || !emp.LogDate) {
                    return false;
                }
                const date = new Date(emp.LogDate);
                if (isNaN(date.getTime())) {
                    return false;
                }
                return true;
            });

            console.log(`Found ${data.length} valid pending employers after filtering`);

            if (success) {
                setPendingEmployers(data);
            } else {
                setError("API returned success: false");
                toast.error('Failed to fetch pending employer requests');
            }
        } catch (error) {
            console.error('Error fetching employers:', error);
            setError(error.message || "Failed to fetch data");
            toast.error('Failed to fetch pending employer requests');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const handleApprove = async (employer) => {
        try {
            const response = await api.post('/master/employers/updateStatus', {
                RequestId: `approve-employer-${Date.now()}`,
                AuthToken: '',
                Payload: {
                    EmpId: employer.EmpId,
                    Status: 'approved'
                }
            });
            
            console.log('Approve employer response:', response.data);
            
            const success = response.data.Success || response.data.success;
            if (success) {
                toast.success('Employer request approved successfully');
                fetchPendingEmployers();
            } else {
                toast.error('Failed to approve employer request');
            }
        } catch (error) {
            console.error('Error approving employer:', error);
            toast.error('Failed to approve employer request');
        }
    };

    const handleRejectClick = (employer) => {
        setSelectedEmployer(employer);
        setRejectionReason('');
        setShowModal(true);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        try {
            const response = await api.post('/master/employers/updateStatus', {
                RequestId: `reject-employer-${Date.now()}`,
                AuthToken: '',
                Payload: {
                    EmpId: selectedEmployer.EmpId,
                    Status: 'rejected',
                    Reason: rejectionReason
                }
            });
            
            console.log('Reject employer response:', response.data);
            
            const success = response.data.Success || response.data.success;
            if (success) {
                toast.success('Employer request rejected successfully');
                setShowModal(false);
                fetchPendingEmployers();
            } else {
                toast.error('Failed to reject employer request');
            }
        } catch (error) {
            console.error('Error rejecting employer:', error);
            toast.error('Failed to reject employer request');
        }
    };

    // Modal for rejection reason
    const RejectModal = () => {
        if (!showModal || !selectedEmployer) return null;
        return (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Reject Employer Request
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div>
                            <p className="mb-2 text-gray-700">
                                Please provide a reason for rejecting <span className="font-semibold">{selectedEmployer.Name}</span>:
                            </p>
                            <textarea
                                className="w-full border rounded p-2 mb-4"
                                rows={3}
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Reason for rejection"
                            />
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Pending Employer Requests</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Review and manage employer registration requests that require approval.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={fetchPendingEmployers}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : pendingEmployers.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            There are no employer registration requests waiting for your approval.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                Company Name
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Mobile
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Email
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Licenses
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Date Requested
                                            </th>
                                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {pendingEmployers.map((employer) => (
                                            <tr key={employer.EmpId}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {employer.Name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {employer.MobileNo}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {employer.EmailId}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {employer.Licenses || 50}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {formatDate(employer.LogDate)}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(employer)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectClick(employer)}
                                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <RejectModal />
        </div>
    );
};

export default PendingEmployers;