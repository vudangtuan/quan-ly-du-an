import type {ProjectRole} from "@/shared/types";
import React from "react";


interface RoleBadgeProps {
    role: ProjectRole;
    className?: string;
}

const roleConfig = {
    OWNER: {
        label: "Owner",
        colors: "bg-purple-100 text-purple-700 border-purple-200"
    },
    EDITOR: {
        label: "Editor",
        colors: "bg-blue-100 text-blue-700 border-blue-200"
    },
    COMMENTER: {
        label: "Commenter",
        colors: "bg-green-100 text-green-700 border-green-200"
    },
    VIEWER: {
        label: "Viewer",
        colors: "bg-gray-100 text-gray-700 border-gray-200"
    }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({role, className}) => {
    const config = roleConfig[role];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
             text-xs font-medium border ${config.colors} ${className}`}>
            {config.label}
        </span>
    );
}


