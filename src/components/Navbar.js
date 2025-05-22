// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import Logout from "./Logout"; // Import the dedicated Logout component
import { isAuthenticatedByCookie } from "../utils/cookieUtils";
import { getCurrentUser, getDashboardUrlByRole } from "../services/authService";

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const { pathname } = useLocation();

    // Check authentication status on component mount and path change
    useEffect(() => {
        const authStatus = isAuthenticatedByCookie();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
            const user = getCurrentUser();
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
        }
    }, [pathname]);

    // helper to decide whether to show a link
    const showLink = (path) => pathname !== path;
    
    // Check if we are on a dashboard page
    const isDashboardPage = pathname.includes('/dashboard');
    const isEmployerPending = pathname === "/employer/pending";
    const showDashboardLink = isAuthenticated && currentUser && !isDashboardPage;

    // Get appropriate dashboard URL based on user role
    const getDashboardUrl = () => {
        if (!currentUser) return '/dashboard';
        return getDashboardUrlByRole(currentUser);
    };

    return (
        <div>
            {/* Empty div with appropriate height to compensate for fixed navbar */}
            <div className="h-16"></div>
            
            <nav className="fixed top-0 left-0 z-50 w-full bg-[#d0e1ff]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
                    {/* Logo */}
                    <Link
                        to={isAuthenticated ? getDashboardUrl() : "/"}
                        className="flex items-center space-x-2"
                    >
                        <img src="/WeWinLogo.png" alt="WeWin Logo" className="h-10 w-auto" />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex space-x-4 items-center">
                        {!isAuthenticated && (
                            <>
                                {showLink("/") && (
                                    <Link
                                        to="/"
                                        className="text-sm text-gray-700 hover:text-blue-600 transition"
                                    >
                                        Home
                                    </Link>
                                )}
                                {showLink("/about") && (
                                    <Link
                                        to="/about"
                                        className="text-sm text-gray-700 hover:text-blue-600 transition"
                                    >
                                        About
                                    </Link>
                                )}
                                {showLink("/contact") && (
                                    <Link
                                        to="/contact"
                                        className="text-sm text-gray-700 hover:text-blue-600 transition"
                                    >
                                        Contact
                                    </Link>
                                )}

                                {showLink("/login") && (
                                    <Link
                                        to="/login"
                                        className="rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition"
                                    >
                                        Login
                                    </Link>
                                )}
                                {showLink("/signup") && (
                                    <Link
                                        to="/signup"
                                        className="rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition"
                                    >
                                        Signup
                                    </Link>
                                )}
                                {showLink("/employer") && (
                                    <Link
                                        to="/employer"
                                        className="rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition"
                                    >
                                        Employer
                                    </Link>
                                )}
                            </>
                        )}
                        
                        {/* Show Dashboard link for authenticated users not already on dashboard */}
                        {showDashboardLink && (
                            <Link
                                to={getDashboardUrl()}
                                className="text-sm text-gray-700 hover:text-blue-600 transition"
                            >
                                Dashboard
                            </Link>
                        )}
                        
                        {/* Logout Button for Authenticated Users */}
                        {isAuthenticated && (
                            <div className="rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition">
                                <Logout />
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen((o) => !o)}
                        className="md:hidden text-gray-700 focus:outline-none"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden px-4 pb-4 space-y-2 bg-[#d0e1ff]">
                        {!isAuthenticated ? (
                            <>
                                {showLink("/") && (
                                    <Link
                                        to="/"
                                        className="block text-sm text-gray-700 hover:text-blue-600 rounded-tl-xl rounded-tr-xl rounded-br-xl px-5 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Home
                                    </Link>
                                )}
                                {showLink("/about") && (
                                    <Link
                                        to="/about"
                                        className="block text-sm text-gray-700 hover:text-blue-600 rounded-tl-xl rounded-tr-xl rounded-br-xl px-5 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        About
                                    </Link>
                                )}
                                {showLink("/contact") && (
                                    <Link
                                        to="/contact"
                                        className="block text-sm text-gray-700 hover:text-blue-600 rounded-tl-xl rounded-tr-xl rounded-br-xl px-5 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Contact
                                    </Link>
                                )}

                                {showLink("/login") && (
                                    <Link
                                        to="/login"
                                        className="block text-sm font-medium text-blue-600 hover:underline rounded-tl-xl rounded-tr-xl rounded-br-xl px-5 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                )}
                                {showLink("/signup") && (
                                    <Link
                                        to="/signup"
                                        className="block rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                )}
                                {showLink("/employer") && (
                                    <Link
                                        to="/employer"
                                        className="block rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Employer
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Dashboard Link for mobile */}
                                {showDashboardLink && (
                                    <Link
                                        to={getDashboardUrl()}
                                        className="block text-sm text-gray-700 hover:text-blue-600 rounded-tl-xl rounded-tr-xl rounded-br-xl px-5 py-2"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                )}
                                
                                {/* Logout Button for Mobile */}
                                <div className="block w-full rounded-tl-xl rounded-tr-xl rounded-br-xl bg-[#ff4473] px-5 py-2 text-sm font-medium text-white hover:bg-[#679bfb] transition">
                                    <Logout />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Navbar;
