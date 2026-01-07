import type {TaskDetailResponse} from "@/shared/types";
import React from "react";
import {useTask} from "@/features/project_details/components/task_details/hooks";

interface TaskDescriptionProps {
    task: TaskDetailResponse
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({task}) => {
    const {updateTaskMutation, handleCancel,
        handleSetEditTask, editTask} = useTask(task);
    return (
        <div className="p-2 space-y-2">
            <div className="text-sm font-semibold text-gray-900 sm:text-gray-600 sm:font-medium">
                Mô tả
            </div>
            <textarea
                className="w-full text-sm p-2 resize-none h-25 rounded
                 focus:ring-0 leading-relaxed md:border-transparent hover:border-gray-400"
                placeholder="Mô tả cho nhiệm vụ ..."
                value={editTask.description}
                onChange={(e) => {
                    handleSetEditTask({description: e.target.value})
                }}
                onBlur={(e) => {
                    if (e.relatedTarget) {
                        if (editTask.description?.trim() && editTask.description.trim() !== task.description) {
                            updateTaskMutation.mutate({description: editTask.description.trim()});
                        } else {
                            handleCancel();
                        }
                    }

                }}
            />
        </div>
    );
}