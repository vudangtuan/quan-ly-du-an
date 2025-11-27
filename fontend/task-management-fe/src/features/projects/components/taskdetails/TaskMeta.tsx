// components/TaskDetailModal/TaskMeta.tsx
import React, {useEffect, useState} from "react";
import {Plus, Tag, User} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import {Label} from "@components/Label";
import {Avatar} from "@components/Avatar";
import {LabelResponse, ProjectDetailResponse, ProjectMemberResponse} from "@features/projects/types/project.types";
import {TaskDetailResponse} from "@features/projects/types/task.types";

interface TaskMetaProps {
    task: TaskDetailResponse;
    project: ProjectDetailResponse;
    canManage: boolean;
    updateTask: (data: any) => void;
    isError: boolean;
}

export const TaskMeta: React.FC<TaskMetaProps> = ({task, project, canManage, updateTask,isError}) => {
    const [labels, setLabels] = useState<LabelResponse[]>([]);
    const [assignees, setAssignees] = useState<ProjectMemberResponse[]>([]);

    useEffect(() => {
        if ((task && project.labels) || isError) {
            setLabels(project.labels.filter((label: LabelResponse) =>
                task.labelIds.includes(label.labelId)));
        }
    }, [task, project.labels,isError]);

    useEffect(() => {
        if ((task && project.members) || isError) {
            setAssignees(project.members.filter((m) =>
                task.assigneeIds.includes(m.userId)));
        }
    }, [task, project.members,isError]);

    const handleSaveLabel = (l: LabelResponse) => {
        const newLabels = [...labels, l];
        updateTask({labelIds: newLabels.map(l => l.labelId)});
    };

    const handleRemoveLabel = (l: LabelResponse) => {
        const newLabels = labels.filter(la => la.labelId !== l.labelId);
        updateTask({labelIds: newLabels.map(l => l.labelId)});
    };

    const handleSaveMembers = (member: ProjectMemberResponse) => {
        const newAssigns = [...assignees, member];
        updateTask({assigneeIds: newAssigns.map(m => m.userId)});
    };

    const handleRemoveMembers = (member: ProjectMemberResponse) => {
        const newAssigns = assignees.filter(m => m.userId !== member.userId);
        updateTask({assigneeIds: newAssigns.map(m => m.userId)});
    };

    return (
        <div className="flex items-center gap-5">
            {/* Labels */}
            <div className="group flex gap-2 flex-wrap">
                {labels.length === 0 && <button><Tag className="h-5 w-5"/></button>}
                {labels.map((label) => (
                    <Label label={label} key={label.labelId}>
                        <Tag className="h-4 w-4"/>
                    </Label>
                ))}
                <Popover.Root modal={true}>
                    <Popover.Trigger asChild>
                        <button
                            disabled={!canManage || task.completed}
                            className="p-1 border border-dashed rounded-full
                                hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                            <Plus className="h-4 w-4"/>
                        </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            className="w-auto bg-white border border-gray-200 rounded-lg shadow-lg
                                max-h-60 overflow-auto z-50"
                            sideOffset={5}
                        >
                            {project.labels.map((l: LabelResponse) => {
                                const isSelected = labels.some(label => label.labelId === l.labelId);
                                return (
                                    <button
                                        key={l.labelId}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                handleRemoveLabel(l);
                                            } else {
                                                handleSaveLabel(l);
                                            }
                                        }}
                                        className="w-full flex items-center gap-1 px-3 py-2 text-sm
                                            hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        <div className={`w-4 h-4 flex items-center justify-center 
                                            border-2 rounded ${
                                            isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300'
                                        }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
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

            {/* Assignees */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 group">
                    <div className="flex -space-x-2">
                        {project.members.filter(m => task.assigneeIds.includes(m.userId)).map(m => (
                            <Avatar key={m.userId} fullname={m.fullName} className="h-6 w-6 ring-2 ring-white rounded-full"/>
                        ))}
                    </div>
                    <Popover.Root modal={true}>
                        <Popover.Trigger asChild>
                            <button
                                disabled={!canManage || task.completed}
                                className="p-1 border border-dashed rounded-full
                                    hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                <User className="h-4 w-4"/>
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                className="w-auto bg-white border border-gray-200 rounded-lg shadow-lg
                                    max-h-60 overflow-auto z-50"
                                sideOffset={5}
                            >
                                {project.members.length === 0 ? (
                                    <div className="text-sm text-gray-500 text-center py-4 px-3">
                                        Chưa có thành viên nào
                                    </div>
                                ) : (
                                    <div className="p-1">
                                        {project.members.map((member: ProjectMemberResponse) => {
                                            const isAssigned = assignees.some(a => a.userId === member.userId);
                                            return (
                                                <button
                                                    key={member.userId}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isAssigned) {
                                                            handleRemoveMembers(member);
                                                        } else {
                                                            handleSaveMembers(member);
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm
                                                        hover:bg-gray-100 rounded-md transition-colors"
                                                >
                                                    <div className={`w-4 h-4 flex items-center justify-center 
                                                        border-2 rounded ${
                                                        isAssigned
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {isAssigned && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <Avatar fullname={member.fullName} className="h-6 w-6"/>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium text-gray-900">{member.fullName}</div>
                                                        <div className="text-xs text-gray-500">{member.email}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
        </div>
    );
};