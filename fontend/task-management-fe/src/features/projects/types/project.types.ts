export interface ProjectResponse {
    projectId: string;
    name: string;
    description: string;
    dueAt: string | null;
    currentRoleInProject: ProjectRole;
    members: number
}

export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    dueAt?: string | null;
    labels: LabelRequest[];
    boardColumns: BoardColumnRequest[];
    member: ProjectMemberRequest[];
}


export interface ProjectMemberResponse {
    userId: string;
    fullName: string;
    email: string;
    roleInProject: string
    projectId: string
}

export interface InviteMemberRequest {
    projectId: string;
    memberId: string;
    role: ProjectRole
}

export interface EditProjectData {
    name: string;
    description: string;
    dueAt: string;
}

export interface LabelResponse {
    labelId: string;
    name: string;
    color: string;
    projectId: string;
}

export interface LabelRequest {
    name: string;
    color: string;
}

export interface BoardColumnRequest {
    name: string;
    sortOrder: number;
}

export interface ProjectMemberRequest {
    memberId: string;
    role: ProjectRole;
}

export interface BoardColumnResponse {
    boardColumnId: string;
    name: string;
    sortOrder: number;
    status: Status;
    projectId: string;
}

export interface ProjectDetailResponse {
    projectId: string;
    name: string;
    description: string;
    createdAt: string | null;
    updatedAt: string | null;
    dueAt: string | null;
    status: Status;
    creator: ProjectMemberResponse;
    currentRoleInProject: ProjectRole;

    labels: LabelResponse[];
    boardColumns: BoardColumnResponse[];
    members: ProjectMemberResponse[];
}


export type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'COMMENTER'
export type Status = 'ACTIVE' | 'ARCHIVED'

