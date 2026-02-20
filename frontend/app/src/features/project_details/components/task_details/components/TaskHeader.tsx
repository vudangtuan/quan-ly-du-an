import React, {useRef} from "react";
import {Archive, Check, Paperclip, X} from "lucide-react";
import type {TaskDetailResponse} from "@/shared/types";
import {useTask} from "@/features/project_details/components/task_details/hooks";
import * as Dialog from "@radix-ui/react-dialog"


interface TaskHeaderProps {
    task: TaskDetailResponse
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({task}) => {
    const {updateDoneTaskMutation, archiveTaskMutation, uploadFileMutation} = useTask(task);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
           uploadFileMutation.mutate(file);
        }
        event.target.value = '';
    };
    return (
        <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
            <button
                onClick={() => updateDoneTaskMutation.mutate(!task.completed)}
                className={`flex items-center gap-1 px-4 py-1 text-sm rounded-md transition-colors ${
                    task.completed
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
            >
                <Check size={16}/>
                <span className={"text-sm"}>
                     {task.completed ? "Đã hoàn thành" : "Hoàn thành"}
                </span>
            </button>

            <div className="flex items-center p-1 gap-2" title={"Lưu trữ nhiệm vụ"}>
                <button
                    onClick={()=>fileInputRef.current?.click()}
                    title={"Thêm tệp"}
                    className="hover:bg-gray-800 p-1 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Paperclip className={"h-5 w-5"}/>
                </button>
                <button
                    onClick={() => archiveTaskMutation.mutate()}
                    title={"Lưu trữ"}
                    className="hover:bg-gray-800 p-1 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Archive className={"h-5 w-5"}/>
                </button>
                <Dialog.Close asChild>
                    <button
                        className="hover:bg-gray-800 p-1 rounded-md text-gray-400 hover:text-white transition-colors">
                        <X className={"h-5 w-5"}/>
                    </button>
                </Dialog.Close>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}