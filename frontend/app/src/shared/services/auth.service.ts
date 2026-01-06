import type {AuthResponse, LoginRequest} from "@/shared/types";
import {privateApi, publicApi} from "@/shared/api";


export const AuthService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return await publicApi.post('/auth/login', data);
    },
    loginWithGoogle: async (token: string | undefined): Promise<AuthResponse> => {
        return await publicApi.post('/auth/google', {token: token});
    },
    logout: async (): Promise<void> => {
        return await privateApi.post('/auth/logout');
    },
    createPassword: async (data: { password: string, confirmPassword: string }): Promise<void> => {
        return await privateApi.post('/auth/password', data);
    },
    updatePassword: async (data: { password: string, newPassword: string, confirmPassword: string }): Promise<void> => {
        return await privateApi.put('/auth/password', data);
    },
}