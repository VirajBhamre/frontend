// src/components/Sidebar.js
import React, { useState, useRef, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Info, Phone, ChevronDown, ChevronUp, Menu, Users, ShieldCheck, Briefcase } from "lucide-react";
import { getCurrentUser } from "../services/authService";

const Icons = {
    Home,
    LayoutGrid,
    Info,
    Phone,
    Menu,
    Users,
    ShieldCheck,
    Briefcase
};

const Menus = [
    {
        id: 1,
        label: "Dashboard",
        icon: "Home",
        path: "/dashboard",
    },
    {
        id: 5,
        label: "Admin",
        icon: "ShieldCheck",
        path: "/admin",
        isSubMenu: true,
        adminOnly: true, // Only show for admin users
        highlight: true, // Add a highlight property
    },
    {
        id: 2,
        label: "Master Details",
        icon: "LayoutGrid",
        path: "/dashboard/master",
        isSubMenu: true,
    },
    {
        id: 3,
        label: "About",
        icon: "Info",
        path: "https://www.wewinlimited.com/our-team",
        isExternal: true,
    },
    {
        id: 4,
        label: "Contact",
        icon: "Phone",
        path: "https://www.wewinlimited.com/contact",
        isExternal: true,
    }
];

const Submenus = [
    {
        id: 101,
        label: "Module",
        path: "/dashboard/master/module",
        menuId: 2, // Links to Master Details (id: 2)
    },
    {
        id: 102,
        label: "Submodule",
        path: "/dashboard/master/submodule",
        menuId: 2,
    },
    {
        id: 103,
        label: "Table",
        path: "/dashboard/master/table",
        menuId: 2,
    },
    {
        id: 104,
        label: "Products",
        path: "/dashboard/master/products",
        menuId: 2,
    },
    // Admin submenu items
    {
        id: 501,
        label: "Pending Employers",
        path: "/dashboard/admin/employers/pending",
        menuId: 5, // Links to Admin menu (id: 5)
        highlight: true // Add a highlight property
    }
];

// Helper Component for Popup Content (Used when sidebar is collapsed)
const PopupContent = ({ items, isSubActive, handleEnter, handleLeave, popupBase }) => (
    <div
        className={popupBase}
        onMouseEnter={handleEnter} // Keep popup open when mouse enters popup itself
        onMouseLeave={handleLeave} // Close popup when mouse leaves popup
    >
        {items.map((item) => (
            item.isExternal ? (
                <a
                    key={item.id || item.path} // Unique key
                    href={item.path}
                    target="_blank" // Ensure external links open in new tab
                    rel="noopener noreferrer"
                    className="block text-sm px-3 py-1 rounded hover:bg-gray-100 text-gray-800 whitespace-nowrap"
                >
                    {item.label}
                </a>
            ) : (
                <Link
                    key={item.id || item.path} // Unique key
                    to={item.path}
                    className={`block text-sm px-3 py-1 rounded hover:bg-gray-100 whitespace-nowrap ${
                        // Apply active styles if isSubActive function exists and the path matches
                        isSubActive && isSubActive(item.path)
                            ? "text-[#ff4473] font-semibold"
                            : "text-gray-800"
                        }`}
                >
                    {item.label}
                </Link>
            )
        ))}
    </div>
);

export function Sidebar({ isExpanded }) {
    const location = useLocation();
    const [activePopupKey, setActivePopupKey] = useState(null); // Tracks hovered item ID for popups
    const [openMenuId, setOpenMenuId] = useState(null); // Tracks expanded submenu ID
    const leaveTimer = useRef(null); // Timer for popup close delay

    // Get current user to check role for admin menu
    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.Role === 'Admin' || 
                    currentUser?.Role === 'SAdmin' || 
                    currentUser?.Role === 1;

    // Set the Admin section to be open by default for admin users
    useEffect(() => {
        if (isAdmin) {
            const adminMenu = Menus.find(menu => menu.adminOnly);
            if (adminMenu) {
                setOpenMenuId(adminMenu.id);
            }
        }
    }, [isAdmin]);

    // Filter menus based on user role
    const filteredMenus = useMemo(() => {
        return Menus.filter(menu => !menu.adminOnly || (menu.adminOnly && isAdmin));
    }, [isAdmin]);

    // Memoize submenu mapping for performance
    const getRelevantSubmenus = useMemo(() => {
        const map = new Map();
        Submenus.forEach(sub => {
            if (!map.has(sub.menuId)) {
                map.set(sub.menuId, []);
            }
            map.get(sub.menuId).push(sub);
        });
        return map;
    }, []); // Recalculate only if Submenus array reference changes (it shouldn't here)

    // Effect to manage open submenu state based on current route and expansion state
    useEffect(() => {
        if (isExpanded) {
            // Find if the current path belongs to a submenu
            const activeParent = Menus.find(menu => {
                if (!menu.isSubMenu) return false;
                const subs = getRelevantSubmenus.get(menu.id) || [];
                // Check if current path starts with any submenu path under this parent
                return subs.some(sub => location.pathname.startsWith(sub.path));
            });
            // If a parent is active, ensure its submenu is open
            if (activeParent) {
                setOpenMenuId(activeParent.id);
            }
            // Optional: Close other menus if navigating away while expanded
            // else { setOpenMenuId(null); }
        } else {
            // Close all submenus when sidebar collapses
            setOpenMenuId(null);
        }
    }, [location.pathname, getRelevantSubmenus, isExpanded]); // Dependencies

    // --- Helper Functions ---
    const isActive = (path) => location.pathname === path; // Exact match for top-level items
    const isSubActive = (path) => location.pathname === path; // Exact match for submenu items
    // Check if a parent menu should be highlighted because a child route is active
    const isParentActive = (menu) => {
        if (!menu.isSubMenu) return false;
        const subs = getRelevantSubmenus.get(menu.id) || [];
        return subs.some(sub => location.pathname.startsWith(sub.path));
    };
    // Toggle submenu open/closed state
    const handleMenuClick = (menuId) => {
        setOpenMenuId(prev => (prev === menuId ? null : menuId));
    };
    // Show popup on hover (collapsed view)
    const handleMouseEnter = (key) => {
        clearTimeout(leaveTimer.current); // Clear any pending close timer
        setActivePopupKey(key);
    };
    // Hide popup after a delay (collapsed view)
    const handleMouseLeave = () => {
        clearTimeout(leaveTimer.current);
        leaveTimer.current = setTimeout(() => setActivePopupKey(null), 200); // Delay before closing popup
    };
    // Render icon component, defaulting to Menu icon if specified icon is not found
    const renderIcon = (iconName) => {
        const IconComponent = Icons[iconName] || Icons.Menu; // Fallback to Menu
        return IconComponent ? <IconComponent size={20} /> : null;
    };
    // Base classes for popups
    const popupBaseClass = "absolute left-full top-0 ml-2 z-50 bg-white border border-gray-300 shadow-xl rounded-md p-1 min-w-[140px]";

    // --- Component Return ---
    return (
        <aside
            // Removed transition classes for width
            className={`fixed top-[64px] left-0 h-[calc(100vh-64px)] z-40 bg-white border-r border-slate-300 ${isExpanded ? "w-56" : "w-16"}`}
        >
            <nav className="mt-2 px-2 space-y-1">
                {filteredMenus.map((menu) => {
                    const Icon = renderIcon(menu.icon);
                    // Determine if the current menu item or its parent should be visually active
                    const isCurrentMenuActive = isActive(menu.path) || isParentActive(menu);
                    const relevantSubmenus = getRelevantSubmenus.get(menu.id) || [];
                    const isSubMenuOpen = openMenuId === menu.id;

                    // Base classes applied to all menu items (links/buttons)
                    // Removed transition classes
                    const commonLinkClasses = `flex items-center rounded-md text-sm cursor-pointer ${isCurrentMenuActive
                        ? "text-[#ff4473] font-semibold bg-rose-50" // Active state styles
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900" // Default state styles
                        }
                        ${menu.highlight ? "border border-blue-300 bg-blue-50 hover:bg-blue-100" : ""}`;
                    // Classes specific to expanded view
                    const expandedClasses = `${commonLinkClasses} gap-4 px-3 py-2`;
                    // Classes specific to collapsed view
                    const collapsedClasses = `${commonLinkClasses} justify-center p-2`;

                    return (
                        <div
                            key={menu.id}
                            className="relative"
                            onMouseEnter={() => handleMouseEnter(menu.id)} // Trigger popup logic on hover
                            onMouseLeave={handleMouseLeave} // Trigger popup close logic on leave
                        >
                            {isExpanded ? (
                                // --- Expanded Sidebar View ---
                                <>
                                    {menu.isSubMenu ? (
                                        // Button to toggle submenu
                                        <button
                                            onClick={() => handleMenuClick(menu.id)}
                                            className={`${expandedClasses} w-full justify-between`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {Icon}
                                                <span>{menu.label}</span>
                                            </div>
                                            {isSubMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    ) : menu.isExternal ? (
                                        // External link
                                        <a
                                            href={menu.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={expandedClasses}
                                        >
                                            {Icon}
                                            <span>{menu.label}</span>
                                        </a>
                                    ) : (
                                        // Internal link
                                        <Link to={menu.path} className={expandedClasses}>
                                            {Icon}
                                            <span>{menu.label}</span>
                                        </Link>
                                    )}

                                    {/* Render Submenus if parent isSubMenu and isSubMenuOpen */}
                                    {menu.isSubMenu && isSubMenuOpen && (
                                        <div className="pl-8 pt-1 pb-1 space-y-1"> {/* Indentation for submenus */}
                                            {relevantSubmenus.map((sub) => (
                                                <Link
                                                    key={sub.id}
                                                    to={sub.path}
                                                    // Removed transition classes
                                                    className={`block px-4 py-1.5 text-sm rounded-md ${isSubActive(sub.path)
                                                        ? "text-[#ff4473] font-medium" // Active submenu style
                                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50" // Default submenu style
                                                        }
                                                        ${sub.highlight ? "border border-blue-200 bg-blue-50 hover:bg-blue-100" : ""}`}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                // --- Collapsed Sidebar View ---
                                <>
                                    {menu.isExternal ? (
                                        // External link icon
                                        <a
                                            href={menu.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={collapsedClasses}
                                            title={menu.label} // Tooltip for accessibility
                                        >
                                            {Icon}
                                        </a>
                                    ) : (
                                        // Internal link icon (or submenu parent icon)
                                        <Link
                                            // Prevent navigation for submenu parent icons in collapsed state
                                            to={menu.isSubMenu ? '#' : menu.path}
                                            onClick={(e) => menu.isSubMenu && e.preventDefault()}
                                            className={collapsedClasses}
                                            title={menu.label} // Tooltip for accessibility
                                        >
                                            {Icon}
                                        </Link>
                                    )}

                                    {/* Render Popup on hover if activePopupKey matches menu.id */}
                                    {activePopupKey === menu.id && (
                                        <PopupContent
                                            // Pass submenus if it's a submenu parent, otherwise pass the menu itself
                                            items={menu.isSubMenu ? relevantSubmenus : [menu]}
                                            // Pass function to check active state only for submenus
                                            isSubActive={menu.isSubMenu ? isSubActive : null}
                                            handleEnter={() => handleMouseEnter(menu.id)} // Keep popup open
                                            handleLeave={handleMouseLeave} // Close popup
                                            popupBase={popupBaseClass}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}