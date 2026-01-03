import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {AdminService} from "@/shared/services";
import * as Tabs from '@radix-ui/react-tabs';
import {Clock, Globe, Shield} from "lucide-react";
import {UserActivityTab, UserSecurityTab, UserSessionTab} from "@/features/admin/components";


export const UserDetail: React.FC = () => {
    const {userId} = useParams();
    const navigate = useNavigate();

    const {data: user, isLoading} = useQuery({
        queryKey: ['user', userId],
        queryFn: () => AdminService.getUserById(userId!),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId
    });
    if (isLoading) {
        return;
    }

    return (
        <div>
            <div className="w-max">
                <div className="flex items-center h-12 px-4 gap-4 text-sm">

                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium transition-colors shrink-0"
                    >
                        Quay lại
                    </button>

                    <div className="h-4 w-px bg-gray-300 shrink-0"></div>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-semibold text-gray-900 truncate">{user?.fullName}</span>
                        <span className="text-gray-500 truncate hidden sm:inline">({user?.email})</span>
                    </div>

                    <div className="h-4 w-px bg-gray-300 shrink-0 hidden sm:block"></div>

                    <div className="shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user?.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {user?.status}
                    </span>
                    </div>
                </div>
            </div>

            <Tabs.Root defaultValue="logs" className="w-full flex flex-col gap-6">

                {/* --- 1. TAB LIST (Thanh chứa các nút) --- */}
                <Tabs.List className="flex w-full border-b border-gray-200">

                    {/* Trigger: LOGS */}
                    <Tabs.Trigger
                        value="logs"
                        className="
                        group flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 outline-none transition-all
                        hover:text-gray-900
                        data-[state=active]:text-blue-600
                        data-[state=active]:border-b-2 data-[state=active]:border-blue-600
                        data-[state=active]:bg-blue-50/30
                    "
                    >
                        <Clock className="w-4 h-4"/>
                        Nhật ký
                    </Tabs.Trigger>

                    {/* Trigger: SESSIONS */}
                    <Tabs.Trigger
                        value="sessions"
                        className="
                        group flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 outline-none transition-all
                        hover:text-gray-900
                        data-[state=active]:text-blue-600
                        data-[state=active]:border-b-2 data-[state=active]:border-blue-600
                        data-[state=active]:bg-blue-50/30
                    "
                    >
                        <Globe className="w-4 h-4"/>
                        Phiên đăng nhập
                    </Tabs.Trigger>

                    {/* Trigger: SECURITY */}
                    <Tabs.Trigger
                        value="security"
                        className="
                        group flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 outline-none transition-all
                        hover:text-gray-900
                        data-[state=active]:text-blue-600
                        data-[state=active]:border-b-2 data-[state=active]:border-blue-600
                        data-[state=active]:bg-blue-50/30
                    "
                    >
                        <Shield className="w-4 h-4"/>
                        Bảo mật
                    </Tabs.Trigger>

                </Tabs.List>

                {/* --- 2. TAB CONTENT (Nội dung từng tab) --- */}

                {/* Nội dung Logs */}
                <Tabs.Content value="logs" className="outline-none animate-in fade-in duration-300">
                    <UserActivityTab user={user!}/>
                </Tabs.Content>

                {/* Nội dung Sessions */}
                <Tabs.Content value="sessions" className="outline-none animate-in fade-in duration-300">
                    <UserSessionTab user={user!}/>
                </Tabs.Content>

                {/* Nội dung Security */}
                <Tabs.Content value="security" className="outline-none animate-in fade-in duration-300">
                    <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm min-h-[200px]">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt bảo mật</h3>
                        <UserSecurityTab user={user!}/>
                    </div>
                </Tabs.Content>

            </Tabs.Root>
        </div>
    );
}