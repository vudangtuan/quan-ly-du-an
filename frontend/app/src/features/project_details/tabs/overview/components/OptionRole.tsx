import {Edit2, Eye, MessageSquare} from "lucide-react";
import type {ProjectRole} from "@/shared/types";
import React from "react";

const options: Array<{
    value: Exclude<ProjectRole, "OWNER">;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}> = [
    {
        value: "EDITOR",
        label: "Editor",
        description: "Tạo, chỉnh sửa và xóa task, quản lý nội dung dự án",
        icon: <Edit2 className="h-4 w-4"/>,
        color: "text-blue-600",
    },
    {
        value: "COMMENTER",
        label: "Commenter",
        description: "Tham gia task và có thể bình luận",
        icon: <MessageSquare className="h-4 w-4"/>,
        color: "text-green-600",
    },
    {
        value: "VIEWER",
        label: "Viewer",
        description: "Chỉ xem dự án, không thể tương tác",
        icon: <Eye className="h-4 w-4"/>,
        color: "text-gray-600",
    },
];

interface OptionRoleProps {
    selectedRole: Exclude<ProjectRole, 'OWNER'>;
    setSelectedRole: (role: Exclude<ProjectRole, 'OWNER'>) => void;
    isLoading?: boolean;
}

export const OptionRole: React.FC<OptionRoleProps> = ({selectedRole, setSelectedRole, isLoading}) => {
    return (
        <div className="space-y-2 mb-3">
            {options.map((o) => (
                <div
                    key={o.value}
                    onClick={() => setSelectedRole(o.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                                transition-all duration-150
                                ${selectedRole === o.value
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {/* Radio button */}
                    <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                         ${selectedRole === o.value
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300 bg-white"
                        }`}>
                            {selectedRole === o.value && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                            )}
                        </div>
                    </div>

                    {/* Role info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={o.color}>{o.icon}</span>
                            <span className="font-medium text-sm text-gray-900">
                                                {o.label}
                                            </span>
                        </div>
                        <p className="text-xs text-gray-600">{o.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}