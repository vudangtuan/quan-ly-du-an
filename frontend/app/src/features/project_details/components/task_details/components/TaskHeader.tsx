import React from "react";
import {Archive, Check, X} from "lucide-react";
import type {TaskDetailResponse} from "@/shared/types";
import {useTask} from "@/features/project_details/components/task_details/hooks";
import * as Dialog from "@radix-ui/react-dialog"


interface TaskHeaderProps {
    task: TaskDetailResponse
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({task}) => {
    const {updateDoneTaskMutation, archiveTaskMutation} = useTask(task);

    return (
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <button
                onClick={() => updateDoneTaskMutation.mutate(!task.completed)}
                className={`flex items-center gap-1 px-4 py-1 text-sm rounded-md transition-colors ${
                    task.completed ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >
                <Check size={16}/>
                <span className={"text-xs"}>
                     Hoàn thành
                </span>
            </button>
            <div className="flex items-center p-1 gap-2" title={"Lưu trữ nhiệm vụ"}>
                <button
                    onClick={() => archiveTaskMutation.mutate()}
                    title={"Lưu trữ"}
                    className="hover:bg-gray-100 p-1 rounded-md text-gray-600">
                    <Archive className={"h-5 w-5"}/>
                </button>
                <Dialog.Close>
                    <button
                        className="hover:bg-gray-100 p-1 rounded-md text-gray-600">
                        <X className={"h-5 w-5"}/>
                    </button>
                </Dialog.Close>
            </div>

        </div>
    );
}