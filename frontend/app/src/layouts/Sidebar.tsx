import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
    CheckSquare,
    FolderKanban,
    Settings,
    Menu,
    X
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { Avatar, NotificationBell } from "@/shared/components";
import logoData from '@/assets/logo.svg';

export const Sidebar: React.FC = () => {
    const userInfo = useAuthStore((state) => state.userInfo);
    const accessToken = useAuthStore((state) => state.accessToken);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobileOpen(false);
    }, [location.pathname]);

    return (
        <>
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoData} alt="Logo" className="h-8 w-8 object-cover" />
                        <span className="text-white font-bold text-lg">Nexus</span>
                    </Link>
                </div>
                <div className="flex items-center">
                    <NotificationBell
                        userId={userInfo!.userId}
                        accessToken={accessToken!}
                        align="end"
                    />
                </div>
            </div>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <div className={`
                fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-slate-900 border-r border-slate-800 text-slate-300
                transition-all duration-300 ease-in-out shadow-xl md:shadow-none
                w-64 md:w-20 md:translate-x-0 md:static lg:w-64                                
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
            `}>
                <div className="flex h-20 items-center justify-between px-4 lg:px-5 md:justify-center lg:justify-between border-b border-dashed border-slate-700">
                    <Link to="/" className="flex items-center gap-3 group overflow-hidden md:hidden lg:flex">
                        <img src={logoData} alt="TaskMgr Logo" className="h-10 w-10 object-cover flex-shrink-0" />

                        <div className="whitespace-nowrap transition-opacity">
                            <h1 className="text-lg font-bold text-white leading-tight">Nexus</h1>
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                Project Management
                            </p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden p-1 text-slate-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div className="hidden md:flex items-center text-white">
                        <NotificationBell
                            userId={userInfo!.userId}
                            accessToken={accessToken!}
                            align="start"
                            side="right"
                        />
                    </div>
                </div>


                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="flex flex-col gap-2">
                        <NavItem
                            icon={<CheckSquare className="h-6 w-6 md:h-6 md:w-6" />}
                            label="Nhiệm vụ của tôi"
                            to="/my_tasks"
                        />
                        <NavItem
                            icon={<FolderKanban className="h-6 w-6 md:h-6 md:w-6" />}
                            label="Dự án"
                            to="/projects"
                        />
                        <NavItem
                            icon={<Settings className="h-6 w-6 md:h-6 md:w-6" />}
                            label="Cài đặt"
                            to="/settings"
                        />
                    </ul>
                </nav>

                <div className="mt-auto border-t border-slate-800 p-4 bg-slate-900">
                    <div className="flex items-center gap-3 justify-start md:justify-center lg:justify-start">
                        <div className="flex-shrink-0">
                            <Avatar fullName={userInfo!.fullName} />
                        </div>

                        <div className="md:hidden lg:block overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">
                                {userInfo?.fullName || 'User Name'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {userInfo?.email || 'user@example.com'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to }) => {
    return (
        <li>
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 
                    md:justify-center lg:justify-start
                    ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
                title={label}
            >
                {icon}
                <span className="md:hidden lg:block">{label}</span>
            </NavLink>
        </li>
    );
};