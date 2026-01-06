import {type InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService, TaskService} from "@/shared/services";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {useMemo} from "react";
import toast from "react-hot-toast";
import type {
    ArchivedItemResponse,
    PaginatedResponse, ProjectDetailResponse,
    TaskResponse
} from "@/shared/types";
import {useConfirm} from "@/confirm_dialog";

export const removeItemFromInfiniteQuery = (
    old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>,
    itemId: string
): InfiniteData<PaginatedResponse<ArchivedItemResponse>> => {
    if (!old) return old;

    return {
        ...old,
        pages: old.pages.map((page) => {
            const filtered = page.content
                .filter((item) => item.itemId !== itemId);
            const isDeleted = filtered.length < page.content.length;

            return isDeleted ? {
                ...page,
                content: filtered,
                totalElements: page.totalElements - 1,
                totalPages: Math.ceil((page.totalElements - 1) / page.size)
            } : page;
        })
    };
};


export const useStorage = (projectId: string) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const {data, isFetchingNextPage, isLoading, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ["archived", projectId],
        queryFn: ({pageParam = 0}) => {
            return ProjectService.getItemArchived(projectId, pageParam, 10);
        },
        enabled: !!projectId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
    });

    const items = useMemo(() =>
            data?.pages.flatMap(page => page.content) || [],
        [data]);

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) =>
            TaskService.deleteTask(projectId, taskId),
        onError: (err: Error) => {
            toast.error(err.message);
        },
        onSuccess: (_data, taskId) => {
            queryClient.setQueryData(
                ["archived", projectId],
                (old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>) =>
                    removeItemFromInfiniteQuery(old, taskId)
            );
        },
    });

    const deleteColumnMutation = useMutation({
        mutationFn: (boardColumnId: string) =>
            ProjectService.deleteColumn(projectId, boardColumnId),
        onError: (e) => {
            toast.error(e.message);
        },
        onSuccess: (_data, boardColumnId) => {
            queryClient.setQueryData(
                ["archived", projectId],
                (old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>) =>
                    removeItemFromInfiniteQuery(old, boardColumnId)
            );
        },
    });

    const restoreTaskMutation = useMutation({
        mutationFn: (taskId: string) =>
            TaskService.restoreTask(projectId, taskId),
        onError: (e) => {
            toast.error(e.message);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["tasks", projectId], (old: TaskResponse[]) => {
                return [...old, data];
            });
            queryClient.setQueryData(
                ["archived", projectId],
                (old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>) =>
                    removeItemFromInfiniteQuery(old, data.taskId)
            );
        }
    });

    const restoreColumnMutation = useMutation({
        mutationFn: (boardColumnId: string) =>
            ProjectService.restoreColumn(projectId, boardColumnId),
        onError: (err) => {
            toast.error(err.message);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["projectDetails", projectId], (old: ProjectDetailResponse) => {
                return {
                    ...old,
                    boardColumns: [...old.boardColumns || [], data]
                }
            });
            queryClient.setQueryData(
                ["archived", projectId],
                (old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>) =>
                    removeItemFromInfiniteQuery(old, data.boardColumnId)
            );
            queryClient.invalidateQueries({queryKey: ["tasks", data.projectId]});
        }
    });
    const handleRestoreItem = (item: ArchivedItemResponse) => {
        if (item.type === 'TASK') {
            restoreTaskMutation.mutate(item.itemId);
        }
        if (item.type === 'COLUMN') {
            restoreColumnMutation.mutate(item.itemId);
        }
    }
    const handleDeleteItem = async (item: ArchivedItemResponse) => {
        const confirmed = await confirm({
            title: 'Xóa?',
            description: `Bạn có chắc chắn muốn xóa "${item.name}"?`,
            confirmText: 'Xóa',
            warningText: 'Không thể khôi phục lại được',
            isLoading: deleteColumnMutation.isPending || deleteTaskMutation.isPending,
            type: 'danger',
        });
        if (confirmed) {
            if (item.type === 'TASK') {
                deleteTaskMutation.mutate(item.itemId);
            }
            if (item.type === 'COLUMN') {
                deleteColumnMutation.mutate(item.itemId);
            }
        }
    }

    return {
        items, handleDeleteItem, handleRestoreItem,
        isFetchingNextPage, isLoading, hasNextPage, fetchNextPage
    };
}