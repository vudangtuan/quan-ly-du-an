import type {ArchivedItemResponse, UserInfo} from "@/shared/types";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useConfirm} from "@/confirm_dialog";
import {ProjectService} from "@/shared/services";
import {QUERY_STALE_TIME} from "@/utils";
import toast from "react-hot-toast";


export const useArchivedProject = (user: UserInfo) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const {data: archivedProjects, isLoading} = useQuery({
        queryKey: ['myArchivedProjects', user.userId],
        queryFn: () => ProjectService.getMyArchivedProjects(),
        enabled: !!user.userId,
        staleTime: QUERY_STALE_TIME.MEDIUM,
        gcTime: QUERY_STALE_TIME.MEDIUM,
    });
    const restoreProjectMutation = useMutation({
        mutationFn: (projectId: string) => ProjectService.unarchiveProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', user.userId]});
            queryClient.invalidateQueries({queryKey: ['projects', user.userId]});
        },
        onError: (e) => toast.error(e.message)
    });
    const deleteProjectMutation = useMutation({
        mutationFn: (projectId: string) => ProjectService.deleteProject(projectId),
        onError: (e) => {
            toast.error(e.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['myArchivedProjects', user.userId]});
        }
    });
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

    return {
        archivedProjects, isLoading, restoreProjectMutation, handleDelete
    }
}