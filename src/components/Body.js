// src/components/Body.js
import React, { useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import PendingEmployers from './SAdmin/PendingEmployers';

export function Body() {
    // Get current user to check if they're an admin
    const currentUser = getCurrentUser();
    
    // Fix the admin check to handle numeric role values
    // Role 1 is Admin in the database
    const isAdmin = currentUser?.Role === 'Admin' || 
                    currentUser?.Role === 'SAdmin' || 
                    currentUser?.Role === 1;
    
    // Debug user role
    useEffect(() => {
        console.log("Current user in Body.js:", currentUser);
        console.log("Is admin user:", isAdmin);
    }, [currentUser, isAdmin]);

    return (
        <div className="m-2 rounded-xl p-6 bg-white shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-600">Total Users</h3>
                    <p className="text-2xl font-bold">243</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-600">Active Projects</h3>
                    <p className="text-2xl font-bold">12</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-600">Tasks</h3>
                    <p className="text-2xl font-bold">56</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-600">Notifications</h3>
                    <p className="text-2xl font-bold">8</p>
                </div>
            </div>
            <p className="text-gray-600 mb-6">
                Welcome to your dashboard! Use the sidebar to navigate through different modules.
            </p>

            {/* Show PendingEmployers component only for admin users */}
            {isAdmin ? (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Pending Employer Requests</h2>
                    <PendingEmployers />
                </div>
            ) : (
                <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                    <p className="text-yellow-700">
                        Admin rights are required to view pending employer requests.
                        Your current role: {typeof currentUser?.Role === 'number' ? currentUser?.Role : currentUser?.Role || 'Not logged in'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default Body;