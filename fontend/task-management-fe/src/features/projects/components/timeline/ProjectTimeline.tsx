import React, {useMemo, useState} from "react";
import {BoardColumnResponse} from "@features/projects/types/project.types";
import {TaskResponse} from "@features/projects/types/task.types";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {Calendar, CheckCircle2, Circle, Eye} from "lucide-react";
import {formatDate} from "@features/utils/date.utils";
import {TaskDetailModal} from "@features/projects/components/taskdetails/TaskDetailModal";
import {TaskContextMenu} from "@features/projects/components/TaskContextMenu";

export const ProjectTimeline: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();

    const sortedTasks = useMemo(() => {
        if (!allTasks) return [];
        return [...allTasks].sort((a, b) => {
            const dateA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
            const dateB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [allTasks]);


    const getColumnName = (columnId: string) => {
        const column = projectDetail?.boardColumns?.find(
            (c: BoardColumnResponse) => c.boardColumnId === columnId
        );
        return column?.name || "Không xác định";
    };

    const isOverdue = (dueDate: string | null, completed: boolean) => {
        if (!dueDate || completed) return false;
        return new Date(dueDate) < new Date();
    };

    if (!sortedTasks || sortedTasks.length === 0) {
        return (
            <div className="p-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        Chưa có nhiệm vụ nào
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-8 h-full overflow-auto">
                <div>
                    <div className="relative">
                        {/* Đường thẳng dọc */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        {/* Danh sách tasks */}
                        <div className="space-y-6">
                            {sortedTasks.map((task: TaskResponse) => (
                                <TaskContextMenu
                                    key={task.taskId}
                                    task={task}
                                    projectId={projectDetail.projectId}
                                    currentRole={projectDetail.currentRoleInProject}
                                    className={"top-3 right-0"}
                                >
                                    <div className="relative flex gap-4 group">
                                        {/* Icon timeline */}
                                        <div className="relative z-10 flex-shrink-0">
                                            {task.completed ? (
                                                <div
                                                    className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-4 border-white group-hover:scale-110 transition-transform">
                                                    <CheckCircle2 className="w-6 h-6 text-green-600"/>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white group-hover:scale-110 transition-transform ${
                                                        isOverdue(task.dueAt, task.completed)
                                                            ? 'bg-red-100'
                                                            : 'bg-blue-100'
                                                    }`}>
                                                    <Circle className={`w-6 h-6 ${
                                                        isOverdue(task.dueAt, task.completed)
                                                            ? 'text-red-600'
                                                            : 'text-blue-600'
                                                    }`}/>
                                                </div>
                                            )}
                                        </div>

                                        {/* Nội dung task */}
                                        <div className="flex-1 pb-6">
                                            <div
                                                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                                                <div className="flex items-start gap-4 mb-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {task.title}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        task.completed
                                                            ? 'bg-green-100 text-green-700'
                                                            : isOverdue(task.dueAt, task.completed)
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                            {task.completed
                                                                ? 'Hoàn thành'
                                                                : isOverdue(task.dueAt, task.completed)
                                                                    ? 'Quá hạn'
                                                                    : 'Đang thực hiện'
                                                            }
                                                     </span>
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4"/>
                                                        <span>{formatDate(task.dueAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                                        <span>{getColumnName(task.boardColumnId)}</span>
                                                    </div>
                                                    {task.priority && (
                                                        <span className={`px-2 py-0.5 rounded ${
                                                            task.priority === 'HIGH'
                                                                ? 'bg-red-100 text-red-700'
                                                                : task.priority === 'MEDIUM'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                    {task.priority === 'HIGH'
                                                        ? 'High'
                                                        : task.priority === 'MEDIUM'
                                                            ? 'Medium'
                                                            : 'Low'
                                                    }
                                                </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TaskContextMenu>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}