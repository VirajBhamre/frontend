import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import NavbarProfile from './NavbarProfile';
import { Body } from './Body';

const Dashboard = () => {
    const location = useLocation();
    const isAtDashboardRoot = location.pathname === '/dashboard';

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const toggleSidebar = () => setIsSidebarExpanded((prev) => !prev);

    return (
        <div className="min-h-screen bg-[#d0e1ff]">
            <NavbarProfile toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarExpanded} />
            <div className="pt-[64px] flex">
                <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
                <main className={`ml-16 ${isSidebarExpanded ? 'md:ml-56' : 'md:ml-16'} w-full`}>
                    {isAtDashboardRoot ? <Body /> : <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
