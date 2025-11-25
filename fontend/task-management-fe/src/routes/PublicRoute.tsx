import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authSlice';


export const PublicRoute: React.FC = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Nếu chưa đăng nhập, hiển thị component con (ví dụ: LoginPage)
    return <Outlet />;
};