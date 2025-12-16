import {useState} from "react";
import {type InfiniteData, useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@/shared/services";
import type {
    ArchivedItemResponse,
    BoardColumnResponse,
    PaginatedResponse,
    ProjectDetailResponse,
    TaskResponse
} from "@/shared/types";
import toast from "react-hot-toast";
import {showArchiveToast} from "@/utils";
import {removeItemFromInfiniteQuery} from "@/features/project_details/tabs/archived/useStorage";


export const useColumn = (column: BoardColumnResponse) => {
    const queryClient = useQueryClient();
    const [isEditColumn, setIsEditColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState(column.name);


    const createColumnMutation = useMutation({
        mutationFn: () => ProjectService.createColumn(column.projectId, newColumnName),
        onSuccess: (data: BoardColumnResponse) => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: [...old.boardColumns, data]
                }));
            setIsEditColumn(false);
            setNewColumnName("");
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const updateColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.updateColumn(column.projectId, column.boardColumnId, {name: newColumnName}),
        onSuccess: (data: BoardColumnResponse) => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.map((c: BoardColumnResponse) =>
                        c.boardColumnId === column.boardColumnId ? data : c
                    )
                }));
            setIsEditColumn(false);
            setNewColumnName(data.name);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const restoreColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.restoreColumn(column.projectId, column.boardColumnId, column.sortOrder),
        onError: (err) => {
            toast.error(err.message);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: [...old.boardColumns, data]
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                }));
            queryClient.invalidateQueries({ queryKey: ["tasks", column.projectId] });
        },
        onSettled: () => {
            queryClient.setQueryData(
                ["archived", column.projectId],
                (old: InfiniteData<PaginatedResponse<ArchivedItemResponse>>) =>
                    removeItemFromInfiniteQuery(old, column.boardColumnId)
            );
        }
    });

    const archiveColumnMutation = useMutation({
        mutationFn: () =>
            ProjectService.archiveColumn(column.projectId, column.boardColumnId),
        onSuccess: () => {
            queryClient.setQueryData(["projectDetails", column.projectId],
                (old: ProjectDetailResponse) => ({
                    ...old,
                    boardColumns: old.boardColumns.filter((c: BoardColumnResponse) =>
                        c.boardColumnId !== column.boardColumnId)
                }));
            queryClient.setQueryData(["tasks", column.projectId], (old: TaskResponse[]) => {
                return old.filter(o => o.boardColumnId !== column.boardColumnId);
            });
            showArchiveToast({
                itemName: column.name, onRestore: () => {
                    restoreColumnMutation.mutate();
                }
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({queryKey: ["archived", column.projectId]});
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    return {
        isEditColumn,
        setIsEditColumn,
        newColumnName,
        setNewColumnName,
        createColumnMutation,
        updateColumnMutation,
        archiveColumnMutation
    }
}