import React, {useState, useMemo, useEffect} from "react";
import {ListCheck, Plus, Check, X} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@features/projects/services/TaskService";
import toast from "react-hot-toast";
import {CheckListResponse, TaskDetailResponse} from "@features/projects/types/task.types";
import {ProjectDetailResponse} from "@features/projects/types/project.types";

interface TaskChecklistProps {
    task: TaskDetailResponse;
    project: ProjectDetailResponse;
    taskId: string;
    projectId: string;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({task, project, taskId, projectId}) => {
    const queryClient = useQueryClient();
    const [checkList, setCheckList] = useState<CheckListResponse[]>([]);
    const [isAddCheckList, setIsAddCheckList] = useState(false);
    const [newCheckListBody, setNewCheckListBody] = useState("");

    useEffect(() => {
        if (task) {
            setCheckList(task.checkLists);
        }
    }, [task]);

    const completedCheckLists = useMemo(() => {
        return checkList.filter(c => c.done).length;
    }, [checkList]);

    const createCheckListMutation = useMutation({
        mutationFn: (body: string) =>
            TaskService.createCheckList(projectId, taskId, body),
        onSuccess: (newItem) => {
            setCheckList((prev) => [...prev, newItem]);
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                if (!old) return old;
                return {
                    ...old,
                    checkLists: [...(old.checkLists || []), newItem]
                };
            });
            setNewCheckListBody("");
            setIsAddCheckList(false);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const updateCheckListMutation = useMutation({
        mutationFn: ({checkListId, data}: { checkListId: string, data: { body?: string, done?: boolean } }) =>
            TaskService.updateCheckList(projectId, taskId, checkListId, data),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: old.checkLists.map(c =>
                        c.checkListId === variables?.checkListId ? data : c
                    )
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const deleteCheckListMutation = useMutation({
        mutationFn: ({checkListId}: { checkListId: string }) =>
            TaskService.deleteCheckList(projectId, taskId, checkListId),
        onSuccess: (_, variables) => {
            setCheckList(prev => prev.filter(c => c.checkListId !== variables.checkListId));
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: old.checkLists.filter(c => c.checkListId !== variables.checkListId)
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const handleAddCheckList = () => {
        createCheckListMutation.mutate(newCheckListBody);
    };

    const handleDeleteCheckList = (checkListId: string) => {
        deleteCheckListMutation.mutate({checkListId});
    };

    const canEdit = project.currentRoleInProject !== "VIEWER" && !task.completed;

    return (
        <div className="space-y-2">
            <div className="group flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ListCheck className="h-4 w-4"/>
                    Danh sách công việc
                </label>
                {checkList.length > 0 && (
                    <span className="text-sm text-gray-500 font-medium">
                        {completedCheckLists}/{checkList.length}
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => setIsAddCheckList(true)}
                    className={`inline-flex items-center px-3 py-1
                        text-sm text-gray-600 border border-dashed border-gray-300
                        rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors
                        ${canEdit ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
                >
                    <Plus className="h-4 w-4"/>
                </button>
            </div>

            {/* Progress bar */}
            {checkList.length > 0 && (
                <div className="relative max-w-sm bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                        style={{width: `${(completedCheckLists / checkList.length) * 100}%`}}
                    >
                        <span className="text-xs font-medium text-white">
                            {Math.round((completedCheckLists / checkList.length) * 100)}%
                        </span>
                    </div>
                </div>
            )}

            {/* Add new checklist */}
            {isAddCheckList && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCheckListBody}
                        onChange={(e) => setNewCheckListBody(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCheckList()}
                        autoFocus
                        placeholder="Thêm checklist..."
                        className="flex-1 px-2 py-1 max-w-sm text-sm border rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                        disabled={createCheckListMutation.isPending || !newCheckListBody.trim()}
                        onClick={handleAddCheckList}
                        className="p-1.5 cursor-pointer hover:bg-green-50 rounded text-green-600 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="h-4 w-4"/>
                    </button>
                    <button
                        disabled={createCheckListMutation.isPending}
                        onClick={() => setIsAddCheckList(false)}
                        className="p-1.5 hover:bg-red-50 cursor-pointer rounded text-red-600 transition-colors
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            )}

            {/* Checklist items */}
            {checkList.map(c => (
                <div key={c.checkListId} className="flex items-center gap-2 group">
                    <input
                        disabled={task.completed || project.currentRoleInProject === "VIEWER"}
                        checked={c.done}
                        onChange={(e) => {
                            updateCheckListMutation.mutate({
                                checkListId: c.checkListId,
                                data: {done: e.target.checked}
                            });
                        }}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                    <span className={`text-sm ${c.done || task.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {c.body}
                    </span>
                    {canEdit && (
                        <button
                            onClick={() => handleDeleteCheckList(c.checkListId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};