import React, {useMemo} from "react";
import {useInfiniteQuery, useMutation} from "@tanstack/react-query";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {ProjectService} from "@features/projects/services/ProjectService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {
    ArchiveRestore, Clipboard,
    Clock, Columns, Columns2, Columns3, Columns4, FolderKanban, Loader2, RefreshCcw,
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
                    {/* Items */}
                    {items.map((item) => (
                        <div key={item.itemId}
                             className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                            {/* Thông tin dự án */}
                            <div className="flex items-center gap-4 min-w-0">
                                <div
                                    className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    {item.type==='TASK'&& <Clipboard/>}
                                    {item.type==='COLUMN'&& <Columns2/>}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                                        {item.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <Clock size={12}/>
                                        <span>Lưu trữ: {item.archivedAt ? formatDateLocalDate(item.archivedAt) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div className="flex items-center gap-2">
                                {/* Nút Xóa - MỚI THÊM */}
                                <button
                                    onClick={() => handleDeleteItem(item)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                                             transition-colors disabled:opacity-50"
                                    title="Xóa vĩnh viễn"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>

                                {/* Nút Khôi phục */}
                                <button
                                    onClick={() => handleRestoreItem(item)}
                                    disabled={restoreColumnMutation.isPending || restoreTaskMutation.isPending}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50
                                             hover:bg-blue-100 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {restoreColumnMutation.isPending||restoreTaskMutation.isPending ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                    ) : (
                                        <RefreshCcw className="h-3.5 w-3.5"/>
                                    )}
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