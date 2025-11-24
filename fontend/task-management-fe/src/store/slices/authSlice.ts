import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Import các kiểu dữ liệu (types) mà chúng ta đã định nghĩa
import { type AuthResponse, type UserInfo } from '@/features/auth/types/auth.types';

// 1. Định nghĩa "State" (dữ liệu trong kho)
interface AuthState {
    accessToken: string | null;
    userInfo: UserInfo | null;
    isAuthenticated: boolean; // Thêm một biến cờ để kiểm tra đăng nhập cho tiện
}

// 2. Định nghĩa "Actions" (các hàm để thay đổi kho)
interface AuthActions {
    login: (response: AuthResponse) => void;
    logout: () => void;
    setToken: (accessToken: string) => void;
}

// 3. Định nghĩa State ban đầu (khi chưa đăng nhập)
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