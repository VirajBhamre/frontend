import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Clipboard, Users, ShieldAlert, UserCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const UsageSummary = ({ employerId, totalLicenses: propTotalLicenses, usedLicenses }) => {
  const [stats, setStats] = useState({
    subAdmins: 0,
    supervisors: 0,
    agents: 0
  });
  const [loading, setLoading] = useState(true);
  const [totalLicenses, setTotalLicenses] = useState(propTotalLicenses || 0);

  useEffect(() => {
    if (employerId) {
      fetchStats();
    }
  }, [employerId]);

  // If the prop changes, update our state
  useEffect(() => {
    if (propTotalLicenses !== undefined && propTotalLicenses !== null) {
      setTotalLicenses(propTotalLicenses);
    }
  }, [propTotalLicenses]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // If employerId is not provided, try to get it from the user object
      const empId = employerId || user.UserId;
      
      if (!empId) {
        toast.error('Employer ID not found');
        setLoading(false);
        return;
      }

      console.log('Fetching role stats for employer:', empId);
      
      // Use empId as a number if possible to avoid type issues
      const empIdNumber = parseInt(empId);
      const empIdToUse = !isNaN(empIdNumber) ? empIdNumber : empId;
      
      // Structure the payload exactly as expected by the backend
      const response = await api.post('/employers/role-stats', {
        RequestId: `get-role-stats-${Date.now()}`,
        AuthToken: token,
        Payload: { 
          empId: empIdToUse 
        }
      });

      console.log('Role Stats API Response:', response.data);

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data || {};

      if (success) {
        const statsData = {
          subAdmins: data.subAdmins || 0,
          supervisors: data.supervisors || 0,
          agents: data.agents || 0
        };
        
        // Update total licenses if available from API, ensure it's treated as a number
        if (data.totalLicenses !== undefined && data.totalLicenses !== null) {
          const licenseValue = parseInt(data.totalLicenses);
          if (!isNaN(licenseValue)) {
            console.log('Setting total licenses from API:', licenseValue);
            setTotalLicenses(licenseValue);
          } else {
            console.warn('Invalid license value from API:', data.totalLicenses);
            setTotalLicenses(propTotalLicenses || 50);
          }
        } else {
          console.log('No license data in API response, using prop value:', propTotalLicenses);
          setTotalLicenses(propTotalLicenses || 50);
        }
        
        setStats(statsData);
        console.log('Role stats loaded:', statsData);
      } else {
        console.error('Failed to fetch role stats:', response.data);
        toast.error('Failed to fetch role statistics');
        // Even if API call fails, ensure we have correct licensing data
        if (propTotalLicenses) {
          setTotalLicenses(propTotalLicenses);
        }
      }
    } catch (error) {
      console.error('Error fetching role stats:', error);
      toast.error('Failed to fetch role statistics: ' + (error.message || 'Unknown error'));
      // Even if API call fails, ensure we have correct licensing data
      if (propTotalLicenses) {
        setTotalLicenses(propTotalLicenses);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback to default values if not provided
  const actualTotalLicenses = totalLicenses || 0;
  
  // Calculate total used licenses
  const actualUsedLicenses = stats.subAdmins + stats.supervisors + stats.agents;
  const availableLicenses = actualTotalLicenses - actualUsedLicenses;

  // Chart data for license allocation
  const licenseData = [
    { name: 'Available', value: availableLicenses > 0 ? availableLicenses : 0, color: '#4ade80' },
    { name: 'Sub-Admins', value: stats.subAdmins, color: '#f97316' },
    { name: 'Supervisors', value: stats.supervisors, color: '#3b82f6' },
    { name: 'Agents', value: stats.agents, color: '#8b5cf6' }
  ];

  // Role distribution data
  const roleData = [
    { name: 'Sub-Admins', value: stats.subAdmins, color: '#f97316' },
    { name: 'Supervisors', value: stats.supervisors, color: '#3b82f6' },
    { name: 'Agents', value: stats.agents, color: '#8b5cf6' }
  ].filter(item => item.value > 0);

  // Calculate the percentage of used licenses
  const usagePercentage = actualTotalLicenses > 0 
    ? Math.round((actualUsedLicenses / actualTotalLicenses) * 100) 
    : 0;

  const getColorClass = (percentage) => {
    if (percentage < 60) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusWidget = (type, count, icon, bgColor) => {
    const Icon = icon;
    return (
      <div className={`${bgColor} rounded-lg shadow p-4 flex items-center justify-between`}>
        <div>
          <p className="text-sm font-medium text-white opacity-80">{type}</p>
          <p className="text-2xl font-bold text-white mt-1">{count}</p>
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-full">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">License Usage Summary</h2>
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* License usage overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {getStatusWidget('Sub-Admins', stats.subAdmins, ShieldAlert, 'bg-orange-500')}
            {getStatusWidget('Supervisors', stats.supervisors, Users, 'bg-blue-500')}
            {getStatusWidget('Agents', stats.agents, UserCircle, 'bg-purple-500')}
            {getStatusWidget('Total Used', actualUsedLicenses, Clipboard, 'bg-gray-700')}
          </div>

          {/* Main summary card */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* License usage meter */}
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium text-gray-700 mb-4">License Usage</h3>
                <div className="relative mb-4">
                  <div className="w-36 h-36 rounded-full flex items-center justify-center border-8 border-gray-200">
                    <div className={`text-3xl font-bold ${getColorClass(usagePercentage)}`}>
                      {usagePercentage}%
                    </div>
                  </div>
                  <svg className="absolute inset-0" width="150" height="150" viewBox="0 0 150 150">
                    <circle 
                      cx="75" 
                      cy="75" 
                      r="60" 
                      fill="none" 
                      stroke="#e5e7eb" 
                      strokeWidth="16" 
                    />
                    <circle 
                      cx="75" 
                      cy="75" 
                      r="60" 
                      fill="none" 
                      stroke={usagePercentage < 60 ? "#4ade80" : usagePercentage < 80 ? "#facc15" : "#ef4444"} 
                      strokeWidth="16" 
                      strokeDasharray={`${usagePercentage * 3.77} 377`} 
                      strokeDashoffset="0" 
                      transform="rotate(-90 75 75)" 
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 mb-1">
                    {actualUsedLicenses} of {actualTotalLicenses} licenses used
                  </p>
                  <p className="text-sm text-gray-400">
                    {availableLicenses} licenses available
                  </p>
                </div>
              </div>

              {/* License distribution chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">License Distribution</h3>
                {actualUsedLicenses > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={licenseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {licenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} licenses`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48">
                    <p className="text-gray-500">No licenses have been assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start by creating sub-admins, supervisors, or agents
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Licenses</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Each Sub-Admin, Supervisor, and Agent consumes one license. Your total available licenses are determined by your subscription plan.
                    {usagePercentage > 80 && (
                      <span className="block mt-2 font-medium">
                        ⚠️ You are approaching your license limit. Consider upgrading your plan for more licenses.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsageSummary;