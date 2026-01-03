
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, LogOut, Shield } from 'lucide-react';


export const AdminSidebar: React.FC = () => {

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'Quản lý Users', path: '/admin/users' },
        { icon: Activity, label: 'Hệ thống', path: '/admin/system' },
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 text-white shadow-xl">
            <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Shield className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-wide">ADMIN</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button
                    // onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    );
};