import axios, {AxiosError, type AxiosRequestConfig} from 'axios';
import {useAuthStore} from "@/store";
import type {AuthResponse} from "@/shared/types";

const API_URL = '/api'

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

export interface ErrorResponse {
    status: string,
    error: string,
    message: string,
    path: string,
    timestamp: string
}

export const publicApi = axios.create({
    baseURL: API_URL,
    headers: {'Content-Type': 'application/json'},
    timeout: 10000,
});

export const privateApi = axios.create({
    baseURL: API_URL,
    headers: {'Content-Type': 'application/json'},
    timeout: 10000,
    withCredentials: true,
});

publicApi.interceptors.response.use(
    response => response.data,
    error => Promise.reject(error.response?.data || error)
)


privateApi.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error : unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });

    failedQueue = [];
};
privateApi.interceptors.response.use(
    (response) => {
        const apiResponse = response.data as ApiResponse<unknown>;
        if (apiResponse.success) {
            return apiResponse.data as any;
        }
        return Promise.reject(apiResponse);
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Nếu đang refresh, đợi trong queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({resolve, reject});
                })
                    .then(token => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return privateApi(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const oldAccessToken = useAuthStore.getState().accessToken;
                // CHỈ 1 request refresh duy nhất
                const data:AuthResponse = await publicApi.post(
                    "/auth/refresh", {},
                    {
                        headers: {Authorization: `Bearer ${oldAccessToken}`},
                        withCredentials: true
                    });

                useAuthStore.getState().login(data);
                const newAccessToken = data.accessToken;

                // Process tất cả requests đang chờ
                processQueue(null, newAccessToken);

                // Retry original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return privateApi(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
                window.location.href = '/login';

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error.response?.data as ErrorResponse);
    }
);