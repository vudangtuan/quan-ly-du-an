import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    CheckSquare,
    FolderKanban,
    Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { Avatar, NotificationBell } from "@/shared/components";
import logoData from '@/assets/logo.svg';

export const Sidebar: React.FC = () => {
    const userInfo = useAuthStore((state) => state.userInfo);
    const accessToken = useAuthStore((state) => state.accessToken);

    return (
        <div className="flex h-screen flex-col border-r border-slate-800 bg-slate-900 text-slate-300
        transition-all duration-300 ease-in-out
            w-20 lg:w-64">

            <div className="flex h-20 items-center justify-between px-3 lg:px-5 border-b border-dashed border-slate-700">
                <Link to="/" className="items-center gap-3 group overflow-hidden hidden lg:flex">
                    <img src={logoData} alt="TaskMgr Logo" className="h-10 w-10 object-cover" />

                    <div className="whitespace-nowrap transition-opacity">
                        <h1 className="text-lg font-bold text-white leading-tight">Nexus</h1>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                            Project Management
                        </p>
                    </div>
                </Link>

                <div className="flex items-center text-white">
                    <NotificationBell userId={userInfo!.userId} accessToken={accessToken!} />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4">
                <ul className="flex flex-col gap-2">
                    <NavItem
                        icon={<CheckSquare className="h-5 w-5" />}
                        label="Nhiệm vụ của tôi"
                        to="/my_tasks"
                    />
                    <NavItem
                        icon={<FolderKanban className="h-5 w-5" />}
                        label="Dự án"
                        to="/projects"
                    />
                    <NavItem
                        icon={<Settings className="h-5 w-5" />}
                        label="Cài đặt"
                        to="/settings"
                    />
                </ul>
            </nav>

            <div className="mt-auto border-t border-slate-800 p-3 lg:p-4 bg-slate-900">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div>
                        <Avatar fullName={userInfo!.fullName} />
                    </div>

                    <div className={"hidden lg:block"}>
                        <p className="text-sm font-semibold text-white">
                            {userInfo?.fullName || 'User Name'}
                        </p>
                        <p className="text-xs text-slate-500">
                            {userInfo?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
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
                    `flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`
                }
            >
                {icon}
                <span className={"hidden lg:block"}>{label}</span>
            </NavLink>
        </li>
    );
};