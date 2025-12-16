import React from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import { useAuthStore } from '@/store';


export const PrivateRoute: React.FC = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();
    if (!isAuthenticated) {
        const fullPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${fullPath}`} replace />;
    }

    return <Outlet />;
};