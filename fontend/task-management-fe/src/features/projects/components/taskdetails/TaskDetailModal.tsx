// components/TaskDetailModal/index.tsx
import React, {useEffect, useMemo} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {Loader2, X} from "lucide-react";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@features/projects/services/TaskService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {TaskRequest} from "@features/projects/types/task.types";
import toast from "react-hot-toast";
import {isOverdue} from "@features/utils/date.utils";
import {TaskHeader} from "./TaskHeader";
import {TaskMeta} from "./TaskMeta";
import {TaskDescription} from "./TaskDescription";
import {TaskMetaInfo} from "./TaskMetaInfo";
import {TaskChecklist} from "./TaskChecklist";
import {TaskComments} from "./TaskComments";
import {TaskActivity} from "@features/projects/components/taskdetails/TaskActivity";

interface TaskDetailModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({taskId, isOpen, onClose}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const queryClient = useQueryClient();

    const {data: task, isLoading, error} = useQuery({
        queryKey: ["task", taskId],
        queryFn: () => TaskService.getTask(project.projectId, taskId),
        enabled: isOpen && !!taskId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT
    });

    const canManage = useMemo(() => {
        return ["OWNER", "EDITOR"].includes(project.currentRoleInProject);
    }, [project]);

    const isTaskOverdue = useMemo(() => {
        if (!task) return null;
        return isOverdue(task.dueAt, task.completed);
    }, [task]);

    const creator = useMemo(() => {
        if (!task || !project.members) return null;
        return project.members.find(m => m.userId === task.creatorId);
    }, [task, project]);

    // Update task mutation
    const updateTaskMutation = useMutation({
        mutationFn: (data: Partial<TaskRequest>) =>
            TaskService.updateTask(project.projectId, taskId, data),
        onSuccess: (_, variables) => {
            if (variables.dueAt === "-1000000000-01-01T00:00:00Z") {
                variables.dueAt = null;
            }
            queryClient.setQueryData(["task", taskId], (old: any) => ({...old, ...variables}));
            queryClient.setQueryData(["tasks", project.projectId], (old: any[]) =>
                old.map(o => o.taskId === taskId ? {...o, ...variables} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    // Complete task mutation
    const updateDoneTaskMutation = useMutation({
        mutationFn: (complete: boolean) =>
            TaskService.updateDone(project.projectId, taskId, complete),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", taskId], (old: any) => ({...old, completed: variables}));
            queryClient.setQueryData(["tasks", project.projectId], (old: any[]) =>
                old.map(o => o.taskId === taskId ? {...o, completed: variables} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in
                    data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500"/>

                <Dialog.Content
                    aria-describedby=""
                    className={`fixed right-0 top-0 z-50 h-full w-4/5 max-w-3xl flex flex-col
                        bg-white shadow-2xl overflow-hidden
                        data-[state=open]:animate-in data-[state=closed]:animate-out
                        data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
                        duration-500 ease-in-out ${isTaskOverdue ? 'shadow-red-500 border-l-4 border-red-500' : ''}`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200
                        bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                        <Dialog.Title className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                            Chi tiết nhiệm vụ
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100
                                    hover:text-gray-600 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin"/>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <span className="font-semibold text-red-500">Có lỗi xảy ra or đã bị xóa</span>
                        </div>
                    ) : (
                        <div className="overflow-auto flex-1">
                            <div className="p-6 space-y-6">
                                <TaskHeader
                                    task={task}
                                    canManage={canManage}
                                    isTaskOverdue={isTaskOverdue}
                                    updateTask={updateTaskMutation.mutate}
                                    updateDone={updateDoneTaskMutation.mutate}
                                    isError={updateTaskMutation.isError ||
                                        updateDoneTaskMutation.isError}
                                />

                                <TaskMeta
                                    task={task}
                                    project={project}
                                    canManage={canManage}
                                    isError={updateTaskMutation.isError}
                                />

                                <TaskDescription
                                    task={task}
                                    canManage={canManage}
                                    updateTask={updateTaskMutation.mutate}
                                    isError={updateTaskMutation.isError}
                                />

                                <TaskMetaInfo
                                    task={task}
                                    creator={creator}
                                    canManage={canManage}
                                    updateTask={updateTaskMutation.mutate}
                                    isUpdating={updateTaskMutation.isPending}
                                    isError={updateTaskMutation.isError}
                                />

                                <TaskChecklist
                                    task={task}
                                    project={project}
                                    taskId={taskId}
                                    projectId={project.projectId}
                                />

                                <TaskComments
                                    taskId={taskId}
                                    comments={task.comments}
                                />
                                <TaskActivity taskId={taskId}/>
                            </div>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};