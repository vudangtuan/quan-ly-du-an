import React from 'react';
import { Outlet } from 'react-router-dom';
import {AdminSidebar} from "@/layouts/AdminSidebar";


export const AdminLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};