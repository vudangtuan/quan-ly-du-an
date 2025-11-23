import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';

/**
 * Trang Đăng nhập
 * * Hiển thị AuthLayout và đặt LoginForm vào vị trí 'children'.
 */
export const LoginPage: React.FC = () => {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
};