import React, {useMemo} from "react";
import {useLocation, useNavigate, useOutletContext} from "react-router-dom";
import {Calendar, CheckCircle2, Circle, Layers, Clock, Eye} from "lucide-react";
import type {ProjectDetailContext} from "@/features/project_details";
import type {BoardColumnResponse, TaskResponse} from "@/shared/types";
import {formatDate} from "@/utils";
import {LabelBadge} from "@/shared/components";

export const ProjectTimeline: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();
    const navigate = useNavigate();
    const location = useLocation();

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
                <div
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-12 shadow-sm">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            <Layers className="w-8 h-8 text-gray-400"/>
                        </div>
                        <p className="text-gray-500 text-lg font-medium">Chưa có nhiệm vụ nào</p>
                        <p className="text-gray-400 text-sm">Thêm nhiệm vụ mới để bắt đầu theo dõi tiến độ</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full overflow-auto bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-4xl mx-auto">
                <div className="relative">
                    {/* Danh sách tasks */}
                    <div className="space-y-6">
                        {sortedTasks.map((task: TaskResponse, index) => (
                            <div key={task.taskId || index} className="relative flex gap-6 group">
                                {/* Thanh dọc màu */}
                                <div className="relative z-10 flex-shrink-0">
                                    {task.completed ? (
                                        <div
                                            className="w-1 h-full bg-gradient-to-b from-green-400 to-green-600 rounded-full shadow-md group-hover:w-2 transition-all duration-300"></div>
                                    ) : isOverdue(task.dueAt, task.completed) ? (
                                        <div
                                            className="w-1 h-full bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-md group-hover:w-2 transition-all duration-300"></div>
                                    ) : (
                                        <div
                                            className="w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-md group-hover:w-2 transition-all duration-300"></div>
                                    )}
                                </div>

                                {/* Nội dung task */}
                                <div className="flex-1" onClick={() => {
                                    navigate(`/project/${projectDetail.projectId}/task/${task.taskId}`, {
                                        state: {backgroundLocation: location}
                                    });
                                }}>
                                    <div
                                        className="bg-white relative rounded-xl p-5 border group border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200 hover:translate-x-1">
                                        <div className={"absolute top-0 right-0 p-2"}>
                                            <Eye
                                                className={" hover:text-gray-600 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"}/>
                                        </div>
                                        {/* Status badge */}
                                        {task.completed ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-3">
                                                <CheckCircle2 className="w-3 h-3"/>
                                                Hoàn thành
                                            </span>
                                        ) : isOverdue(task.dueAt, task.completed) ? (
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-3">
                                                <Clock className="w-3 h-3"/>
                                                Quá hạn
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mb-3">
                                                <Circle className="w-3 h-3"/>
                                                Đang thực hiện
                                            </span>
                                        )}

                                        <div className={"flex gap-2"}>
                                            {projectDetail.labels
                                                .filter(l => task.labelIds.includes(l.labelId))
                                                .map(l => <LabelBadge label={l}/>)}
                                        </div>


                                        <h3 className="font-semibold text-gray-900 text-lg mb-3">
                                            {task.title}
                                        </h3>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <div
                                                    className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-blue-600"/>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Hạn chót</div>
                                                    <div className="font-medium">{formatDate(task.dueAt)}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-600">
                                                <div
                                                    className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                                    <Layers className="w-4 h-4 text-purple-600"/>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Cột</div>
                                                    <div
                                                        className="font-medium">{getColumnName(task.boardColumnId)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}