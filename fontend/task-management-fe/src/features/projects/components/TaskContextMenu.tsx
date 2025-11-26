import React, {useState} from "react";
import {TaskResponse} from "@features/projects/types/task.types";
import {Archive, Eye, Trash2} from "lucide-react";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useConfirm} from "@components/ConfirmDialog";
import toast from "react-hot-toast";
import {TaskService} from "@features/projects/services/TaskService";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TaskDetailModal} from "@features/projects/components/kanban/TaskDetailModal";

interface TaskContextMenuProps {
    task: TaskResponse;
    projectId: string;
    currentRole: string;
    children: React.ReactNode;
    className?: string
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
                                                                    task,
                                                                    projectId,
                                                                    currentRole,
                                                                    className,
                                                                    children
                                                                }) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [openDetailTask, setOpenDetailTask] = useState(false);

    const canManage = () => {
        if (currentRole === "VIEWER" || currentRole === "COMMENTER") {
            toast.error("Bạn không có quyền thực hiện");
            return false;
        }
        return true;
    };

    // Mutations
    const restoreTaskMutation = useMutation({
        mutationFn: (sortOrder: number) =>
            TaskService.restoreTask(projectId, task.taskId, sortOrder),
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const archiveTaskMutation = useMutation({
        mutationFn: () => TaskService.archiveTask(projectId, task.taskId),
        onMutate: () => {
            const previousData: TaskResponse[] = queryClient.getQueryData(["tasks", projectId])!;
            queryClient.setQueryData(["tasks", projectId], (old: TaskResponse[]) => {
                return old.filter(t => t.taskId !== task.taskId);
            });
            return {previousData};
        },
        onError: (e, _, onMutateResult) => {
            if (onMutateResult?.previousData) {
                queryClient.setQueryData(["tasks", projectId], onMutateResult.previousData);
            }
            toast.error(e.message);
        },
        onSuccess: (_, __, onMutateResult) => {
            toast.success(
                (t) => (
                    <span className="flex items-center gap-3">
                        <span>Đã lưu trữ "{task.title}"</span>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                if (onMutateResult?.previousData) {
                                    await restoreTaskMutation.mutateAsync(task.sortOrder);
                                    queryClient.setQueryData(["tasks", projectId],
                                        onMutateResult.previousData);
                                }
                            }}
                            className="px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
                        >
                            Hoàn tác
                        </button>
                    </span>
                ),
                {duration: 5000}
            );
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: () => TaskService.deleteTask(projectId, task.taskId),
        onError: (err: Error) => {
            toast.error(err.message);
        },
        onSuccess: () => {
            toast.success("Xóa thành công");
            queryClient.setQueryData<TaskResponse[]>(["tasks", projectId],
                (old) => {
                    if (!old) return [];
                    return old.filter((t: TaskResponse) => t.taskId !== task.taskId);
                });
        }
    });

    // Menu items
    const menuItems: MenuItem[] = [
        {
            label: 'Xem chi tiết',
            icon: <Eye className="h-4 w-4"/>,
            onClick: () => setOpenDetailTask(true),
        },
        {
            divider: true,
            label: '',
            onClick: () => {
            },
        },
        {
            label: "Lưu trữ",
            icon: <Archive className="h-4 w-4"/>,
            onClick: () => {
                if (canManage()) {
                    archiveTaskMutation.mutate();
                }
            }
        },
        {
            label: 'Xóa',
            icon: <Trash2 className="h-4 w-4"/>,
            onClick: async () => {
                if (canManage()) {
                    const confirmed = await confirm({
                        title: 'Xóa?',
                        description: `Bạn có chắc chắn muốn xóa task "${task.title}"?`,
                        warningText: "Mọi thứ trong task sẽ bị xóa hết. Không thể khôi phục lại!",
                        confirmText: 'Xóa',
                        isLoading: deleteTaskMutation.isPending,
                        type: 'danger',
                    });
                    if (confirmed) {
                        deleteTaskMutation.mutate();
                    }
                }
            },
            danger: true,
        },
    ];

    return (
        <>
            <ContextMenu
                items={menuItems}
                trigger="both"
                showButton={true}
                buttonClassName={className ? className : "top-2 right-2"}
            >
                {children}
            </ContextMenu>

            {openDetailTask&&
            <TaskDetailModal
                isOpen={openDetailTask}
                onClose={() => setOpenDetailTask(false)}
                taskId={task.taskId}
            />}
        </>
    );
};