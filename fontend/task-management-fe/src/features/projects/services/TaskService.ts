import {privateApi} from '@config/api.config';
import {TaskResponse} from '@features/task/types';
import {CheckListResponse, CommentResponse, TaskDetailResponse, TaskRequest} from "@features/projects/types/task.types";

export const TaskService = {
    getTasksByProject: async (projectId: string): Promise<TaskResponse[]> => {
        return await privateApi.get(`/project/${projectId}/task`);
    },
    createTask: async (projectId: string, taskRequest: TaskRequest): Promise<TaskResponse> => {
        return await privateApi.post(`/project/${projectId}/task`, taskRequest);
    },
    archiveTask: async (projectId: string, taskId: string): Promise<TaskResponse> => {
        return await privateApi.post(`/project/${projectId}/task/${taskId}/archive`);
    },
    restoreTask: async (projectId: string, taskId: string, sortOrder?: number): Promise<TaskResponse> => {
        return await privateApi.post(
            `/project/${projectId}/task/${taskId}/restore`,
            {},
            {
                params: {
                    sortOrder: sortOrder
                }
            }
        );
    },
    deleteTask: async (projectId: string, taskId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}/task/${taskId}`);
    },
    moveTask: async (projectId: string, taskId: string, data: {
        sortOrder: number,
        boardColumnId: string
    }): Promise<TaskResponse> => {
        return await privateApi.patch(`/project/${projectId}/task/${taskId}/move`, {},
            {
                params: data
            });
    },
    getTask: async (projectId: string, taskId: string): Promise<TaskDetailResponse> => {
        return await privateApi.get(`/project/${projectId}/task/${taskId}`);
    },
    updateTask: async (projectId: string, taskId: string, data: Partial<TaskRequest>): Promise<void> => {
        return await privateApi.put(`/project/${projectId}/task/${taskId}`, data);
    },
    updateDone: async (projectId: string, taskId: string, completed: boolean): Promise<void> => {
        return await privateApi.put(`/project/${projectId}/task/${taskId}/complete`, {},
            {
                params: {
                    completed: completed
                }
            });
    },
    createCheckList: async (projectId: string, taskId: string, body: string): Promise<CheckListResponse> => {
        return await privateApi.post(`/project/${projectId}/task/${taskId}/checkList`, {},
            {
                params: {
                    body: body
                }
            });
    },
    updateCheckList: async (
        projectId: string,
        taskId: string,
        checkListId: string,
        data: { body?: string; done?: boolean }
    ): Promise<CheckListResponse> => {
        return await privateApi.put(
            `/project/${projectId}/task/${taskId}/checkList/${checkListId}`,
            {},
            {params: data}
        );
    },
    deleteCheckList: async (
        projectId: string,
        taskId: string,
        checkListId: string,
    ): Promise<CheckListResponse> => {
        return await privateApi.delete(
            `/project/${projectId}/task/${taskId}/checkList/${checkListId}`
        );
    },
    createComment: async (projectId: string, taskId: string, body: string): Promise<CommentResponse> => {
        return await privateApi.post(`/project/${projectId}/task/${taskId}/comment`, {body: body});
    },
    deleteComment: async (projectId: string, taskId: string, commentId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}/task/${taskId}/comment/${commentId}`);
    },
    updateComment: async (projectId: string, taskId: string, commentId: string, body: string): Promise<CommentResponse> => {
        return await privateApi.put(`/project/${projectId}/task/${taskId}/comment/${commentId}`, {body: body});
    },
};