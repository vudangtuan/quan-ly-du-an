import type { TaskDetailResponse } from "@/shared/types";
import React, { useEffect, useMemo, useRef } from "react";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { useChecklist } from "@/features/project_details/components/task_details/hooks";

interface TaskCheckListsProps {
    task: TaskDetailResponse
}

export const TaskCheckLists: React.FC<TaskCheckListsProps> = ({ task }) => {
    const refs = useRef<Record<string, HTMLInputElement | null>>({});

    const {
        createCheckListMutation,
        deleteCheckListMutation,
        updateCheckListMutation
    } = useChecklist(task);

    // Tính toán tiến độ
    const progress = useMemo(() => {
        if (task.checkLists.length === 0) return 0;
        const completed = task.checkLists.filter(c => c.done).length;
        return Math.round((completed / task.checkLists.length) * 100);
    }, [task.checkLists]);

    useEffect(() => {
        task.checkLists.forEach(c => {
            if (refs.current[c.checkListId]) {
                refs.current[c.checkListId]!.value = c.body;
            }
        });
    }, [task.checkLists]);

    const handleSave = (checkListId: string, currentBody: string, newBody: string) => {
        const trimmedBody = newBody.trim();
        if (trimmedBody && trimmedBody !== currentBody) {
            updateCheckListMutation.mutate({
                checkListId: checkListId,
                data: { body: trimmedBody }
            }, {
                onError: () => {
                    // Reset lại giá trị cũ nếu lỗi
                    if (refs.current[checkListId]) {
                        refs.current[checkListId]!.value = currentBody;
                    }
                }
            });
        } else {
            if (refs.current[checkListId]) {
                refs.current[checkListId]!.value = currentBody;
            }
        }
    };

    return (
        <div className="p-2 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-gray-600">
                        <CheckSquare size={16} className="text-gray-500" />
                        Danh sách công việc
                    </div>
                    {task.checkLists.length > 0 && (
                        <span className="text-xs font-medium text-gray-500">
                            {progress}%
                        </span>
                    )}
                </div>

                {task.checkLists.length > 0 && (
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                                progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Checklist Items */}
            <div className="space-y-1">
                {task.checkLists.map((c) => (
                    <div
                        key={c.checkListId}
                        className="group flex items-center-safe gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => refs.current[c.checkListId]?.focus()}
                    >
                        {/* Checkbox */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={c.done}
                                onChange={(e) => {
                                    updateCheckListMutation.mutate({
                                        checkListId: c.checkListId,
                                        data: { done: e.target.checked }
                                    });
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                        </div>

                        {/* Input Content */}
                        <div className="flex-1 min-w-0">
                            <input
                                ref={(el) => { refs.current[c.checkListId] = el; }}
                                defaultValue={c.body}
                                disabled={c.done}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                    }
                                }}
                                onBlur={(e) => handleSave(c.checkListId, c.body, e.target.value)}
                                className={`
                                    w-full bg-transparent border-none p-0 text-sm focus:ring-0
                                    placeholder-gray-400 transition-all
                                    ${c.done ? "line-through text-gray-400" : "text-gray-800"}
                                `}
                                placeholder="Nhập nội dung công việc..."
                            />
                        </div>

                        {/* Delete Button: Mobile hiện luôn, Desktop hover mới hiện */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteCheckListMutation.mutate(c.checkListId);
                            }}
                            className="
                                p-1 -m-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all
                                opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                            "
                            title="Xóa công việc"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={() => {
                    createCheckListMutation.mutate(null, {
                        onSuccess: (data) => {
                            setTimeout(() => refs.current[data.checkListId]?.focus(), 50);
                        }
                    });
                }}
                className="
                    flex items-center gap-2 px-3 py-2 mt-1 rounded-lg border border-dashed border-gray-300
                    text-sm text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50
                    transition-all group w-full sm:w-fit
                "
            >
                <Plus size={16} className="group-hover:scale-110 transition-transform" />
                Thêm công việc
            </button>
        </div>
    );
}