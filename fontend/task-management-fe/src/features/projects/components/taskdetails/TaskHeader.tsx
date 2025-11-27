import React, {useEffect, useState} from "react";
import {Edit2} from "lucide-react";
import {TaskDetailResponse} from "@features/projects/types/task.types";

interface TaskHeaderProps {
    task: TaskDetailResponse;
    canManage: boolean;
    isTaskOverdue: boolean | null;
    updateTask: (data: any) => void;
    updateDone: (completed: boolean) => void;
    isError: boolean;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
                                                          task,
                                                          canManage,
                                                          isTaskOverdue,
                                                          updateTask,
                                                          updateDone,
                                                          isError,
                                                      }) => {
    const [title, setTitle] = useState("");
    const [completed, setCompleted] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    useEffect(() => {
        setTitle(task.title);
        setCompleted(task.completed);
    }, [task.title, task.completed]);
    useEffect(() => {
        if(isError){
            setTitle(task.title);
            setCompleted(task.completed);
        }
    }, [isError, task.completed, task.title]);

    const handleSaveTitle = () => {
        updateTask({title});
        setIsEditingTitle(false);
    };

    return (
        <div className="space-y-3">
            {isEditingTitle ? (
                <div className="flex-1 flex items-start gap-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') {
                                setTitle(task.title);
                                setIsEditingTitle(false);
                            }
                        }}
                        onBlur={() => {
                            setIsEditingTitle(false);
                            setTitle(task.title);
                        }}
                        onFocus={(e) => e.target.select()}
                        autoFocus
                        className="flex-1 text-xl font-semibold text-gray-900
                            rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            ) : (
                <div className="flex items-start gap-3 justify-between">
                    <input
                        type="checkbox"
                        disabled={!canManage}
                        checked={completed}
                        onChange={(e) => {
                            setCompleted(e.target.checked);
                            updateDone(e.target.checked);
                        }}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600
                            focus:ring-blue-500 cursor-pointer"
                    />

                    <div className={`text-xl group font-semibold flex-1 space-x-3 ${
                        completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                        <span>{title}</span>
                        {canManage && !completed && (
                            <button onClick={() => setIsEditingTitle(true)}>
                                <Edit2 className="h-4 w-4 text-gray-500 cursor-pointer
                                    hidden group-hover:inline-block transition-all"/>
                            </button>
                        )}
                    </div>

                    {completed && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            Hoàn thành
                        </span>
                    )}
                    {isTaskOverdue && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                            Quá hạn
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};