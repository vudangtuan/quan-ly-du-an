import type {AuthResponse, LoginRequest} from "../types/auth.types"
import {privateApi, publicApi} from "@config/api.config"


export const AuthService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await publicApi.post<AuthResponse>('/auth/login', data);
        return response.data;
    },
    loginWithGoogle: async (token: string): Promise<AuthResponse> => {
        const response = await publicApi.post<AuthResponse>('/auth/google', {token: token});
        return response.data;
    },
    logout: async (): Promise<void> => {
        return await privateApi.post<void>('/auth/logout');
    },
    createPassword: async (data: {password:string,confirmPassword:string}): Promise<void> => {
        return await privateApi.post<AuthResponse>('/auth/password', data);
    },
    updatePassword: async (data: {password:string,newPassword:string,confirmPassword:string}): Promise<void> => {
        return await privateApi.put<AuthResponse>('/auth/password', data);
    },
}