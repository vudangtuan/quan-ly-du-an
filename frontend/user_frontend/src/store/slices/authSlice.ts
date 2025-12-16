import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {AuthResponse, UserInfo} from '@/shared/types';


interface AuthState {
    accessToken: string | null;
    userInfo: UserInfo | null;
    isAuthenticated: boolean;
}


interface AuthActions {
    login: (response: AuthResponse) => void;
    logout: () => void;
    setToken: (accessToken: string) => void;
    update:(UserInfo: UserInfo) => void;
}


const initialState: AuthState = {
    accessToken: null,
    userInfo: null,
    isAuthenticated: false,
};

// 4. Tạo store (kho)
export const useAuthStore = create<AuthState & AuthActions>()(
    // Dùng middleware "persist" để tự động lưu state vào localStorage
    // Khi người dùng tải lại trang (F5), họ sẽ không bị đăng xuất
    persist(
        (set) => ({
            ...initialState, // Đây là state ban đầu

            // Triển khai các hàm (actions)

            login: (response) => {
                set({
                    accessToken: response.accessToken,
                    userInfo: response.userInfo,
                    isAuthenticated: true,
                });
            },

            setToken: (accessToken) => {
                set({ accessToken: accessToken });
            },

            logout: () => {
                set(initialState);
            },
            update: (data: UserInfo) => {
                set({ userInfo: data });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);