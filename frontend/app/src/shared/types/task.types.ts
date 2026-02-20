export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "ACTIVE" | "ARCHIVED"

export interface TaskResponse {
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    createdAt: string;
    dueAt: string | null;
    completed: boolean;
    sortOrder: number;
    status: TaskStatus;

    creatorId: string;
    projectId: string;
    boardColumnId: string;
    assigneeIds: string[];
    labelIds: string[];

    projectName: string;
}

export interface TaskRequest {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueAt?: string | null;

    projectId: string;
    boardColumnId: string;
    assigneeIds: string[];
    labelIds: string[];
    checkLists: string[];
}

export interface CheckListResponse {
    checkListId: string;
    body: string;
    taskId: string;
    creatorId: string;
    done: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommentResponse {
    commentId: string;
    body: string;
    creatorId: string;
    taskId: string;
    createdAt: string;
    updatedAt: string;
    mentionIds: string[];
}

export interface TaskDetailResponse {
    taskId: string;
    title: string;
    description: string;
    status: TaskStatus;
    sortOrder: number;
    priority: TaskPriority;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
    dueAt: string;

    projectId: string;
    boardColumnId: string;
    creatorId: string;
    assigneeIds: string[];
    labelIds: string[];

    comments: CommentResponse[];
    checkLists: CheckListResponse[];
}

export interface FileResponse {
    fileName: string;
    key: string;
    size: number;
}