
export interface LoginRequest {
    email: string;
    password: string;
}


export interface UserInfo {
    userId: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
    createdAt: string;
    hasPassword: boolean;
}

export interface AuthResponse {
    userInfo: UserInfo;
    accessToken: string;
    expiresIn: number;
}