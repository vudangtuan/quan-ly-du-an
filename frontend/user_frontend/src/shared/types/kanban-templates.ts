import type {BoardColumnRequest, LabelRequest} from "./project.types";
import {Bug, Code, FileText,
    LayoutGrid, Megaphone, PenTool, TrendingUp, Users} from "lucide-react";

export interface KanbanTemplate {
    name: string;
    displayName: string;
    description: string;
    boardColumns: BoardColumnRequest[];
    labels: LabelRequest[];
    color: string;
    icon: any;
}

export const KANBAN_TEMPLATES: Record<string, KanbanTemplate> = {
    EMPTY: {
        name: 'EMPTY',
        displayName: 'Dự án rỗng',
        description: 'Bắt đầu từ đầu, tự tạo các cột theo ý bạn',
        boardColumns: [],
        labels: [],
        color: 'bg-gray-100 text-gray-600',
        icon: FileText,
    },

    BASIC: {
        name: 'BASIC',
        displayName: 'Dự án cơ bản',
        description: 'Bảng đơn giản 3 cột cơ bản: Todo, In Progress và Done',
        boardColumns: [
            { name: 'Todo', sortOrder: 1.0 },
            { name: 'In Progress', sortOrder: 2.0 },
            { name: 'Done', sortOrder: 3.0 },
        ],
        labels: [
            { name: 'Urgent', color: '#FF0000' },
            { name: 'Important', color: '#FFA500' },
        ],
        color: 'bg-blue-100 text-blue-600',
        icon: LayoutGrid,
    },

    SOFTWARE_DEV: {
        name: 'SOFTWARE_DEV',
        displayName: 'Phát triển phần mềm',
        description: 'Chu trình phát triển phần mềm đầy đủ từ thiết kế đến triển khai',
        boardColumns: [
            { name: 'Backlog', sortOrder: 1.0 },
            { name: 'Design', sortOrder: 2.0 },
            { name: 'Development', sortOrder: 3.0 },
            { name: 'Code Review', sortOrder: 4.0 },
            { name: 'QA Testing', sortOrder: 5.0 },
            { name: 'UAT', sortOrder: 6.0 },
            { name: 'Deployed', sortOrder: 7.0 },
        ],
        labels: [
            { name: 'Bug', color: '#D73A4A' },
            { name: 'Feature', color: '#0E8A16' },
            { name: 'Tech Debt', color: '#FBCA04' },
            { name: 'UI/UX', color: '#5319E7' },
        ],
        color: 'bg-purple-100 text-purple-600',
        icon: Code,
    },

    BUG_TRACKING: {
        name: 'BUG_TRACKING',
        displayName: 'Theo dõi lỗi',
        description: 'Quản lý và theo dõi các báo cáo lỗi từ phát hiện đến khắc phục',
        boardColumns: [
            { name: 'Reported', sortOrder: 1.0 },
            { name: 'Confirmed', sortOrder: 2.0 },
            { name: 'In Progress', sortOrder: 3.0 },
            { name: 'Fixed', sortOrder: 4.0 },
            { name: 'Testing', sortOrder: 5.0 },
            { name: 'Closed', sortOrder: 6.0 },
        ],
        labels: [
            { name: 'Critical', color: '#B30000' },
            { name: 'High', color: '#D73A4A' },
            { name: 'Medium', color: '#FBCA04' },
            { name: 'Low', color: '#0E8A16' },
        ],
        color: 'bg-red-100 text-red-600',
        icon: Bug,
    },

    MARKETING: {
        name: 'MARKETING',
        displayName: 'Chiến dịch Marketing',
        description: 'Theo dõi các chiến dịch marketing từ ý tưởng đến triển khai',
        boardColumns: [
            { name: 'Ideas', sortOrder: 1.0 },
            { name: 'Planning', sortOrder: 2.0 },
            { name: 'Content Creation', sortOrder: 3.0 },
            { name: 'Review', sortOrder: 4.0 },
            { name: 'Scheduled', sortOrder: 5.0 },
            { name: 'Published', sortOrder: 6.0 },
        ],
        labels: [
            { name: 'Social Media', color: '#1DA1F2' },
            { name: 'Email', color: '#DB4437' },
            { name: 'Blog Post', color: '#FF6600' },
            { name: 'Ad Campaign', color: '#4285F4' },
        ],
        color: 'bg-pink-100 text-pink-600',
        icon: Megaphone,
    },

    SALES_PIPELINE: {
        name: 'SALES_PIPELINE',
        displayName: 'Quy trình bán hàng',
        description: 'Theo dõi khách hàng tiềm năng qua từng giai đoạn bán hàng',
        boardColumns: [
            { name: 'Lead', sortOrder: 1.0 },
            { name: 'Contacted', sortOrder: 2.0 },
            { name: 'Qualified', sortOrder: 3.0 },
            { name: 'Proposal', sortOrder: 4.0 },
            { name: 'Negotiation', sortOrder: 5.0 },
            { name: 'Closed Won', sortOrder: 6.0 },
        ],
        labels: [
            { name: 'Hot Lead', color: '#D73A4A' },
            { name: 'Warm Lead', color: '#FFA500' },
            { name: 'Cold Lead', color: '#1DA1F2' },
            { name: 'Demo Scheduled', color: '#0E8A16' },
        ],
        color: 'bg-green-100 text-green-600',
        icon: TrendingUp,
    },

    CONTENT_CREATION: {
        name: 'CONTENT_CREATION',
        displayName: 'Sản xuất nội dung',
        description: 'Quy trình tạo và xuất bản nội dung hoàn chỉnh',
        boardColumns: [
            { name: 'Idea Pool', sortOrder: 1.0 },
            { name: 'Research', sortOrder: 2.0 },
            { name: 'Writing', sortOrder: 3.0 },
            { name: 'Editing', sortOrder: 4.0 },
            { name: 'Design', sortOrder: 5.0 },
            { name: 'Published', sortOrder: 6.0 },
        ],
        labels: [
            { name: 'Draft', color: '#6A737D' },
            { name: 'In Review', color: '#FBCA04' },
            { name: 'Needs Graphics', color: '#5319E7' },
            { name: 'Final', color: '#0E8A16' },
        ],
        color: 'bg-orange-100 text-orange-600',
        icon: PenTool,
    },

    HR_RECRUITMENT: {
        name: 'HR_RECRUITMENT',
        displayName: 'Tuyển dụng',
        description: 'Quản lý quy trình tuyển dụng từ ứng tuyển đến nhận việc',
        boardColumns: [
            { name: 'Applied', sortOrder: 1.0 },
            { name: 'Screening', sortOrder: 2.0 },
            { name: 'Phone Interview', sortOrder: 3.0 },
            { name: 'Technical Interview', sortOrder: 4.0 },
            { name: 'Final Interview', sortOrder: 5.0 },
            { name: 'Offer', sortOrder: 6.0 },
            { name: 'Hired', sortOrder: 7.0 },
        ],
        labels: [
            { name: 'Frontend', color: '#1DA1F2' },
            { name: 'Backend', color: '#D73A4A' },
            { name: 'DevOps', color: '#FFA500' },
            { name: 'Senior', color: '#0E8A16' },
            { name: 'Junior', color: '#FBCA04' },
        ],
        color: 'bg-teal-100 text-teal-600',
        icon: Users,
    },
};

export const getTemplateByName = (name: string): KanbanTemplate | undefined => {
    return KANBAN_TEMPLATES[name];
};

export const getAllTemplates = (): KanbanTemplate[] => {
    return Object.values(KANBAN_TEMPLATES);
};

export const getTemplateNames = (): string[] => {
    return Object.keys(KANBAN_TEMPLATES);
};
