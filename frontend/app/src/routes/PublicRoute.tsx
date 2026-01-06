import React from 'react';
import {Navigate, Outlet, useSearchParams} from 'react-router-dom';
import {useAuthStore} from '@/store';


export const PublicRoute: React.FC = () => {
    const {isAuthenticated, userInfo} = useAuthStore();
    const [searchParams] = useSearchParams();
    if (isAuthenticated) {

        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
            return <Navigate to={decodeURIComponent(redirectUrl)} replace/>;
        }
        if (userInfo?.role === 'ADMIN') {
            return <Navigate to="/admin" replace/>;
        }
        return <Navigate to="/projects" replace/>;
    }
    return <Outlet/>;
};