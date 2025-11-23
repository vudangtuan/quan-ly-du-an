import type {AuthResponse,LoginRequest} from "../types/auth.types"
import {publicApi} from "@config/api.config"



export const AuthService ={
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await publicApi.post<AuthResponse>('/auth/login', data);
        return response.data;
    },
    loginWithGoogle: async (token: string): Promise<AuthResponse> => {
        const response = await publicApi.post<AuthResponse>('/auth/google', { token:token });
        return response.data;
    }
}