import React from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authSlice';


export const PrivateRoute: React.FC = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();
    if (!isAuthenticated) {
        const fullPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${fullPath}`} replace />;
    }

    // Nếu đã đăng nhập, hiển thị component con (ví dụ: DashboardPage)
    return <Outlet />;
};