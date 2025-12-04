import {PaginatedResponse} from "@features/projects/types/project.types";
import {privateApi} from "@config/api.config";


export const NotificationService = {
    getNotifications: (page:number,size:number):Promise<PaginatedResponse<Notification>> => {
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