import {privateApi} from "@/shared/api";
import type {Activity} from "@/shared/types";

interface DashboardData {
    totalUsers: number;
    growthChart: { group: string; count: number }[];
}

export interface User {
    userId: string;
    email: string;
    fullName: string;
    oauthProvider: string;
    oauthProviderId: string;
    status: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    sessionId: string;
    userId: string;
    deviceInfo: string;
    ipAddress: string;
    createdAt: string;
    lastAccessedAt: string;
}

export interface ServiceStatus {
    name: string;
    status: 'UP' | 'DOWN';
    url: string;
    instances: number;
}

export const AdminService = {
    getUserStats: async (months: number): Promise<DashboardData> => {
        return privateApi.get('user/stats', {
            params: {months: months}
        });
    },
    getUsers: async (): Promise<User[]> => {
        return privateApi.get('user/all');
    },
    getUserById: async (id: string): Promise<User> => {
        return privateApi.get(`user/${id}`);
    },
    banUser: async (userId: string): Promise<User> => {
        return privateApi.post(`user/${userId}/ban`);
    },
    unBanUser: async (userId: string): Promise<User> => {
        return privateApi.post(`user/${userId}/unBan`);
    },
    deleteUser: async (userId: string): Promise<void> => {
        return privateApi.delete(`user/${userId}`);
    },
    getSessionByUserId: async (userId: string): Promise<Session[]> => {
        return privateApi.get(`user/${userId}/session`);
    },
    deleteSessionById: async (userId: string, sessionId: string): Promise<void> => {
        return privateApi.delete(`user/${userId}/session/${sessionId}`);
    },
    getActivity: async (userId: string): Promise<Activity[]> => {
        return privateApi.get(`activity/user/${userId}`);
    },
    getSystemStatus: async (): Promise<ServiceStatus[]> => {
        return privateApi.get('system/status');
    }
}