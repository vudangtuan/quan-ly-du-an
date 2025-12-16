import React from 'react';
import { LoginForm,AuthLayout } from '@/features/auth/components';

export const LoginPage: React.FC = () => {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
};