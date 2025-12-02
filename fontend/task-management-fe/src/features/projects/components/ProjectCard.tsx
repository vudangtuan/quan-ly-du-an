import React, {useMemo, useState} from 'react';
import type {PaginatedResponse, ProjectResponse} from '../types/project.types';
import {AlertTriangle, Archive, CalendarDays, Crown, Edit, Eye, Trash2, Users} from 'lucide-react';
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useNavigate} from "react-router-dom";
import {EditProjectModal} from "@features/projects/components/EditProjectModal";
import {type InfiniteData, useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {useAuthStore} from "@store/slices/authSlice";
import {useConfirm} from '@components/ConfirmDialog';
import {formatDate, isOverdue} from "@features/utils/date.utils";


interface ProjectCardProps {
    project: ProjectResponse;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({project}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const userId = useAuthStore.getState().userInfo?.userId;
    const confirm = useConfirm();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);


    const overdue = useMemo(() => {
        return isOverdue(project.dueAt);
    }, [project.dueAt]);


    const unarchiveProjectMutation = useMutation({
        mutationFn: () =>
            ProjectService.unarchiveProject(project.projectId),
        onError: (err) => {
            toast.error(err.message);
        },
        onSettled:()=>{
            queryClient.invalidateQueries({ queryKey: ['myArchivedProjects',userId] });
        }
    })
    const archiveProjectMutation = useMutation({
        mutationFn: () => ProjectService.archiveProject(project.projectId),
        onMutate: async () => {
            const previousData = queryClient.getQueryData(['projects', userId]);

            queryClient.setQueryData(['projects', userId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        content: page.content.filter((p: any) => p.projectId !== project.projectId)
                    }))
                };
            });

            return {previousData};
        },
        onSuccess: (_, __, onMutateResult) => {
            toast.success(
                (t) => (
                    <span className="flex items-center gap-3">
                    <span>Đã lưu trữ "{project.name}"</span>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            if (onMutateResult?.previousData) {
                                await unarchiveProjectMutation.mutateAsync();
                                queryClient.setQueryData(['projects', userId],
                                    onMutateResult.previousData);
                            }
                        }}
                        className="px-2 py-1 text-sm
                         font-medium text-blue-600 hover:bg-blue-50 rounded"
                    >
                        Hoàn tác
                    </button>
                </span>
                ),
                {duration: 5000}
            );
        },
        onError: (err, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['projects', userId], context.previousData);
            }
            toast.error(err.message);
        },
        onSettled:()=>{
            queryClient.invalidateQueries({ queryKey: ['myArchivedProjects',userId] });
        }
    });

    const canManage = () => {
        if (project.currentRoleInProject !== "OWNER") {
            toast.error("Chỉ chủ sở hữu mới có quyền")
            return false;
        }
        return true;
    }

    const menuItems: MenuItem[] = [
        {
            label: 'Xem chi tiết',
            icon: <Eye className="h-4 w-4"/>,
            onClick: () => {
                navigate(`/projects/${project.projectId}`);
            },
        },
        {
            label: 'Chỉnh sửa',
            icon: <Edit className="h-4 w-4"/>,
            onClick: () => {
                if (canManage()) {
                    setIsEditModalOpen(true);
                }
            },
        },
        {
            divider: true,
            label: '',
            onClick: () => {
            },
        },
        {
            label: 'Lưu trữ',
            icon: <Archive className="h-4 w-4"/>,
            onClick: () => {
                if (canManage()) {
                    archiveProjectMutation.mutate();
                }
            },
        }
    ];

    return (
        <>
            <ContextMenu
                items={menuItems}
                trigger="both"
                showButton={true}
                buttonClassName="top-7.5 right-2"
            >
                <div
                    className="flex h-full transform flex-col rounded-xl border border-gray-200
                 bg-white shadow-sm transition-all duration-200">
                    <div className="flex flex-col gap-4 p-5 pr-7">
                        {/* 1. Tên dự án */}
                        <div className="flex items-start gap-1 mt-2 justify-start min-h-[4rem]">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 ">
                                {project.name}
                            </h3>
                            {project.currentRoleInProject==='OWNER' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5
                                                   bg-amber-50 text-amber-700 text-xs font-medium
                                                   rounded-full w-fit">
                                        <Crown className="h-3 w-3" />
                                        Của tôi
                                    </span>
                            )}
                        </div>

                        {/* 2. Mô tả */}
                        <div className="flex-1 min-h-[4rem]">
                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                {project.description || '(Không có mô tả)'}
                            </p>
                        </div>
                    </div>

                    {/* 4. Footer - Thành viên và Deadline */}
                    <div className="mt-auto border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 rounded-b-xl">
                        <div className="flex items-center justify-between">
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                <Users className="h-3.5 w-3.5"/>
                                <span className="text-xs font-medium">{project.members} thành viên</span>
                            </div>
                            {/* Deadline */}
                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium
                                ${overdue
                                    ? "bg-red-50 text-red-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                                title={overdue ? "Đã quá hạn!" : "Ngày đến hạn"}
                            >
                                {overdue ? (
                                    <AlertTriangle className="h-4 w-4"/>
                                ) : (
                                    <CalendarDays className="h-4 w-4"/>
                                )}
                                <span className="text-xs">{formatDate(project.dueAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ContextMenu>
            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={project}
            />
        </>
    );
};