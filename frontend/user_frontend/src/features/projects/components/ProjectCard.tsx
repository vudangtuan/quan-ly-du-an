import type {ProjectResponse} from "@/shared/types";
import React, {useMemo} from "react";
import {formatDate, isOverdue} from "@/utils";
import {AlertTriangle, CalendarDays, Crown, MoreHorizontal, Users} from "lucide-react";
import {Menu} from "@/shared/components";
import {useProjectMenu} from "@/features/projects/hooks";
import {useAuthStore} from "@/store";


interface ProjectCardProps {
    project: ProjectResponse;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({project}) => {
    const userId = useAuthStore(state => state.userInfo!.userId);
    const {menuItems} = useProjectMenu(project, userId);

    const overdue = useMemo(() => {
        return isOverdue(project.dueAt);
    }, [project.dueAt]);


    return (
        <>
            <Menu items={menuItems}
                  trigger={<MoreHorizontal size={18} className={"absolute top-2 right-2"}/>}>
                <div
                    className="flex h-full transform flex-col rounded-xl border border-gray-200
                 bg-white shadow-sm transition-all duration-200">
                    <div className="flex flex-col gap-4 p-5 pr-7">
                        {/* 1. Tên dự án */}
                        <div className="flex items-start gap-1 mt-2 justify-start min-h-[4rem]">
                            <span className="text-md font-semibold text-gray-900 line-clamp-2 ">
                                {project.name}
                                {project.currentRoleInProject === 'OWNER' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5
                                                   bg-amber-50 text-amber-700 text-xs font-medium
                                                   rounded-full w-fit">
                                        <Crown className="h-3 w-3"/>
                                </span>
                                )}
                            </span>

                        </div>

                        {/* 2. Mô tả */}
                        <div className="flex-1 min-h-[4rem]">
                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                {project.description || '(Không có mô tả)'}
                            </p>
                        </div>
                    </div>

                    {/* 4. Footer - Thành viên và Deadline */}
                    <div className="mt-auto border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 rounded-b-xl">
                        <div className="flex items-center justify-between">
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                <Users className="h-3.5 w-3.5"/>
                                <span className="text-xs font-medium">{project.members} thành viên</span>
                            </div>
                            {/* Deadline */}
                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
                                ${overdue
                                    ? "bg-red-50 text-red-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                                title={overdue ? "Đã quá hạn!" : "Ngày đến hạn"}
                            >
                                {overdue ? (
                                    <AlertTriangle className="h-4 w-4"/>
                                ) : (
                                    <CalendarDays className="h-4 w-4"/>
                                )}
                                <span className="text-xs">{formatDate(project.dueAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Menu>
        </>
    );
};