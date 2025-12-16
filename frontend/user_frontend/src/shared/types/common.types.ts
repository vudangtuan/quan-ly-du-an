export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean
}

export interface Activity {
    id: string;
    projectId: string;
    taskId: string;
    actorId: string;
    actorName: string;
    actorEmail: string;
    actionType: string;
    description: string;
    targetId: string;
    targetName: string;
    createdAt: string;
    metadata?: {
        changes?: ChangeLog[];
        [key: string]: any;
    };
}

export interface ChangeLog {
    field: string;
    old: string | null;
    new: string | null;
}

export interface AppNotification {
    id: string;
    recipientId:string;
    subject:string;
    content:string;
    isRead:boolean;
    properties:Record<string, any>;
    createdAt:string;
}