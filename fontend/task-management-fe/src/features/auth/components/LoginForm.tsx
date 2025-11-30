import React, { useState } from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthService } from '../services/authService';
import { useAuthStore } from '@store/slices/authSlice';
import { type AuthResponse } from '../types/auth.types';
import {type CredentialResponse, GoogleLogin} from "@react-oauth/google";

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const loginAction = useAuthStore((state) => state.login);
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response: AuthResponse = await AuthService.login({ email, password });
            loginAction(response);
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message); // Luôn luôn lấy .message
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            setIsLoading(true);
            setError(null);
            try {
                const response = await AuthService.loginWithGoogle(credentialResponse.credential);

                loginAction(response);
            } catch (err: any) {
                console.error("Google Login Error:", err);
                setError(err.response?.data?.message || "Đăng nhập Google thất bại");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        // Thêm w-full và max-w-md VÀO ĐÂY
        <div className="w-full max-w-md">
            {/* Tiêu đề */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại!</h1>
                <p className="mt-2 text-gray-500">Đăng nhập vào tài khoản của bạn để tiếp tục.</p>
            </div>


            {/* Form Đăng nhập */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                    >
                        Địa chỉ Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        required
                        autoComplete="email"
                        className="w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Mật khẩu */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700"
                        >
                            Mật khẩu
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu của bạn"
                            required
                            autoComplete="current-password"
                            className="w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Nút Đăng nhập */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 p-3 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading ? (
                        <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <LogIn className="h-5 w-5" />
                    )}
                    {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>

            <div className="my-6 flex items-center gap-3">
                <hr className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-500">Hoặc tiếp tục với</span>
                <hr className="flex-1 border-t border-gray-200" />
            </div>

            {/* Đăng nhập Google */}
            <div className="flex justify-center w-full">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Đăng nhập Google thất bại")}
                    useOneTap={false} // Tùy chọn: true nếu muốn hiện popup one-tap ở góc phải
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                />
            </div>
        </div>
    );
};