import {privateApi} from '@/shared/api';
import type {
    ArchivedItemResponse,
    BoardColumnRequest,
    BoardColumnResponse,
    CreateProjectRequest, EditProjectData, InviteMemberRequest, LabelRequest, LabelResponse,
    PaginatedResponse, ProjectDetailResponse, ProjectMemberResponse,
    ProjectResponse, ProjectRole,
} from '@/shared/types';



export const ProjectService = {
    getProjects: async (page:number,size:number): Promise<PaginatedResponse<ProjectResponse>> => {
        return await privateApi.get('/project', {
            params: {
                page,
                size,
            },
        });
    },
    createProject: async (data: CreateProjectRequest): Promise<ProjectResponse> => {
        return await privateApi.post('/project', data);
    },
    updateProject: async (projectId: string, data: EditProjectData): Promise<void> => {
        return await privateApi.put(`/project/${projectId}`, data);
    },
    archiveProject: async (projectId: string): Promise<void> => {
        return await privateApi.patch(`/project/${projectId}/archive`);
    },
    unarchiveProject: async (projectId: string): Promise<void> => {
        return await privateApi.patch(`/project/${projectId}/unarchive`);
    },
    deleteProject: async (projectId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}`)
    },
    getDetailProject: async (projectId: string): Promise<ProjectDetailResponse> => {
        return await privateApi.get(`/project/${projectId}`);
    },

    //members
    sendInvitation: async (data: InviteMemberRequest): Promise<void> => {
        return await privateApi.post(`/project/${data.projectId}/invitation/send`, data);
    },
    acceptInvitation: async (token: string): Promise<ProjectMemberResponse> => {
        return await privateApi.post(`/project/invitation/accept`, {}, {
            params: {
                token: token
            }
        });
    },
    deleteMember: async (projectId: string, memberId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}/members/${memberId}`);
    },
    updateMemberRole: async (projectId: string, memberId: string, newRole: ProjectRole): Promise<void> => {
        return await privateApi.patch(`/project/${projectId}/members/${memberId}`, {}, {
            params: {
                role: newRole
            }
        });
    },
    //labels
    createLabel: async (projectId: string, data: LabelRequest): Promise<LabelResponse> => {
        return await privateApi.post(`/project/${projectId}/labels`, data);
    },
    updateLabel: async (projectId: string, labelId: string, data: LabelRequest): Promise<LabelResponse> => {
        return await privateApi.put(`/project/${projectId}/labels/${labelId}`, data);
    },
    deleteLabel: async (projectId: string, labelId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}/labels/${labelId}`);
    },

    //boardColumns
    createColumn: async (projectId: string, name: string): Promise<BoardColumnResponse> => {
        return await privateApi.post(`/project/${projectId}/board-columns`, {
            name: name
        })
    },
    updateColumn: async (projectId: string, columnId: string,
                         data: Partial<BoardColumnRequest>): Promise<BoardColumnResponse> => {
        return await privateApi.patch(`/project/${projectId}/board-columns/${columnId}`, {}, {
            params: data
        });
    },
    deleteColumn: async (projectId: string, columnId: string): Promise<void> => {
        return await privateApi.delete(`/project/${projectId}/board-columns/${columnId}`);
    },
    archiveColumn: async (projectId: string, columnId: string): Promise<BoardColumnResponse> => {
        return await privateApi.post(`/project/${projectId}/board-columns/${columnId}/archive`);
    },
    restoreColumn: async (projectId: string, columnId: string, sortOrder?: number): Promise<BoardColumnResponse> => {
        return await privateApi.post(`/project/${projectId}/board-columns/${columnId}/restore`,
            {}, {
                params: {
                    sortOrder: sortOrder
                }
            });
    },

    getItemArchived: async (projectId: string,page:number,size:number): Promise<PaginatedResponse<ArchivedItemResponse>> => {
        return await privateApi.get(`/project/${projectId}/archived`,{
            params: {
                page: page,
                size: size
            }
        });
    },
    getMyArchivedProjects: async (): Promise<ArchivedItemResponse[]> => {
        return await privateApi.get('/project/archived/me');
    },
}