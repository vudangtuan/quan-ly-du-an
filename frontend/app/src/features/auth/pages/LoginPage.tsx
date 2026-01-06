import React from 'react';
import {LoginForm} from '@/features/auth/components';

export const LoginPage: React.FC = () => {
    return (
        <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2072')"
                }}
            />
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="backdrop-blur-lg bg-white/95 rounded-2xl shadow-2xl p-8">
                    <LoginForm/>
                </div>
            </div>
        </div>
    );
};
