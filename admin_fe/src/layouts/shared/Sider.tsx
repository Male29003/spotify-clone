import React, { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { ExitToAppOutlined, ExpandLess, ExpandMore } from "@mui/icons-material";
import { ArtistMenu } from "../../configs/menu/artistMenuConfig";
import SpotifyIcon from "../../components/shared/SpotifyIcon";
import { AdminMenu } from "../../configs/menu/adminMenuConfig";
import { useAuthStore } from "../../stores/auth/authStore";
import { useAdminSiderStore } from "../../stores/useSiderStore";
import { handleLogout } from "../../api/axiosConfig";

const AdminSider = () => {
    const navigate = useNavigate();
    const location = useLocation()
    const { user } = useAuthStore((state) => state)
    const [openMenu, setOpenMenu] = useState<string[]>([]);
    const { isExpanded, toggleSider } = useAdminSiderStore();

    const userPermissions = (user as any)?.role_permissions || [];

    const isSuperAdmin = user?.is_superuser
    const filteredAdminMenu = AdminMenu.map(menu => {
        if (isSuperAdmin) return menu;

        if (menu.children) {
            const allowedChildren = menu.children.filter(child => userPermissions.includes(child.key));
            if (allowedChildren.length > 0) {
                return { 
                    ...menu, 
                    children: allowedChildren 
                };
            }
            return null;
        }

        // Nếu là menu đơn
        return userPermissions.includes(menu.key) ? menu : null;
    }).filter(Boolean);

    const menu = user?.is_staff ? filteredAdminMenu : ArtistMenu

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-[90] sm:hidden transition-opacity duration-300 ${
                    isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onClick={toggleSider}
            />
            <div 
                className={`
                    fixed sm:relative top-0 left-0 h-full bg-panel border-r border-border flex flex-col shrink-0 z-[100] transition-all duration-300 ease-in-out
                    ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full sm:w-20 sm:translate-x-0'} 
                `}
            >
                <div className={`py-6 px-5 flex items-center ${isExpanded ? 'gap-3' : ''} border-b border-border shrink-0`}>
                    <div className="w-12 h-12 flex items-center justify-center cursor-pointer">
                        <div className="h-10 w-10 flex items-center justify-center hover:scale-105 transition-transform">
                            <SpotifyIcon className="text-highlight text-[32px]" />
                        </div>
                    </div>
                    {isExpanded && (
                        <div className="animate-fadeIn overflow-hidden whitespace-nowrap sm:block">
                            {user?.type.toLowerCase() === 'artist' ? (
                                <>
                                    <h2 className="font-bold text-lg leading-tight text-text-main">Studio</h2>
                                    <span className="text-xs text-text-sub">For artists</span>
                                </>
                            ): 
                                <h2 className="font-bold text-lg leading-tight text-text-main">Admin Panel</h2>
                            }
                        </div>
                    )}
                </div>

                {/* Danh sách Menu */}
                <nav className={`p-4 flex flex-col gap-2 flex-1 custom-scrollbar overflow-y-auto overflow-x-hidden`}>
                    { menu.map((item) => {
                    if(item && 'children' in item && item.children) {
                        const isOpen = openMenu.includes(item.key);
                        const isParentActive = item?.children.some(child => child.path === location.pathname)
                        
                        return (
                            <div key={item.key} className="relative">
                                <div
                                    className={`flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center px-2'} cursor-pointer py-3 rounded-lg transition-all select-none font-semibold ${
                                        isParentActive 
                                            ? 'text-highlight bg-hover border-l-4 border-highlight'
                                            : 'text-text-sub hover:text-text-main hover:bg-hover border-l-4 border-hover'
                                    }`}   
                                    onClick={() => {
                                        setOpenMenu(prev => prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key])
                                    }}
                                    title={!isExpanded ? item.label : ""}
                                >
                                    <div className='flex items-center gap-4'>
                                        {item.icon}
                                        {isExpanded && <span className="font-semibold whitespace-nowrap">{item.label}</span>}
                                    </div>
                                    {isExpanded && (isOpen ? <ExpandLess fontSize='small'/> : <ExpandMore fontSize='small'/>)}
                                </div>

                                {isExpanded && isOpen && (
                                    <div className='mt-1 ml-4 pl-4 border-l border-border flex flex-col gap-1 animate-fadeIn'>
                                        {item.children.map((child => (
                                            <NavLink 
                                                key={child.key} 
                                                to={child.path}
                                                end
                                                className={({ isActive }) => 
                                                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                                                        isActive 
                                                            ? 'bg-hover text-highlight'
                                                            : 'text-text-sub hover:text-text-main hover:bg-hover'
                                                    }`
                                                }
                                            >
                                                {child.icon}
                                                <span>{child.label}</span>
                                            </NavLink>
                                        )))}
                                    </div>
                                )}

                                {!isExpanded && isOpen && (
                                    <div className="absolute left-full top-0 ml-3 flex flex-col bg-panel border border-border rounded-lg shadow-xl w-48 py-2 z-50 animate-fadeIn">
                                        <div className="px-4 py-2 text-xs font-bold text-text-sub uppercase border-b border-border mb-1">
                                            {item.label}
                                        </div>
                                        {item.children.map((child => (
                                            <NavLink 
                                                key={child.key} 
                                                to={child.path}
                                                end
                                                onClick={() => setOpenMenu(prev => prev.filter(k => k !== item.key))}
                                                className={({ isActive }) => 
                                                    `flex items-center gap-3 px-4 py-2 transition-all text-sm font-medium ${
                                                        isActive 
                                                            ? 'bg-hover text-highlight border-l-2 border-highlight'
                                                            : 'text-text-sub hover:text-text-main hover:bg-hover border-l-2 border-transparent'
                                                    }`
                                                }
                                            >
                                                {child.icon}
                                                <span>{child.label}</span>
                                            </NavLink>
                                        )))}
                                    </div>
                                )}
                            </div>
                        )
                    } 
                    return (
                        <NavLink 
                            key={item?.key} 
                            to={item?.path || '#'}
                            end
                            className={({ isActive }) => 
                                `flex items-center gap-4 ${isExpanded ? 'px-4' : 'px-2'} py-3 rounded-lg transition-all font-semibold ${
                                    isActive 
                                        ? 'bg-hover text-highlight border-l-4 border-highlight' 
                                        : 'text-text-sub hover:text-text-main hover:bg-hover border-l-4 border-hover'
                                }`
                            }
                            title={!isExpanded ? item?.label : ""}
                        >
                            {item?.icon}
                            {isExpanded && <span className="whitespace-nowrap">{item?.label}</span>}
                        </NavLink>
                    )
                })}
                </nav>

                <div className="p-4 border-t border-border shrink-0">
                    <button 
                        onClick={handleLogout}
                        className={`flex items-center ${isExpanded ? 'gap-4 px-4 justify-start' : 'justify-center'} py-3 rounded-lg w-full transition-all duration-300 font-semibold
                                text-text-sub hover:text-error hover:bg-error/10`}
                    >
                        <ExitToAppOutlined/>
                        {isExpanded && <span className="whitespace-nowrap">Log out</span>}
                    </button>
                    {isExpanded ? (
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-2 text-xs text-center w-full text-text-sub hover:text-text-main underline whitespace-nowrap"
                        >
                            Go to Home page
                        </button>
                    ) : (
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-2 text-text-sub hover:text-text-main"
                            title="Go to Home page"
                        >
                        <SpotifyIcon />
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminSider