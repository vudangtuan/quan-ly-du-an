import {privateApi} from "@/shared/api";

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
}


export const ChatService = {
    chat: (projectId: string, data: { body: string, memberIds: string[] }): Promise<string> => {
        return privateApi.post(`ai/chat`, data, {
            params: {
                projectId,
            },
            timeout: 300000,
        })
    },
    getChatHistory: (projectId: string, createdAt?: string): Promise<Message[]> => {
        return privateApi.get(`ai/message`, {
            params: {
                projectId,
                createdAt,
            }
        });
    },
    deleteChat:(projectId: string) => {
        return privateApi.delete(`ai/chat/${projectId}`, {})
    }
}