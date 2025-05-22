import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Menu as MenuIcon,
    X,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Settings,
    LogOut,
    CircleUserRound
} from "lucide-react";
import { logout, getCurrentUser, getDashboardUrlByRole } from "../services/authService";
import { clearAuthCookies } from "../utils/cookieUtils";
import { toast } from "react-toastify";

const AUTO_CLOSE_DELAY = 500;

export default function NavbarProfile({
    userType,
    name,
    image = "",
    toggleSidebar,
    isSidebarOpen,
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const closeTimer = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get user information from auth service if not provided via props
    const currentUser = getCurrentUser();
    
    // Use props if provided, otherwise use current user data
    const displayName = name || currentUser?.Name || "User";
    const displayUserType = userType || currentUser?.Role || "User";
    
    // Determine dashboard base route based on user role
    const dashboardBaseRoute = currentUser ? getDashboardUrlByRole(currentUser).split('/')[1] : 'dashboard';

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    useEffect(() => {
        return () => clearTimeout(closeTimer.current);
    }, []);

    const openDropdown = () => {
        clearTimeout(closeTimer.current);
        setIsDropdownOpen(true);
    };
    const scheduleClose = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            setIsDropdownOpen(false);
        }, AUTO_CLOSE_DELAY);
    };

    const handleLogout = async () => {
        try {
            // Call the backend logout endpoint
            await logout();
            
            // Clear authentication cookies
            clearAuthCookies();
            
            toast.success("Logged out successfully");
            
            // Check if the user is a superadmin and redirect to admin portal instead
            if (currentUser?.Role === 'SAdmin') {
                navigate("/admin-portal", { replace: true });
            } else {
                navigate("/login", { replace: true });
            }
        } catch {
            toast.error("Logout failed");
        }
    };

    const goToSettings = () => {
        setIsDropdownOpen(false);
        navigate("/settings");
    };
    
    // Get appropriate link paths based on user role
    const getLinkPaths = () => {
        switch (displayUserType) {
            case 'Employer':
                return {
                    suggestions: '/employer/dashboard/suggestions',
                    information: '/employer/dashboard/information'
                };
            case 'SubAdmin':
                return {
                    suggestions: '/subadmin/dashboard/suggestions',
                    information: '/subadmin/dashboard/information'
                };
            case 'Supervisor':
                return {
                    suggestions: '/supervisor/dashboard/suggestions',
                    information: '/supervisor/dashboard/information'
                };
            case 'Agent':
                return {
                    suggestions: '/agent/dashboard/suggestions',
                    information: '/agent/dashboard/information'
                };
            default:
                return {
                    suggestions: '/dashboard/suggestions',
                    information: '/dashboard/information'
                };
        }
    };
    
    const links = getLinkPaths();

    return (
        <nav className="fixed top-0 left-0 w-full bg-white border-b border-slate-300 z-50">
            <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3 md:px-6">
                {/* Logo & Sidebar Toggle */}
                <div className="flex items-center space-x-20">
                    <Link to={`/${dashboardBaseRoute}/dashboard`}>
                        <img src="/WeWinLogo.png" alt="WeWin Logo" className="h-10 w-auto" />
                    </Link>
                    {toggleSidebar && (
                        <button
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                            className="p-2 rounded-full bg-[#d0e1ff] hover:bg-slate-200 transition"
                        >
                            {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    )}
                </div>

                {/* Desktop Links & Profile */}
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-700">
                    <span className="text-gray-600">{today}</span>
                    
                    {/* Only show these links for appropriate roles */}
                    {displayUserType !== 'Agent' && (
                        <Link to={links.suggestions} className="hover:text-blue-600 transition">
                            Suggestion
                        </Link>
                    )}
                    
                    <Link to={links.information} className="hover:text-blue-600 transition">
                        Information
                    </Link>

                    {/* Profile Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={openDropdown}
                        onMouseLeave={scheduleClose}
                    >
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center space-x-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 p-2"
                        >
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                                {displayUserType}
                            </span>
                            <span>{displayName}</span>
                            {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {image ? <img src={image} alt="Profile" className="h-6 w-6 rounded-full object-cover" /> : <CircleUserRound />}
                        </button>

                        {isDropdownOpen && (
                            <div
                                className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-gray-200 z-50"
                                onMouseEnter={openDropdown}
                                onMouseLeave={scheduleClose}
                            >
                                <button
                                    onClick={goToSettings}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                                >
                                    <Settings size={16} />
                                    Settings
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen((o) => !o)}
                    className="md:hidden p-2 rounded hover:bg-gray-100 transition"
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-200 px-4 pb-4 space-y-4">
                    <div className="flex items-center space-x-3 pt-2">
                        {image ? (
                            <img src={image} alt="Profile" className="h-10 w-10 rounded-full" />
                        ) : (
                            <CircleUserRound size={40} />
                        )}
                        <div>
                            <div className="text-sm font-medium">{displayName}</div>
                            <div className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 inline-block rounded">
                                {displayUserType}
                            </div>
                        </div>
                    </div>

                    {/* Only show these links for appropriate roles */}
                    {displayUserType !== 'Agent' && (
                        <Link
                            to={links.suggestions}
                            className="block text-sm text-gray-700 hover:text-blue-600"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Suggestion
                        </Link>
                    )}
                    
                    <Link
                        to={links.information}
                        className="block text-sm text-gray-700 hover:text-blue-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Information
                    </Link>

                    <div className="border-t border-gray-200 pt-2">
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                goToSettings();
                            }}
                            className="block w-full text-left text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                            Settings
                        </button>
                        <button
                            onClick={async () => {
                                setIsMobileMenuOpen(false);
                                await handleLogout();
                            }}
                            className="block w-full text-left text-sm text-red-600 hover:bg-gray-100 px-2 py-1 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
