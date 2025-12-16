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
        <div className="space-y-2">
            <div className={"px-2 text-xs"}>Mô tả</div>
            <textarea
                className="w-full text-xs p-2 resize-none h-25 rounded-xl
                 focus:ring-0 leading-relaxed border-transparent hover:border-gray-400"
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