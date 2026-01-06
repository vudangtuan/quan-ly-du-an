import {privateApi} from "@/shared/api";
import type {Activity, PaginatedResponse} from "@/shared/types";


export const ActivityService = {
    getActivityByProjectId: async (projectId: string, page?: number, size?: number): Promise<PaginatedResponse<Activity>> => {
        return privateApi.get(`/activity/project/${projectId}`, {
            params: {
                page: page,
                size: size
            }
        });
    },
    getActivityByTaskId: async (taskId: string, page?: number, size?: number): Promise<PaginatedResponse<Activity>> => {
        return privateApi.get(`/activity/task/${taskId}`, {
            params: {
                page: page,
                size: size
            }
        });
    }
};