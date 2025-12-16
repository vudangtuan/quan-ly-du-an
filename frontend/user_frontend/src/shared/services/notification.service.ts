import type {AppNotification, PaginatedResponse} from "@/shared/types";
import {privateApi} from "@/shared/api";


export const NotificationService = {
    getNotifications: (page:number,size:number):Promise<PaginatedResponse<AppNotification>> => {
        return privateApi.get("/notifications", {
            params:{
                page:page,
                size:size
            }
        })
    },
    markRead: async (notificationIds: string[]): Promise<void> => {
        return await privateApi.post('/notifications', { ids: notificationIds });
    },
    markAllRead: async (): Promise<void> => {
        return await privateApi.post('/notifications/allRead');
    }
}