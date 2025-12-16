import type {TaskDetailResponse} from "@/shared/types";
import React, {useEffect, useMemo, useRef} from "react";
import {Plus, Trash2} from "lucide-react";
import {useChecklist} from "@/features/project_details/components/task_details/hooks";


interface TaskCheckListsProps {
    task: TaskDetailResponse
}

export const TaskCheckLists: React.FC<TaskCheckListsProps> = ({task}) => {
    const completedCheckLists = useMemo(() => {
        return task.checkLists.filter(checkList => checkList.done).length
    }, [task]);
    const refs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        task.checkLists.map(c => {
            if (refs.current[c.checkListId]) {
                refs.current[c.checkListId]!.value = c.body;
            }
        })
    }, [task.checkLists]);

    const {
        createCheckListMutation,
        deleteCheckListMutation,
        updateCheckListMutation
    } = useChecklist(task);
    return (
        <div className="space-y-2 text-xs px-2">
            {task.checkLists.length > 0 &&
                <>
                    <div>
                        Công việc cần làm
                    </div>
                    <div className="relative max-w-sm bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                            style={{width: `${(completedCheckLists / task.checkLists.length) * 100}%`}}
                        >
                        <span className="text-xs font-medium text-white">
                            {Math.round((completedCheckLists / task.checkLists.length) * 100)}%
                        </span>
                        </div>
                    </div>
                </>
            }
            <div>
                {task.checkLists.map((c) => (
                    <div onClick={() => {
                        refs.current[c.checkListId]?.focus();
                    }}
                         key={c.checkListId}
                         className="flex cursor-pointer p-0.5 items-center gap-2 group hover:bg-gray-100">
                        <span className={"space-x-2 flex-1"}>
                            <input
                                title={c.done ? "đánh dấu chưa hoàn thành" : "đánh dấu hoàn thành"}
                                checked={c.done}
                                type="checkbox"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onChange={(e) => {
                                    updateCheckListMutation.mutate({
                                        checkListId: c.checkListId, data: {
                                            done: e.target.checked,
                                        }
                                    })
                                }}
                                className="h-4 w-4 ring-0 rounded-full border-gray-300 text-green-600 cursor-pointer"
                            />
                            <input
                                ref={(el) => {
                                    refs.current[c.checkListId] = el;
                                }}
                                onBlur={(e) => {
                                    if (e.relatedTarget) {
                                        const newBody = e.target.value.trim();
                                        if (newBody && newBody !== c.body) {
                                            updateCheckListMutation.mutate({
                                                checkListId: c.checkListId,
                                                data: {body: newBody}
                                            }, {
                                                onError: () => {
                                                    if (refs.current[c.checkListId]) {
                                                        refs.current[c.checkListId]!.value = c.body;
                                                    }
                                                }
                                            });
                                            return;
                                        }
                                    }
                                }}
                                disabled={c.done}
                                className={`h-full cursor-pointer text-xs p-1 px-2 max-w-50
                                 ring-0 bg-transparent border-transparent focus:border-gray-400
                                  ${c.done ? "line-through text-gray-500" : "text-gray-900"}`}
                            />
                        </span>

                        <button className="opacity-0 group-hover:opacity-100 p-1 text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCheckListMutation.mutate(c.checkListId)
                                }}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </button>
                    </div>
                ))}
            </div>
            <button
                onClick={() => {
                    createCheckListMutation.mutate(null, {
                        onSuccess: (data) => {
                            setTimeout(() => {
                                refs.current[data.checkListId]?.focus();
                            }, 0);
                        }
                    })
                }}
                className={"flex gap-1 border p-1.5 rounded-md border-gray-300 group hover:bg-gray-50 hover:border-gray-400"}>
                <Plus size={16} className={"text-gray-400 group-hover:text-gray-600"}/>
                Thêm công việc
            </button>
        </div>
    );
}