import {useState} from "react";
import type {ProjectMemberResponse, ProjectRole} from "@/shared/types";
import {ProjectService} from "@/shared/services";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {useConfirm} from "@/confirm_dialog";
import type {MenuItem} from "@/shared/components";
import {Edit, Trash2} from "lucide-react";


export const useProjectMember = (member: ProjectMemberResponse) => {
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>(member.roleInProject);
    const queryClient = useQueryClient();
    const confirm = useConfirm();


    const updateRoleMutation = useMutation({
        mutationFn: () =>
            ProjectService.updateMemberRole(member.projectId, member.userId, selectedRole),
        onSuccess: () => {
            setIsEditingRole(false);
            queryClient.invalidateQueries({queryKey: ["projectDetails", member.projectId]});
        },
        onError: (e) => {
            toast.error(e.message);
            setSelectedRole(member.roleInProject);
        }
    });
    const deleteMemberMutation = useMutation({
        mutationFn: () => ProjectService.deleteMember(member.projectId, member.userId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projectDetails", member.projectId]});
            queryClient.invalidateQueries({queryKey: ["projects"]});
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const menuItems: MenuItem[] = [
        {
            id: "edit",
            label: 'Chỉnh sửa',
            icon: Edit,
            onClick: () => {
                setSelectedRole(member.roleInProject);
                setIsEditingRole(true);
            },
        },
        {
            id: "sep",
            separator: true,
            label: '',
        },
        {
            id: "delete",
            label: 'Xóa thành viên',
            icon: Trash2,
            onClick: async () => {
                const confirmed = await confirm({
                    title: 'Xóa thành viên?',
                    description: `Bạn có chắc chắn muốn xóa "${member.fullName}"?`,
                    confirmText: 'Xóa',
                    isLoading: deleteMemberMutation.isPending,
                    type: 'danger',
                });
                if (confirmed) {
                    deleteMemberMutation.mutate();
                }
            },
            destructive: true,
        },
    ];

    return {
        isEditingRole, setIsEditingRole, updateRoleMutation, menuItems,
        selectedRole, setSelectedRole
    }
}