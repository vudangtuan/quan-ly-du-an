import React, {useState} from "react";
import {LabelRequest, LabelResponse, ProjectDetailResponse} from "@features/projects/types/project.types";
import {Plus, Check, X, Loader2, Tag, Edit, Trash2} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {ContextMenu, MenuItem} from "@components/MenuContext";
import {useConfirm} from "@components/ConfirmDialog";
import {Label} from "@components/Label";

interface ProjectLabelProps {
    labels: LabelResponse[],
    projectId: string,
    canManage: boolean
}

export const ProjectLabel: React.FC<ProjectLabelProps> = ({projectId, labels, canManage}) => {
    const [isAddLabel, setIsAddLabel] = useState(false);
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();

    const createLabelMutation = useMutation({
        mutationFn: (data: LabelRequest) => ProjectService.createLabel(projectId, data),
        onSuccess: (data: LabelResponse) => {
            if (queryCache.find({queryKey: ["projectDetails", projectId]})) {
                queryClient.setQueryData(["projectDetails", projectId],
                    (oldData: ProjectDetailResponse) => {
                        return {
                            ...oldData,
                            labels: [data, ...labels]
                        }
                    })
            }
            toast.success("Thêm thành công");
            setIsAddLabel(false);
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    return (
        <>
            <div className={"bg-white border border-gray-200 rounded-xl shadow-sm"}>
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
            border-gray-200 flex justify-between items-center">
                    <h3 className={"text-base font-semibold text-gray-900 flex items-center gap-2"}>
                        Nhãn dự án
                    </h3>
                    {
                        canManage &&
                        <button
                            onClick={() => setIsAddLabel(true)}
                            className={"hover:bg-blue-100 transition-colors p-2 rounded-full cursor-pointer group"}
                            title={"Thêm nhãn"}>
                            <Plus className={"h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors"}/>
                        </button>
                    }
                </div>
                <div className="p-5 space-y-2">
                    <div hidden={!isAddLabel} className={"animate-in fade-in duration-300"}>
                        <ItemLabel
                            canManage={canManage}
                            label={{
                                projectId: projectId,
                                name: "",
                                color: "#42cf11"
                            }}
                            projectId={projectId}
                            isAdding={true}
                            onCloseAdd={() => setIsAddLabel(false)}
                            onAddLabel={createLabelMutation.mutate}
                            isAddLoading={createLabelMutation.isPending}
                        />
                    </div>
                    {
                        labels.map((l: LabelResponse) => (
                            <ItemLabel key={l.labelId}
                                       canManage={canManage}
                                       label={l}
                                       projectId={projectId}
                            />
                        ))
                    }
                </div>
            </div>
        </>
    )
}

interface ItemLabelProps {
    label: LabelResponse,
    projectId: string,
    canManage: boolean,
    isAdding?: boolean,
    onCloseAdd?: () => void;
    onAddLabel?: (data: LabelRequest) => void;
    isAddLoading?: boolean;
}

const ItemLabel: React.FC<ItemLabelProps> = ({
                                                 label, projectId, canManage,
                                                 isAdding, onCloseAdd, onAddLabel, isAddLoading
                                             }) => {
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();

    const [editName, setEditName] = useState(label.name);
    const [editColor, setEditColor] = useState(label.color);
    const [isLocalEditing, setIsLocalEditing] = useState(false);

    const confirm = useConfirm();


    const updateLabelMutation = useMutation({
        mutationFn: () => {
            const data: LabelRequest = {
                name: editName,
                color: editColor
            };
            return ProjectService.updateLabel(projectId, label.labelId, data);
        },
        onSuccess: (data: LabelResponse) => {
            if (queryCache.find({queryKey: ["projectDetails", projectId]})) {
                queryClient.setQueryData(["projectDetails", projectId],
                    (oldData: ProjectDetailResponse) => {
                        return {
                            ...oldData,
                            labels: oldData.labels.map((l: LabelResponse) => {
                                if (l.labelId === label.labelId) {
                                    return data;
                                }
                                return l;
                            })
                        }
                    })
            }
            toast.success("Cập nhập thành công");
            setIsLocalEditing(false);
        },
        onError: (error) => {
            toast.error(error.message);
            handleCancel();
        }
    })
    const deleteLabelMutation = useMutation({
        mutationFn: () => ProjectService.deleteLabel(projectId, label.labelId),
        onSuccess: () => {
            if (queryCache.find({queryKey: ["projectDetails", projectId]})) {
                queryClient.setQueryData(["projectDetails", projectId],
                    (oldData: ProjectDetailResponse) => {
                        return {
                            ...oldData,
                            labels: oldData.labels.filter(
                                (l: LabelResponse) => l.labelId !== label.labelId)
                        }
                    })
            }
            toast.success("Xóa thành công");
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editName.trim()) return;

        if (isAdding) {
            const data: LabelRequest = {
                name: editName,
                color: editColor
            };
            onAddLabel!(data);
        } else {
            updateLabelMutation.mutate();
        }
    };

    const handleCancel = () => {
        setEditName(label.name);
        setEditColor(label.color);
        setIsLocalEditing(false);
        if (isAdding) {
            onCloseAdd!();
        }
    };

    const editing = isAdding || isLocalEditing;
    const menuItems: MenuItem[] = [
        {
            label: 'Chỉnh sửa',
            icon: <Edit className="h-4 w-4"/>,
            onClick: () => {
                setIsLocalEditing(true);
            },
        },
        {
            divider: true,
            label: '',
            onClick: () => {
            },
        },
        {
            label: 'Xóa',
            icon: <Trash2 className="h-4 w-4"/>,
            onClick: async () => {
                const confirmed = await confirm({
                    title: 'Xóa thành viên?',
                    description: `Bạn có chắc chắn muốn xóa "${label.name}"?`,
                    confirmText: 'Xóa',
                    isLoading: deleteLabelMutation.isPending,
                    type: 'danger',
                });
                if (confirmed) {
                    deleteLabelMutation.mutate();
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
                    showButton={canManage && !editing}
                    buttonClassName={"hover:bg-blue-50 hidden group-hover:block"}
                >
                    {editing ? (
                        <form onSubmit={handleSubmit} className="flex gap-3 items-center w-full">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Label Icon với màu */}
                                <div
                                    className={`transition-all flex-shrink-0 
                                        w-8 h-8 rounded-lg flex items-center justify-center shadow-sm`}
                                    style={{backgroundColor: `${editColor}20`}}
                                >
                                    <Tag
                                        className="h-4 w-4"
                                        style={{color: editColor}}
                                    />
                                </div>

                                {/* Label Name Input */}
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                        required
                                    />
                                </div>

                                {/* Color Picker */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {canManage && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="submit"
                                        disabled={!editName || updateLabelMutation.isPending || isAddLoading}
                                        className="p-1.5 cursor-pointer hover:bg-green-50 rounded text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Save"
                                    >
                                        {(updateLabelMutation.isPending || isAddLoading) ?
                                            <Loader2 className={"h-4 w-4 animate-spin"}/>
                                            :
                                            <Check className="h-4 w-4"/>
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        disabled={updateLabelMutation.isPending || isAddLoading}
                                        onClick={handleCancel}
                                        className="p-1.5 hover:bg-red-50 cursor-pointer rounded text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Cancel"
                                    >
                                        <X className="h-4 w-4"/>
                                    </button>
                                </div>
                            )}
                        </form>
                    ) : (
                        <div className={"flex gap-3 items-center w-full justify-between"}>
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                {/* Label Icon với màu */}
                                <div
                                    className={`group-hover:brightness-110 transition-all flex-shrink-0 
                                        w-8 h-8 rounded-lg flex items-center justify-center shadow-sm`}
                                    style={{backgroundColor: `${label.color}20`}}
                                >
                                    <Tag
                                        className="h-4 w-4"
                                        style={{color: label.color}}
                                    />
                                </div>

                                {/* Label Name */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate block">
                                        {label.name}
                                    </span>
                                </div>

                                {/* Demo Label Badge */}
                                {<Label label={label}/>}
                            </div>
                        </div>
                    )}
                </ContextMenu>
            </div>
        </>
    )
}