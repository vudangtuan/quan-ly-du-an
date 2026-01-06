import {TaskService} from "@/shared/services";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import type {TaskDetailResponse} from "@/shared/types";
import toast from "react-hot-toast";


export const useChecklist = (task: TaskDetailResponse) => {
    const {projectId, taskId} = task;
    const queryClient = useQueryClient();

    const createCheckListMutation = useMutation({
        mutationFn: (body: string | null) =>
            TaskService.createCheckList(projectId, taskId, body),
        onSuccess: (newItem) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: [...(old.checkLists || []), newItem]
                };
            });
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
        mutationFn: (checkListId: string) =>
            TaskService.deleteCheckList(projectId, taskId, checkListId),
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["task", taskId], (old: TaskDetailResponse) => {
                return {
                    ...old,
                    checkLists: old.checkLists.filter(c => c.checkListId !== variables)
                };
            });
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    return {createCheckListMutation, updateCheckListMutation, deleteCheckListMutation};
}