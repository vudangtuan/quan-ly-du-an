import React, {useEffect, useState} from 'react';
import {X, Plus, Calendar, ArrowLeft, Loader2, FileText, AlignLeft, Layers, Tag, Users, Trash2} from 'lucide-react';
import {BoardColumn, KanbanTemplate, Label} from "@features/projects/types/kanban-templates";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {CreateProjectRequest, ProjectResponse} from "@features/projects/types/project.types";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {useAuthStore} from "@store/slices/authSlice";


interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    template: KanbanTemplate;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onBack,
                                                                      template
                                                                  }) => {
    const queryClient = useQueryClient();
    const userId = useAuthStore.getState().userInfo?.userId;

    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState('');
    const [columns, setColumns] = useState<BoardColumn[]>([]);
    const [labels, setLabels] = useState<Label[]>([]);
    const [memberEmails, setMemberEmails] = useState<string[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; endDate?: string }>({});

    useEffect(() => {
        if (isOpen) {
            setProjectName("");
            setDescription("");
            setEndDate("");
            setColumns([...template.boardColumns]); // Clone từ template
            setLabels([...template.labels]); // Clone từ template
            setMemberEmails([]);
            setNewMemberEmail('');
            setErrors({});
        }
    }, [isOpen, template]);

    const createProjectMutation = useMutation({
        mutationFn: (newProjectData: CreateProjectRequest) => {
            return ProjectService.createProject(newProjectData);
        },
        onSuccess: (newProject: ProjectResponse) => {
            toast.success('Tạo dự án mới thành công!');
            queryClient.setQueryData(
                ['projects', userId],
                (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any, index: number) => {
                            if (index === 0) {
                                return {
                                    ...page,
                                    content: [newProject, ...page.content],
                                    totalElements: page.totalElements + 1,
                                };
                            }
                            return page;
                        }),
                        pageParams: oldData.pageParams,
                    };
                }
            );
            onClose();
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const validate = () => {
        const newErrors: { name?: string; endDate?: string } = {};

        if (!projectName.trim()) {
            newErrors.name = 'Tên dự án không được để trống';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const data: CreateProjectRequest = {
            name: projectName,
            description: description,
            dueAt: endDate ? new Date(endDate).toISOString() : null,
            boardColumns: columns,
            labels: labels,
            members: []
        };
        createProjectMutation.mutate(data);
    };

    // Column handlers
    const addColumn = () => {
        const newColumn: BoardColumn = {
            name: `Cột ${columns.length + 1}`,
            sortOrder: columns.length + 1
        };
        setColumns([...columns, newColumn]);
    };

    const updateColumn = (index: number, name: string) => {
        const updated = [...columns];
        updated[index] = { ...updated[index], name };
        setColumns(updated);
    };

    const deleteColumn = (index: number) => {
        setColumns(columns.filter((_, i) => i !== index));
    };

    // Label handlers
    const addLabel = () => {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const newLabel: Label = {
            name: `Nhãn ${labels.length + 1}`,
            color: randomColor
        };
        setLabels([...labels, newLabel]);
    };

    const updateLabel = (index: number, field: 'name' | 'color', value: string) => {
        const updated = [...labels];
        updated[index] = { ...updated[index], [field]: value };
        setLabels(updated);
    };

    const deleteLabel = (index: number) => {
        setLabels(labels.filter((_, i) => i !== index));
    };

    // Member handlers
    const addMember = () => {
        const email = newMemberEmail.trim();
        if (email && !memberEmails.includes(email)) {
            setMemberEmails([...memberEmails, email]);
            setNewMemberEmail('');
        }
    };

    const deleteMember = (index: number) => {
        setMemberEmails(memberEmails.filter((_, i) => i !== index));
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
             className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-md bg-white rounded-lg shadow-xl max-h-[80vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Mẫu: <span className="font-medium text-gray-700">{template.displayName}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4 text-gray-400"/>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Tên dự án */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-500"/>
                            Tên dự án <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => {
                                setProjectName(e.target.value);
                                if (errors.name) setErrors(prev => ({...prev, name: undefined}));
                            }}
                            placeholder="Nhập tên dự án..."
                            className={`w-full px-3 py-2 text-sm border rounded-lg 
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                                outline-none transition-all ${
                                errors.name ? 'border-red-300' : 'border-gray-300'
                            }`}
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Mô tả chi tiết về dự án..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Ngày kết thúc */}
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500"/>
                            Ngày kết thúc
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Cột Kanban */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Layers className="h-3.5 w-3.5 text-blue-500"/>
                                Cột Kanban ({columns.length})
                            </label>
                            <button
                                type="button"
                                onClick={addColumn}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Thêm cột
                            </button>
                        </div>
                        <div className="space-y-2">
                            {columns.map((column, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={column.name}
                                        onChange={(e) => updateColumn(index, e.target.value)}
                                        placeholder="Tên cột..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => deleteColumn(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                            {columns.length === 0 && (
                                <p className="text-xs text-gray-500 italic">Chưa có cột nào</p>
                            )}
                        </div>
                    </div>

                    {/* Nhãn */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Tag className="h-3.5 w-3.5 text-blue-500"/>
                                Nhãn ({labels.length})
                            </label>
                            <button
                                type="button"
                                onClick={addLabel}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Thêm nhãn
                            </button>
                        </div>
                        <div className="space-y-2">
                            {labels.map((label, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={label.color}
                                        onChange={(e) => updateLabel(index, 'color', e.target.value)}
                                        className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={label.name}
                                        onChange={(e) => updateLabel(index, 'name', e.target.value)}
                                        placeholder="Tên nhãn..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                                            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => deleteLabel(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                            {labels.length === 0 && (
                                <p className="text-xs text-gray-500 italic">Chưa có nhãn nào</p>
                            )}
                        </div>
                    </div>

                    {/* Thành viên */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                <Users className="h-3.5 w-3.5 text-blue-500"/>
                                Thành viên ({memberEmails.length})
                            </label>
                        </div>
                        <div className="space-y-2">
                            {/* Add member input */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                                    placeholder="Email thành viên..."
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                                        focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={addMember}
                                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4"/>
                                </button>
                            </div>

                            {/* Member list */}
                            {memberEmails.map((email, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700">{email}</span>
                                    <button
                                        type="button"
                                        onClick={() => deleteMember(index)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-5 py-4 border-t bg-gray-50/50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={createProjectMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700
                            bg-white border border-gray-300 rounded-lg hover:bg-gray-50
                            transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4"/>
                        Quay lại
                    </button>

                    <button
                        type="submit"
                        disabled={createProjectMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm
                            font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createProjectMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4"/>
                                Tạo dự án
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};