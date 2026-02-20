import type {FileResponse, TaskDetailResponse, TaskRequest, TaskResponse} from "@/shared/types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";
import toast from "react-hot-toast";
import {useEffect, useRef, useState} from "react";
import {showArchiveToast} from "@/utils";
import {useLocation, useNavigate} from "react-router-dom";

export const useTask = (task: TaskDetailResponse) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { backgroundLocation?: Location };
    const tasksRef = useRef<TaskResponse[] | undefined>(null);

    const [editTask, setEditTask] = useState<Partial<TaskDetailResponse>>(task);

    useEffect(() => {
        setEditTask(task);
    }, [task])

    const updateTaskMutation = useMutation({
        mutationFn: (data: Partial<TaskRequest>) =>
            TaskService.updateTask(task.projectId, task.taskId, data),
        onSuccess: (_, variables) => {
            if (variables.dueAt === "-1000000000-01-01T00:00:00Z") {
                variables.dueAt = null;
            }
            queryClient.setQueryData(["task", task.taskId], (old: TaskDetailResponse) => ({...old, ...variables}));
            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ? {...o, ...variables} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
            handleCancel();
        }
    });

    const updateDoneTaskMutation = useMutation({
        mutationFn: (complete: boolean) =>
            TaskService.updateDone(task.projectId, task.taskId, complete),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", task.taskId], (old: TaskDetailResponse) => ({
                ...old,
                completed: variables
            }));
            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ? {...o, completed: variables} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const restoreTaskMutation = useMutation({
        mutationFn: (sortOrder?: number) =>
            TaskService.restoreTask(task.projectId, task.taskId, sortOrder),
        onError: (e) => {
            toast.error(e.message);
        },
        onSuccess: () => {
            if (tasksRef.current) {
                queryClient.setQueryData(["tasks", task.projectId], tasksRef.current);
            }
            queryClient.invalidateQueries({queryKey: ["task", task.taskId]});
        }
    });

    const archiveTaskMutation = useMutation({
        mutationFn: () => TaskService.archiveTask(task.projectId, task.taskId),
        onError: (e) => {
            toast.error(e.message);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({queryKey: ["tasks", task.projectId]});
            tasksRef.current = queryClient.getQueryData(["tasks", task.projectId]);
        },
        onSuccess: () => {
            if (state?.backgroundLocation) {
                navigate(-1);
            } else {
                navigate(`/project/${task.projectId}/kanban`);
            }
            showArchiveToast({
                itemName: task.title, onRestore: () => {
                    restoreTaskMutation.mutate(task.sortOrder)
                }
            });
            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) => {
                return old.filter(t => t.taskId !== task.taskId);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["archived", task.projectId]});
        },
    });

    const addAssigneeMutation = useMutation({
        mutationFn: (assigneeId: string) =>
            TaskService.addAssigneeTask(task.projectId, task.taskId, assigneeId),
        onSuccess: (_, variables) => {

            queryClient.setQueryData(["task", task.taskId],
                (old: TaskDetailResponse) =>
                    ({...old, assigneeIds: [...old.assigneeIds, variables]}));

            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ? {...o, assigneeIds: [...o.assigneeIds, variables]} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const deleteAssigneeMutation = useMutation({
        mutationFn: (assigneeId: string) =>
            TaskService.deleteAssigneeTask(task.projectId, task.taskId, assigneeId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", task.taskId],
                (old: TaskDetailResponse) =>
                    ({...old, assigneeIds: old.assigneeIds.filter(a => a !== variables)}));

            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ?
                    {...o, assigneeIds: o.assigneeIds.filter(a => a !== variables)} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const addLabelMutation = useMutation({
        mutationFn: (labelId: string) =>
            TaskService.addLabelTask(task.projectId, task.taskId, labelId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", task.taskId],
                (old: TaskDetailResponse) =>
                    ({...old, labelIds: [...old.labelIds, variables]}));

            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ? {...o, labelIds: [...o.labelIds, variables]} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })
    const deleteLabelMutation = useMutation({
        mutationFn: (labelId: string) =>
            TaskService.deleteLabelTask(task.projectId, task.taskId, labelId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", task.taskId],
                (old: TaskDetailResponse) =>
                    ({...old, labelIds: old.labelIds.filter(a => a !== variables)}));

            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ?
                    {...o, labelIds: o.labelIds.filter(a => a !== variables)} : o)
            );
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })
    const uploadFileMutation = useMutation({
        mutationFn: (file: File) => TaskService.uploadFile(task.projectId, task.taskId, file),
        onSuccess: (res) => {
            queryClient.setQueryData(['task-files', task.projectId, task.taskId],
                (old: FileResponse[]) => [...old, res]);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })
    const deleteFileMutation = useMutation({
        mutationFn: (key: string) => TaskService.deleteFile(key),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(['task-files', task.projectId, task.taskId],
                (old: FileResponse[]) => old.filter(o => o.key !== variables));
        },
        onError: (e) => {
            console.log(e);
            toast.error(e.message);
        }
    })


    const handleSetEditTask = (value: Partial<TaskDetailResponse>) => {
        setEditTask(prevState => {
            return {...prevState, ...value}
        })
    }
    const handleCancel = () => {
        setEditTask(task);
    }
    const handleToggleMember = (memberId: string) => {
        if (task.assigneeIds.includes(memberId)) {
            deleteAssigneeMutation.mutate(memberId);
        } else {
            addAssigneeMutation.mutate(memberId);
        }
    }
    const handleToggleLabel = (labelId: string) => {
        if (task.labelIds.includes(labelId)) {
            deleteLabelMutation.mutate(labelId);
        } else {
            addLabelMutation.mutate(labelId);
        }
    }

    const moveTaskMutation = useMutation({
        mutationFn: (newBoardColumnId: string) =>
            TaskService.moveTask(task.projectId, task.taskId, {
                boardColumnId: newBoardColumnId,
                sortOrder: -1
            }),
        onError: (err) => {
            toast.error(err.message);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["task", task.taskId],
                (old: TaskDetailResponse) => {
                    return {...old, sortOrder: data.sortOrder, boardColumnId: data.boardColumnId}
                });
            queryClient.setQueryData(["tasks", task.projectId], (old: TaskResponse[]) =>
                old.map(o => o.taskId === task.taskId ? data : o)
            );
        }
    });


    return {
        updateTaskMutation, editTask, handleSetEditTask,
        handleCancel, updateDoneTaskMutation, archiveTaskMutation,
        handleToggleMember, deleteAssigneeMutation,
        handleToggleLabel, deleteLabelMutation,
        moveTaskMutation, uploadFileMutation, deleteFileMutation
    }
}