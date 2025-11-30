import React from 'react';
import {Navigate, Outlet, useSearchParams} from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authSlice';


export const PublicRoute: React.FC = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [searchParams] = useSearchParams();
    if (isAuthenticated) {
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
            return <Navigate to={decodeURIComponent(redirectUrl)} replace />;
        }
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};