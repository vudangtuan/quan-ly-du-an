import React, {useState, useEffect} from "react";
import {FileText, Edit2} from "lucide-react";
import {TaskDetailResponse} from "@features/projects/types/task.types";

interface TaskDescriptionProps {
    task: TaskDetailResponse;
    canManage: boolean;
    updateTask: (data: any) => void;
    isError: boolean;
}

export const TaskDescription: React.FC<TaskDescriptionProps> = ({task, canManage, updateTask,isError}) => {
    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    useEffect(() => {
        setDescription(task.description);
    }, [task.description]);

    useEffect(() => {
        if(isError){
            setDescription(task.description);
        }
    }, [isError, task.description]);

    const handleSaveDes = () => {
        updateTask({description});
        setIsEditingDescription(false);
    };

    return (
        <div className="space-y-2 group">
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4"/>
                <h3 className="text-sm font-semibold text-gray-700">Mô tả</h3>
                {canManage && !task.completed && (
                    <button onClick={() => setIsEditingDescription(true)}>
                        <Edit2
                            className="h-4 w-4 text-gray-500 cursor-pointer hidden group-hover:block transition-all"/>
                    </button>
                )}
            </div>

            {isEditingDescription ? (
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) handleSaveDes();
                        if (e.key === 'Escape') {
                            setDescription(task.description);
                            setIsEditingDescription(false);
                        }
                    }}
                    onBlur={() => {
                        setDescription(task.description);
                        setIsEditingDescription(false);
                    }}
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    placeholder="Thêm mô tả cho nhiệm vụ..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm text-gray-900
                        border-2 border-blue-500 rounded-lg resize-y
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            ) : (
                <div className="min-h-[80px] px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    {description ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {description}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400 italic">
                            Chưa có mô tả
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};