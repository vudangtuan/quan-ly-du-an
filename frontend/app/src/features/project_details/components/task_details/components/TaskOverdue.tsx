import type {TaskDetailResponse} from "@/shared/types";
import React from "react";
import {useTask} from "../hooks";
import DatePicker from "react-datepicker";
import {Calendar, X} from "lucide-react";
import {formatDate} from "@/utils";


interface TaskOverdueProps {
    task: TaskDetailResponse;
}

export const TaskOverdue: React.FC<TaskOverdueProps> = ({task}) => {
    const {
        updateTaskMutation
    } = useTask(task);

    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-2">
            <div className="text-sm font-semibold text-gray-900 sm:text-gray-600 sm:font-medium sm:w-32 sm:pt-1.5">
                Hạn chót
            </div>
            <DatePicker
                selected={task.dueAt ? new Date(task.dueAt) : null}
                onChange={date => {
                    if (date) {
                        updateTaskMutation.mutate({dueAt: date.toISOString()});
                    } else {
                        updateTaskMutation.mutate({dueAt: "-1000000000-01-01T00:00:00Z"});
                    }
                }}
                minDate={new Date()}
                customInput={
                    <div className={"flex gap-1 items-center relative hover:bg-gray-100 p-1"}>
                        <button
                            title="Due date"
                            type="button"
                            className="p-1 text-gray-600 hover:text-gray-800 rounded-lg
                                       border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            <Calendar className="w-4 h-4"/>
                        </button>
                        {task.dueAt && (
                            <span className="text-sm text-gray-700">
                                {formatDate(task.dueAt)}
                            </span>
                        )}
                        {task.dueAt && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateTaskMutation.mutate({dueAt: "-1000000000-01-01T00:00:00Z"});
                                }}
                                className="p-0.5 rounded-full transition-colors z-10"
                                title="Xóa ngày"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </div>
                        )}
                    </div>
                }
            />
        </div>
    );
}