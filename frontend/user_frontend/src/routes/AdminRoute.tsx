import React from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuthStore} from '@/store';
import toast from "react-hot-toast";

export const AdminRoute: React.FC = () => {
    const {isAuthenticated, userInfo} = useAuthStore();
    const location = useLocation();


    if (!isAuthenticated) {
        const fullPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${fullPath}`} replace/>;
    }

    if (userInfo?.role !== 'ADMIN') {
        toast.error("Bạn không có quyền truy cập trang này");
        return <Navigate to={`/`} replace/>;
    }
    return <Outlet/>;
};