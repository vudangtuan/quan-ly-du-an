import React, {useState} from "react";
import {
    PaginatedResponse,
    ProjectDetailResponse,
    ProjectMemberResponse, ProjectResponse,
    ProjectRole
} from "@features/projects/types/project.types";
import {UserPlus, Mail, Edit, Trash2, Edit2, MessageSquare, Eye, X} from "lucide-react";
import {Avatar} from "@components/Avatar";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useAuthStore} from "@store/slices/authSlice";
import {AddMemberModal} from "@features/projects/components/overview/AddMemberModal";
import {useConfirm} from "@components/ConfirmDialog";
import {type InfiniteData, useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";

interface ProjectMemberProps {
    members: ProjectMemberResponse[];
    projectId: string;
    canManage: boolean
}

const roleColors: Record<ProjectRole, string> = {
    OWNER: "bg-amber-100 text-amber-700 border-amber-200",
    EDITOR: "bg-blue-100 text-blue-700 border-blue-200",
    COMMENTER: "bg-green-100 text-green-700 border-green-200",
    VIEWER: "bg-gray-100 text-gray-700 border-gray-200"
};

// eslint-disable-next-line react-refresh/only-export-components
export const roleOptions: Array<{
    value: ProjectRole;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}> = [
    {
        value: "EDITOR",
        label: "Editor",
        description: "Tạo, chỉnh sửa và xóa task, quản lý nội dung dự án",
        icon: <Edit2 className="h-4 w-4"/>,
        color: "text-blue-600",
    },
    {
        value: "COMMENTER",
        label: "Commenter",
        description: "Tham gia task và có thể bình luận",
        icon: <MessageSquare className="h-4 w-4"/>,
        color: "text-green-600",
    },
    {
        value: "VIEWER",
        label: "Viewer",
        description: "Chỉ xem dự án, không thể tương tác",
        icon: <Eye className="h-4 w-4"/>,
        color: "text-gray-600",
    },
];

export const ProjectMember: React.FC<ProjectMemberProps> = ({members, projectId, canManage}) => {
    const userId = useAuthStore.getState().userInfo?.userId;

    const [openAddModal, setOpenAddModal] = useState(false);
    return (
        <>
            <div className={"bg-white border border-gray-200 rounded-xl shadow-sm"}>
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
            border-gray-200 flex justify-between items-center">
                    <h3 className={"text-base font-semibold text-gray-900 flex items-center gap-2"}>
                        Thành viên dự án
                    </h3>
                    {
                        canManage &&
                        <button
                            onClick={() => setOpenAddModal(true)}
                            className={"hover:bg-blue-100 transition-colors p-2 rounded-full cursor-pointer group"}
                            title={"Thêm thành viên"}>
                            <UserPlus className={"h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"}/>
                        </button>
                    }
                </div>
                <div className="p-5 space-y-3">
                    {
                        members.map((m) => (
                            <ItemMember key={m.userId}
                                        canManage={canManage && m.userId !== userId}
                                        member={m}
                                        projectId={projectId}/>
                        ))
                    }
                </div>
            </div>
            <AddMemberModal isOpen={openAddModal}
                            onClose={() => setOpenAddModal(false)}
                            projectId={projectId}/>
        </>
    )
}

interface ItemMemberProps {
    canManage: boolean;
    member: ProjectMemberResponse;
    projectId: string;
}

const ItemMember: React.FC<ItemMemberProps> = ({member, canManage, projectId}) => {
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();
    const userId = useAuthStore.getState().userInfo?.userId;

    const [isEditingRole, setIsEditingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>(member.roleInProject);

    const confirm = useConfirm();

    const updateRoleMutation = useMutation({
        mutationFn: (newRole: ProjectRole) => ProjectService.updateMemberRole(projectId, member.userId, newRole),
        onSuccess: (_, newRole) => {
            if (queryCache.find({queryKey: ["projectDetails", projectId]})) {
                queryClient.setQueryData(["projectDetails", projectId], (oldData: ProjectDetailResponse) => {
                    return {
                        ...oldData,
                        members: oldData.members.map(
                            (m: ProjectMemberResponse) => m.userId === member.userId
                                ? {...m, roleInProject: newRole}
                                : m
                        )
                    }
                });
            }
            setIsEditingRole(false);
            toast.success('Cập nhật vai trò thành công!');
        },
        onError: (e) => {
            toast.error(e.message);
            setSelectedRole(member.roleInProject);
        }
    });

    const deleteMemberMutation = useMutation({
        mutationFn: () => ProjectService.deleteMember(projectId, member.userId),
        onSuccess: () => {
            if (queryCache.find({queryKey: ["projectDetails", projectId]})) {
                queryClient.setQueryData(["projectDetails", projectId], (oldData: ProjectDetailResponse) => {
                    return {
                        ...oldData,
                        members: oldData.members.filter(
                            (m: ProjectMemberResponse) => m.userId !== member.userId)
                    }
                });
            }
            if (queryCache.find({queryKey: ['projects', userId]})) {
                queryClient.setQueryData(['projects', userId],
                    (oldData: InfiniteData<PaginatedResponse<ProjectResponse>>) => {
                        return {
                            ...oldData,
                            pages: oldData.pages.map((page: PaginatedResponse<ProjectResponse>) => ({
                                ...page,
                                content: page.content.map((p: ProjectResponse) =>
                                    p.projectId === projectId
                                        ? {...p, members: p.members - 1}
                                        : p
                                ),
                            })),
                        }
                    });
            }
            toast.success('Xóa thành viên thành công!');
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });

    const handleSaveRole = () => {
        updateRoleMutation.mutate(selectedRole);
    };

    const menuItems: MenuItem[] = [
        {
            label: 'Chỉnh sửa',
            icon: <Edit className="h-4 w-4"/>,
            onClick: () => {
                setSelectedRole(member.roleInProject);
                setIsEditingRole(true);
            },
        },
        {
            divider: true,
            label: '',
            onClick: () => {
            },
        },
        {
            label: 'Xóa thành viên',
            icon: <Trash2 className="h-4 w-4"/>,
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
            danger: true,
        },
    ];


    return (
        <>
            <div
                className={"group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors cursor-default"}>
                <ContextMenu
                    items={menuItems}
                    trigger="click"
                    showButton={canManage}
                    buttonClassName={"hover:bg-blue-50 hidden group-hover:block"}
                >
                    <div className={"flex gap-3 items-center justify-between"}>
                        <div className={"flex gap-3 items-center flex-1 min-w-0"}>
                            <div>
                                <Avatar fullname={member.fullName}/>
                            </div>
                            <div className={"flex flex-col justify-center min-w-0 flex-1"}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 truncate text-sm">
                                        {member.fullName}
                                    </span>
                                    <span className={`flex justify-center items-center px-2.5 py-0.5 lowercase
                                        rounded-full text-xs font-medium shadow-sm whitespace-nowrap 
                                        ${roleColors[selectedRole]}`}>
                                        {selectedRole}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Mail className="h-3 w-3 flex-shrink-0"/>
                                    <span className="truncate">{member.email}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ContextMenu>

                {/* Edit Role Section */}
                {isEditingRole && (
                    <div
                        className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Chỉnh sửa vai trò</h4>
                            <button
                                onClick={() => setIsEditingRole(false)}
                                disabled={updateRoleMutation.isPending}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded p-1 transition-colors disabled:opacity-50"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-2 mb-3">
                            {roleOptions.map((role) => (
                                <div
                                    key={role.value}
                                    onClick={() => !updateRoleMutation.isPending && setSelectedRole(role.value)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                                        transition-all duration-150
                                        ${selectedRole === role.value
                                        ? "border-blue-500 bg-blue-50 shadow-sm"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                    }
                                        ${updateRoleMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}
                                    `}
                                >
                                    {/* Radio button */}
                                    <div className="flex-shrink-0">
                                        <div className={`
                                            w-4 h-4 rounded-full border-2 flex items-center justify-center
                                            transition-colors
                                            ${selectedRole === role.value
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300 bg-white"
                                        }
                                        `}>
                                            {selectedRole === role.value && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-white"/>
                                            )}
                                        </div>
                                    </div>

                                    {/* Role info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={role.color}>{role.icon}</span>
                                            <span className="font-medium text-sm text-gray-900">
                                                {role.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{role.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => setIsEditingRole(false)}
                                disabled={updateRoleMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveRole}
                                disabled={updateRoleMutation.isPending || selectedRole === member.roleInProject}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {updateRoleMutation.isPending ? (
                                    <>
                                        <div
                                            className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                        Đang lưu...
                                    </>
                                ) : (
                                    "Lưu"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}