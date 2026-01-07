import type {TaskDetailResponse} from "@/shared/types";
import React from "react";
import {useTask} from "../hooks";


interface TaskTitleProps {
    task: TaskDetailResponse;
}

export const TaskTitle: React.FC<TaskTitleProps> = ({task}) => {
    const {
        updateTaskMutation, handleCancel,
        handleSetEditTask, editTask
    } = useTask(task);

    return (
        <input
            value={editTask.title}
            onChange={(e) => {
                handleSetEditTask({title: e.target.value})
            }}
            placeholder={"Tiêu đề nhiệm vụ"}
            onBlur={(e) => {
                if (e.relatedTarget) {
                    if (editTask.title?.trim() && editTask.title.trim() !== task.title) {
                        updateTaskMutation.mutate({title: editTask.title.trim()});
                    } else {
                        handleCancel();
                    }
                }

            }}
            className={"border-1 font-medium text-xl py-1.5 px-2 md:border-transparent hover:border-black transform-border duration-300"}
        />
    );
}