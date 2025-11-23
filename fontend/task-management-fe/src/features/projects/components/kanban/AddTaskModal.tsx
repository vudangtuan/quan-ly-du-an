import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useOutletContext} from "react-router-dom";
import * as Dialog from '@radix-ui/react-dialog';
import {LabelResponse, ProjectDetailResponse, ProjectMemberResponse} from "@features/projects/types/project.types";
import {Loader2, Plus, X} from "lucide-react";
import {Label} from "@components/Label";
import * as Popover from "@radix-ui/react-popover";
import {TaskPriority, TaskRequest, TaskResponse} from "@features/projects/types/task.types";
import {Avatar} from "@components/Avatar";
import {TaskService} from "@features/projects/services/TaskService";
import toast from "react-hot-toast";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";


interface AddTaskModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columnId: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({open, onOpenChange, columnId}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [des, setDes] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const [endDate, setEndDate] = useState("");
    const [labelSelected, setLabelSelected] = useState<LabelResponse[]>([]);
    const [membersSelected, setMembersSelected] = useState<ProjectMemberResponse[]>([]);

    //createTask
    const creatTaskMutation = useMutation({
        mutationFn: (data: TaskRequest) => TaskService.createTask(project.projectId, data),
        onSuccess: (res: TaskResponse) => {
            queryClient.setQueryData(["tasks", project.projectId], (old: TaskResponse[]) => {
                return [...old, res]
            })
            toast.success("Thêm thành công");
            onOpenChange(false);
            handleCancel();
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const handleRemoveMemberSelected = (userId: string) => {
        setMembersSelected(prevState =>
            prevState.filter(m => m.userId !== userId));
    }

    const handleRemoveLabelSelected = (labelId: string) => {
        setLabelSelected(prevState =>
            prevState.filter(l => l.labelId !== labelId));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTask: TaskRequest = {
            title: name,
            description: des,
            priority: priority,
            dueAt: endDate ? new Date(endDate).toISOString() : null,
            projectId: project.projectId,
            boardColumnId: columnId,
            labelIds: labelSelected.map(l => l.labelId),
            assigneeIds: membersSelected.map(m => m.userId)
        }
        creatTaskMutation.mutate(newTask);
    };

    const handleClose = () => {
        if (!creatTaskMutation.isPending) {
            onOpenChange(false);
            handleCancel();
        }
    };
    const handleCancel = () => {
        setName("");
        setDes("");
        setPriority("LOW");
        setEndDate("");
        setLabelSelected([]);
        setMembersSelected([]);
    }

    return (
        <Dialog.Root open={open} onOpenChange={handleClose}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"/>
                <Dialog.Content
                    aria-describedby={""}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-full max-w-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 ease-out">

                    {/* Header */}
                    <div
                        className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Tạo nhiệm vụ mới
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100
                                    hover:text-gray-600 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className={"overflow-y-auto px-10 py-4 max-h-[70vh] space-y-4"}>
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    id="title"
                                    type="text"
                                    placeholder="Nhập tiêu đề nhiệm vụ"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả
                                </label>
                                <textarea
                                    value={des}
                                    onChange={(e) => setDes(e.target.value)}
                                    id="description"
                                    placeholder="Nhập mô tả chi tiết (tùy chọn)"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Độ ưu tiên
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="LOW"
                                            checked={priority === "LOW"}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-4 h-4 text-green-600  focus:ring-0"
                                        />
                                        <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm">Thấp</span>
                                    </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="MEDIUM"
                                            checked={priority === "MEDIUM"}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-4 h-4 text-yellow-600 focus:ring-0"
                                        />
                                        <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="text-sm">Trung bình</span>
                                    </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="HIGH"
                                            checked={priority === "HIGH"}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-4 h-4 text-red-600 focus:ring-0"
                                        />
                                        <span className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="text-sm">Cao</span>
                                    </span>
                                    </label>
                                </div>
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nhãn
                                </label>
                                <div className="space-y-2">
                                    {/* Hiển thị các tags đã chọn */}

                                    <div className="flex flex-wrap gap-2">
                                        {labelSelected.map((label: LabelResponse) =>
                                            <Label label={label}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLabelSelected(label.labelId)}
                                                    className="rounded-full hover:bg-black/10 transition-colors"
                                                >
                                                    <X className="h-3.5 w-3.5" style={{color: label.color}}/>
                                                </button>
                                            </Label>
                                        )}
                                    </div>

                                    {/* Button thêm nhãn */}
                                    <Popover.Root modal={true}>
                                        <Popover.Trigger asChild>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 px-3 py-1.5
                        text-sm text-gray-600 border border-dashed border-gray-300
                        rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Plus className="h-4 w-4"/>
                                            </button>
                                        </Popover.Trigger>

                                        <Popover.Portal>
                                            <Popover.Content
                                                className="w-auto bg-white border border-gray-200 rounded-lg shadow-lg
                                                            max-h-60 overflow-auto z-50
                                                            data-[state=open]:animate-in data-[state=closed]:animate-out
                                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                                sideOffset={5}
                                            >
                                                {project.labels.map((l: LabelResponse) => {
                                                    const isSelected = labelSelected.some(label => label.labelId === l.labelId);
                                                    return (
                                                        <button
                                                            key={l.labelId}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    handleRemoveLabelSelected(l.labelId);
                                                                } else {
                                                                    setLabelSelected([...labelSelected, l]);
                                                                }
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm
                                                                            hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            <div className={`w-4 h-4 flex items-center justify-center 
                                                                                        border-2 rounded ${
                                                                isSelected
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'border-gray-300'
                                                            }`}>
                                                                {isSelected && (
                                                                    <svg className="w-3 h-3 text-white" fill="none"
                                                                         viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              strokeWidth={3} d="M5 13l4 4L19 7"/>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <Label label={l}/>
                                                        </button>
                                                    );
                                                })}
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người thực hiện
                                </label>
                                <div className="space-y-2">
                                    {/* Hiển thị các người đã chọn */}
                                    <div className="flex flex-wrap gap-2">
                                        {membersSelected.map((member: ProjectMemberResponse) => (
                                            <span
                                                key={member.userId}
                                                className="inline-flex items-center gap-2 px-3 py-1.5
                        bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200"
                                            >
                    <Avatar fullname={member.fullName} className={"h-8 w-8"}/>
                    <span className="font-medium">{member.fullName}</span>
                    <button
                        type="button"
                        onClick={() => handleRemoveMemberSelected(member.userId)}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                        <X className="h-3.5 w-3.5"/>
                    </button>
                </span>
                                        ))}
                                    </div>

                                    {/* Popover chọn người */}
                                    <Popover.Root modal={true}>
                                        <Popover.Trigger asChild>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 px-3 py-1.5
                        text-sm text-gray-600 border border-dashed border-gray-300
                        rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Plus className="h-4 w-4"/>
                                            </button>
                                        </Popover.Trigger>

                                        <Popover.Portal>
                                            <Popover.Content
                                                className="bg-white border border-gray-200 rounded-lg shadow-lg
                        max-h-60 overflow-auto z-50 p-2 w-auto
                        data-[state=open]:animate-in data-[state=closed]:animate-out
                        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                        data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                                sideOffset={5}
                                            >
                                                {project.members.map((member: ProjectMemberResponse) => {
                                                    const isSelected = membersSelected.some(m => m.userId === member.userId);
                                                    return (
                                                        <button
                                                            key={member.userId}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    handleRemoveMemberSelected(member.userId);
                                                                } else {
                                                                    setMembersSelected([...membersSelected, member]);
                                                                }
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2
                                    hover:bg-gray-100 rounded-md transition-colors"
                                                        >
                                                            <div className={`w-4 h-4 flex items-center justify-center 
                                    border-2 rounded flex-shrink-0 ${
                                                                isSelected
                                                                    ? 'bg-blue-600 border-blue-600'
                                                                    : 'border-gray-300'
                                                            }`}>
                                                                {isSelected && (
                                                                    <svg className="w-3 h-3 text-white" fill="none"
                                                                         viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round" strokeWidth={3}
                                                                              d="M5 13l4 4L19 7"/>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <Avatar fullname={member.fullName} className={"h-8 w-8"}/>
                                                            <div className="flex-1 text-left">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {member.fullName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </Popover.Content>
                                        </Popover.Portal>
                                    </Popover.Root>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-10 pb-5">
                            <Dialog.Close asChild>
                                <button
                                    disabled={creatTaskMutation.isPending}
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-700
                                        bg-white border border-gray-300 rounded-lg
                                        hover:bg-gray-50 transition-colors
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </button>
                            </Dialog.Close>
                            <button
                                disabled={creatTaskMutation.isPending}
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white
                                    bg-blue-600 rounded-lg hover:bg-blue-700
                                    transition-colors disabled:opacity-50
                                    disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {creatTaskMutation.isPending ? <Loader2 className={"h-4 w-4"}/> : <span>Thêm</span>}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}