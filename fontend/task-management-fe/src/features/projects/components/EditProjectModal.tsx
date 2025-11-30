import React, {useState, useEffect} from 'react';
import {X, FileText, Calendar, AlignLeft} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type {EditProjectData, ProjectDetailResponse, ProjectResponse} from '../types/project.types';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {useAuthStore} from "@store/slices/authSlice";

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectResponse;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      project,
                                                                  }) => {
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();
    const userId = useAuthStore.getState().userInfo?.userId;

    const [formData, setFormData] = useState<EditProjectData>({
        name: project.name,
        description: project.description || '',
        dueAt: project.dueAt || ''
    });

    const [errors, setErrors] = useState<Partial<EditProjectData>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: project.name,
                description: project.description || '',
                dueAt: project.dueAt || ''
            });
            setErrors({});
        }
    }, [isOpen, project]);

    const handleChange = (field: keyof EditProjectData, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: undefined}));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<EditProjectData> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Tên dự án không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updateProjectMutation = useMutation({
        mutationFn: (data: EditProjectData) =>
            ProjectService.updateProject(project.projectId, data),
        onSuccess: () => {
            if(queryCache.find({queryKey:['projects', userId]})){
                queryClient.setQueryData(['projects', userId], (oldData: any) => {
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any) => ({
                            ...page,
                            content: page.content.map((p: ProjectResponse) =>
                                p.projectId === project.projectId
                                    ? {...p, ...formData}
                                    : p
                            ),
                        })),
                    };
                });
            }
            if(queryCache.find({queryKey:['projectDetails', project.projectId]})){
                queryClient.setQueryData(['projectDetails', project.projectId],
                    (oldData: ProjectDetailResponse) => {
                        return {
                            ...oldData,
                            ...formData
                        }
                    })
            }
            onClose();
        },
        onError: (errors) => {
            toast.error(errors.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        updateProjectMutation.mutate(formData);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !updateProjectMutation.isPending) {
            onClose();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 ease-out">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Chỉnh sửa dự án
                        </Dialog.Title>
                        <Dialog.Close
                            disabled={updateProjectMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            <X className="h-4 w-4 text-gray-400"/>
                        </Dialog.Close>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Tên dự án */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <FileText className="h-3.5 w-3.5 text-blue-500"/>
                                Tên dự án <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Nhập tên dự án"
                                className={`w-full px-3 py-2 text-sm border rounded-lg 
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                                    outline-none transition-all ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                disabled={updateProjectMutation.isPending}
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <AlignLeft className="h-3.5 w-3.5 text-blue-500"/>
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Nhập mô tả (không bắt buộc)"
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                    outline-none transition-all resize-none"
                                disabled={updateProjectMutation.isPending}
                            />
                        </div>

                        {/* Ngày đến hạn */}
                        <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <Calendar className="h-3.5 w-3.5 text-blue-500"/>
                                Ngày đến hạn
                            </label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.dueAt ? new Date(formData.dueAt).toISOString().split('T')[0] : ""}
                                onChange={(e) => {
                                    const dueAtISO = e.target.value ? new Date(e.target.value).toISOString() : null;
                                    handleChange('dueAt', dueAtISO!)
                                }}
                                className={`w-full px-3 py-2 text-sm border rounded-lg 
                                    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                                    outline-none transition-all ${
                                    errors.dueAt ? 'border-red-300' : 'border-gray-300'
                                }`}
                                disabled={updateProjectMutation.isPending}
                            />
                            {errors.dueAt && (
                                <p className="text-xs text-red-600 mt-1">{errors.dueAt}</p>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex items-center gap-2 pt-3">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    disabled={updateProjectMutation.isPending}
                                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100
                                        rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={updateProjectMutation.isPending}
                                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600
                                    rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {updateProjectMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};