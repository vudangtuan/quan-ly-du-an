import React, {useMemo} from "react";
import {useInfiniteQuery, useMutation} from "@tanstack/react-query";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {ProjectService} from "@features/projects/services/ProjectService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {
    ArchiveRestore,
    Clock, Loader2,
    Trash2,
} from "lucide-react";
import {formatDateLocalDate} from "@features/utils/date.utils";
import {TaskService} from "@features/projects/services/TaskService";
import toast from "react-hot-toast";
import {ArchivedItemResponse} from "@features/projects/types/project.types";
import {useConfirm} from "@components/ConfirmDialog";


export const ProjectStorage: React.FC = () => {
    const {projectDetail,archivedItemsInfiniteQuery} = useOutletContext<ProjectDetailContext>();
    const confirm = useConfirm();
    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = archivedItemsInfiniteQuery;
    const items = useMemo(() =>
            data?.pages.flatMap(page => page.content) || [],
        [data]);


    const deleteTaskMutation = useMutation({
        mutationFn: ({taskId}: { taskId: string }) =>
            TaskService.deleteTask(projectDetail.projectId, taskId),
        onError: (err: Error) => {
            toast.error(err.message);
        }
    });

    const deleteColumnMutation = useMutation({
        mutationFn: ({boardColumnId}: { boardColumnId: string }) =>
            ProjectService.deleteColumn(projectDetail.projectId, boardColumnId),
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const restoreTaskMutation = useMutation({
        mutationFn: ({taskId}: { taskId: string }) =>
            TaskService.restoreTask(projectDetail.projectId, taskId),
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const restoreColumnMutation = useMutation({
        mutationFn: ({boardColumnId}: { boardColumnId: string }) =>
            ProjectService.restoreColumn(projectDetail.projectId, boardColumnId),
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleRestoreItem = (item: ArchivedItemResponse) => {
        if (item.type === 'TASK') {
            restoreTaskMutation.mutate({taskId: item.itemId});
        }
        if (item.type === 'COLUMN') {
            restoreColumnMutation.mutate({boardColumnId: item.itemId});
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
                deleteTaskMutation.mutate({taskId: item.itemId});
            }
            if (item.type === 'COLUMN') {
                deleteColumnMutation.mutate({boardColumnId: item.itemId});
            }
        }
    }

    if (isLoading) {
        return <div className={'flex justify-center'}>
            <Loader2 className={"animate-spin"}/>
        </div>
    }
    return (
        <div className="p-8 h-full overflow-auto bg-gray-50/50">
            {/* Main List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {/* Header Row */}
                    <div
                        className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                        <div className="col-span-6">Tên mục</div>
                        <div className="col-span-2">Loại</div>
                        <div className="col-span-3">Thời gian xóa</div>
                        <div className="col-span-1 text-right"></div>
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                        <div key={item.itemId}
                             className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-blue-50/30 transition-colors group">
                            {/* Tên */}
                            <div className="col-span-6 min-w-0">
                                <p className="font-medium text-gray-900 truncate" title={item.name}>
                                    {item.name}
                                </p>
                            </div>

                            {/* Loại */}
                            <div className="col-span-2">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                        {item.type}
                                    </span>
                            </div>

                            {/* Thời gian */}
                            <div className="col-span-3 text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400"/>
                                {item.archivedAt ? formatDateLocalDate(item.archivedAt) : "--"}
                            </div>

                            {/* Nút Khôi phục */}
                            <div className="col-span-1 flex">
                                <button
                                    onClick={() => handleRestoreItem(item)}
                                    disabled={restoreTaskMutation.isPending || restoreColumnMutation.isPending}
                                    title="Khôi phục"
                                    className="p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {restoreTaskMutation.isPending || restoreColumnMutation.isPending ?
                                        <Loader2 className={"h-4 w-4 animate-spin"}/> :
                                        <ArchiveRestore className="h-4 w-4"/>}
                                </button>
                                <button
                                    onClick={() => handleDeleteItem(item)}
                                    title="Xóa"
                                    className="p-2 text-red-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {hasNextPage && (
                        <div onClick={() => fetchNextPage()}
                             className="flex justify-center py-2">
                            <button className={"py-2 px-4 hover:bg-blue-50 text-blue-500 rounded-xl"}
                                    disabled={isFetchingNextPage}>
                                {isFetchingNextPage ? <Loader2 className={"animate-spin h-5 w-5"}/> :
                                    <span>Xem thêm</span>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};