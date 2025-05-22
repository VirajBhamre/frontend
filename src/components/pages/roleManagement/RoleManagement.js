import React, { useState, useEffect } from 'react';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Users, UserCog, ShieldAlert, PieChart, User } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import SubAdminsManagement from './SubAdminsManagement';
import SupervisorsManagement from './SupervisorsManagement';
import AgentsManagement from './AgentsManagement';
import UsageSummary from './UsageSummary';

const RoleManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployerData();
  }, []);

  const fetchEmployerData = async () => {
    setLoading(true);
    try {
      const empId = localStorage.getItem('empId');
      if (!empId) {
        toast.error('Employer ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await api.post('/employers/profile', {
        RequestId: `get-employer-profile-${Date.now()}`,
        AuthToken: localStorage.getItem('token') || '',
        Payload: { empId }
      });

      const success = response.data.success || response.data.Success;
      const data = response.data.data || response.data.Data;

      if (success && data) {
        setEmployerData(data);
      } else {
        toast.error('Failed to load employer profile');
      }
    } catch (error) {
      console.error('Error fetching employer data:', error);
      toast.error('Failed to load employer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  // Custom tab component to add icons
  const CustomTab = ({ children, icon: Icon, ...props }) => {
    return (
      <Tab {...props}>
        <div className="flex items-center space-x-2 py-1">
          {Icon && <Icon size={18} />}
          <span>{children}</span>
        </div>
      </Tab>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!employerData) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Employer Profile Not Found</h2>
        <p className="text-gray-600 mb-6">
          Unable to load your employer profile. Please try logging in again.
        </p>
        <button
          onClick={fetchEmployerData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Get total and used licenses from the employer data
  const totalLicenses = employerData.TotalLicenses || 10; // Default to 10 if not set
  const usedLicenses = employerData.UsedLicenses || 0;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
          <p className="text-gray-600 mt-1">
            Manage sub-admins, supervisors, and agents for your organization
          </p>
        </div>
      </div>

      <Tabs 
        selectedIndex={activeTab} 
        onSelect={handleTabChange}
        className="bg-white shadow-md rounded-lg overflow-hidden"
      >
        <TabList className="bg-gray-50 border-b border-gray-200 px-4 flex space-x-4">
          <CustomTab 
            icon={PieChart}
            className="react-tabs__tab py-4 px-2 text-gray-600 cursor-pointer focus:outline-none"
            selectedClassName="react-tabs__tab--selected text-blue-500 border-b-2 border-blue-500"
          >
            Usage Summary
          </CustomTab>
          <CustomTab 
            icon={ShieldAlert}
            className="react-tabs__tab py-4 px-2 text-gray-600 cursor-pointer focus:outline-none"
            selectedClassName="react-tabs__tab--selected text-blue-500 border-b-2 border-blue-500"
          >
            Sub-Admins
          </CustomTab>
          <CustomTab 
            icon={UserCog}
            className="react-tabs__tab py-4 px-2 text-gray-600 cursor-pointer focus:outline-none"
            selectedClassName="react-tabs__tab--selected text-blue-500 border-b-2 border-blue-500"
          >
            Supervisors
          </CustomTab>
          <CustomTab 
            icon={User}
            className="react-tabs__tab py-4 px-2 text-gray-600 cursor-pointer focus:outline-none"
            selectedClassName="react-tabs__tab--selected text-blue-500 border-b-2 border-blue-500"
          >
            Agents
          </CustomTab>
        </TabList>

        <div className="p-4">
          <TabPanel>
            <UsageSummary 
              employerId={localStorage.getItem('empId')}
              totalLicenses={totalLicenses}
              usedLicenses={usedLicenses}
            />
          </TabPanel>
          
          <TabPanel>
            <SubAdminsManagement employerId={localStorage.getItem('empId')} />
          </TabPanel>
          
          <TabPanel>
            <SupervisorsManagement employerId={localStorage.getItem('empId')} />
          </TabPanel>
          
          <TabPanel>
            <AgentsManagement employerId={localStorage.getItem('empId')} />
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
};

export default RoleManagement;