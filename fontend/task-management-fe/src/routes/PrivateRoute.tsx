import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authSlice';

/**
 * Bảo vệ một tuyến đường.
 * Nếu người dùng đã đăng nhập, cho phép truy cập.
 * Nếu chưa, điều hướng về trang /login.
 */
export const PrivateRoute: React.FC = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        // Lưu lại trang người dùng muốn vào để redirect sau khi login (tùy chọn)
        // const location = useLocation();
        // return <Navigate to="/login" state={{ from: location }} replace />;

        return <Navigate to="/login" replace />;
    }

    // Nếu đã đăng nhập, hiển thị component con (ví dụ: DashboardPage)
    return <Outlet />;
};