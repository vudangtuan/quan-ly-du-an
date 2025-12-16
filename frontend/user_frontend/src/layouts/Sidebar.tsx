import React from 'react';
import {NavLink, Link} from 'react-router-dom';
import {
    CheckSquare,
    FolderKanban,
    Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import {Avatar,NotificationBell} from "@/shared/components";




export const Sidebar: React.FC = () => {
    const userInfo = useAuthStore((state) => state.userInfo);
    const accessToken = useAuthStore((state) => state.accessToken);
    return (
        <div className="flex h-screen flex-col border-r border-gray-200 bg-white
        transition-all duration-300 ease-in-out
            w-20 lg:w-64">
            {/* 1. Logo/Header */}
            <div className="flex items-center p-3 lg:gap-2 lg:p-5 justify-center lg:justify-start">
                <Link to="/" className="flex items-center gap-3">
                    <div className={"lg:block hidden whitespace-nowrap"}>
                        <h1 className="text-lg font-bold text-gray-900">Task Manager</h1>
                        <p className="text-xs text-gray-500">Quản lý dự án</p>
                    </div>
                </Link>
                <NotificationBell userId={userInfo!.userId} accessToken={accessToken!}/>
            </div>

            {/* 2. Menu Điều hướng */}
            <nav className="flex-1 overflow-y-auto px-4 py-2">
                <ul className="flex flex-col gap-1">
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

            {/* 3. Thông tin User (gim ở dưới cùng) */}
            <div className="mt-auto border-t border-gray-200 p-3 lg:p-4">
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                    <div>
                        <Avatar fullName={userInfo!.fullName}/>
                    </div>

                    <div className={"hidden lg:block"}>
                        <p className="text-sm font-semibold text-gray-900">
                            {userInfo?.fullName || 'User Name'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {userInfo?.email || 'user@example.com'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component con cho từng mục Nav
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
                // NavLink sẽ tự thêm class "active" khi URL khớp
                className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md p-3 text-sm font-medium transition-colors ${
                        isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
            >
                {icon}
                <span className={"hidden lg:block"}>{label}</span>
            </NavLink>
        </li>
    );
};