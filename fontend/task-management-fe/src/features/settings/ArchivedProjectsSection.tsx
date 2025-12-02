import React from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import {QUERY_STALE_TIME} from "@config/query.config";
import toast from "react-hot-toast";
import {ArchiveRestore, Clock, FolderKanban, Loader2, RefreshCcw, Trash2} from "lucide-react";
import {useAuthStore} from "@store/slices/authSlice";
import {formatDateLocalDate} from "@features/utils/date.utils";
import {useConfirm} from "@components/ConfirmDialog";
import {ArchivedItemResponse} from "@features/projects/types/project.types";

export const ArchivedProjectsSection: React.FC = () => {
    const {userInfo} = useAuthStore();
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const {data: archivedProjects, isLoading} = useQuery({
        queryKey: ['myArchivedProjects', userInfo.userId],
        queryFn: () => ProjectService.getMyArchivedProjects(),
        enabled: !!userInfo.userId,
        staleTime: QUERY_STALE_TIME.MEDIUM,
        gcTime: QUERY_STALE_TIME.MEDIUM,
    });

    // 2. Restore Mutation
    const restoreMutation = useMutation({
        mutationFn: (projectId: string) => ProjectService.unarchiveProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', userInfo.userId]});
            queryClient.invalidateQueries({queryKey: ['projects', userInfo.userId]});
        },
        onError: (e) => toast.error(e.message)
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => ProjectService.deleteProject(projectId),
        onError: (e) => {
            toast.error(e.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', userInfo.userId]});
        }
    });

    const handleRestore = (id: string) => restoreMutation.mutate(id);
    const handleDelete = async (item: ArchivedItemResponse) => {
        const confirmed = await confirm({
            title: 'Xóa dự án?',
            description: `Bạn có chắc chắn muốn xóa dự án "${item.name}"?`,
            warningText: 'Mọi thứ trong dự án sẽ bị xóa hết và không thể khôi phục',
            confirmText: 'Xóa',
            isLoading: deleteProjectMutation.isPending,
            type: 'danger',
        });

        if (confirmed) {
            deleteProjectMutation.mutate(item.itemId);
        }
    };
    return (
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Kho lưu trữ dự án</h2>
                </div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-100">
                {isLoading ? (
                        <div className="p-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600"/>
                        </div>
                    ) :
                    archivedProjects.map((item) => (
                            <div key={item.itemId}
                                 className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                                {/* Thông tin dự án */}
                                <div className="flex items-center gap-4 min-w-0">
                                    <div
                                        className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <FolderKanban size={20}/>
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
                                        onClick={() => handleDelete(item)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                                             transition-colors disabled:opacity-50"
                                        title="Xóa vĩnh viễn"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </button>

                                    {/* Nút Khôi phục */}
                                    <button
                                        onClick={() => handleRestore(item.itemId)}
                                        disabled={restoreMutation.isPending || deleteProjectMutation.isPending}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50
                                             hover:bg-blue-100 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {restoreMutation.isPending ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                        ) : (
                                            <RefreshCcw className="h-3.5 w-3.5"/>
                                        )}
                                        <span className="hidden sm:inline">Khôi phục</span>
                                    </button>
                                </div>
                            </div>
                        )
                    )}
            </div>
        </div>
    );
};