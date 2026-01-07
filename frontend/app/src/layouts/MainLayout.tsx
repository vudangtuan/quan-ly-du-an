import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen min-w-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-100 pt-16 md:pt-0 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};