import type { TaskDetailResponse } from "@/shared/types";
import React, { useMemo } from "react";
import { useProjectDetail } from "@/features/project_details/hooks";
import { Avatar } from "@/shared/components";
import { UserPlus, X } from "lucide-react";
import { MembersPopover } from "@/features/project_details/components";
import { useTask } from "@/features/project_details/components/task_details/hooks";

interface TaskAssigneesProps {
    task: TaskDetailResponse
}

export const TaskAssignees: React.FC<TaskAssigneesProps> = ({ task }) => {
    const { projectDetail } = useProjectDetail(task.projectId);

    const assignees = useMemo(() => {
        if (!projectDetail || !projectDetail.members || !task.assigneeIds) return [];
        return projectDetail.members.filter(m => task.assigneeIds.includes(m.userId));
    }, [projectDetail, task.assigneeIds]);

    const { handleToggleMember, deleteAssigneeMutation } = useTask(task);

    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-2">
            <div className="text-sm font-semibold text-gray-900 sm:text-gray-600 sm:font-medium sm:w-32 sm:pt-1.5">
                Người thực hiện
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
                {assignees.map((assignee) => {
                    return (
                        <div
                            key={assignee.userId}
                            className="
                                group flex items-center gap-2 pl-1 pr-2 py-1
                                bg-gray-50 hover:bg-gray-100 border border-gray-200
                                rounded-full transition-all duration-200
                                cursor-default
                            "
                        >
                            <Avatar
                                userId={assignee.userId}
                                className="w-6 h-6"
                                fullName={assignee.fullName}
                            />
                            <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                                {assignee.fullName}
                            </span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Tránh sự kiện lan ra ngoài
                                    deleteAssigneeMutation.mutate(assignee.userId);
                                }}
                                className="
                                    p-0.5 rounded-full hover:bg-red-100 hover:text-red-600
                                    text-gray-400 transition-colors
                                "
                                title="Gỡ bỏ"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}

                <MembersPopover
                    members={projectDetail!.members}
                    selectedMemberIds={task.assigneeIds}
                    toggleMembers={handleToggleMember}
                >
                    <button
                        className={`
                            flex items-center gap-2 px-3 py-1 rounded-full border border-dashed transition-all
                            ${assignees.length === 0
                            ? "bg-white border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
                            : "w-8 h-8 justify-center border-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        }
                        `}
                        title="Thêm người thực hiện"
                    >
                        <UserPlus className="h-4 w-4" />
                        {assignees.length === 0 && <span className="text-sm">Chưa giao</span>}
                    </button>
                </MembersPopover>
            </div>
        </div>
    );
}