// components/TaskDetailModal/TaskMetaInfo.tsx
import React, {useState, useEffect} from "react";
import {Flag, Calendar, User, Clock, ChevronDown, Check} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import {Avatar} from "@components/Avatar";
import {TaskDetailResponse, TaskPriority} from "@features/projects/types/task.types";
import {ProjectMemberResponse} from "@features/projects/types/project.types";
import {formatDateLocalDate} from "@features/utils/date.utils";

interface TaskMetaInfo {
    task: TaskDetailResponse;
    creator: ProjectMemberResponse | null;
    canManage: boolean;
    updateTask: (data: any) => void;
    isUpdating: boolean;
    isError: boolean;
}

const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
        case 'HIGH':
            return 'bg-red-50 text-red-600 border-red-200';
        case 'MEDIUM':
            return 'bg-yellow-50 text-yellow-600 border-yellow-200';
        case 'LOW':
            return 'bg-green-50 text-green-600 border-green-200';
    }
};

export const TaskMetaInfo: React.FC<TaskMetaInfo> = ({
                                                         task,
                                                         creator,
                                                         canManage,
                                                         updateTask,
                                                         isUpdating,
                                                         isError
                                                     }) => {
    const [priority, setPriority] = useState<TaskPriority>("LOW");
    const [dueAt, setDueAt] = useState<string>("");

    useEffect(() => {
        if (task) {
            setPriority(task.priority);
            setDueAt(task.dueAt);
        }
    }, [task]);

    useEffect(() => {
        if (task && isError) {
            setPriority(task.priority);
            setDueAt(task.dueAt);
        }
    }, [isError, task]);

    const handleSavePriority = (value: TaskPriority) => {
        setPriority(value);
        updateTask({priority: value});
    };

    const handleSaveDueDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newDueAt: string;
        if (e.target.value) {
            newDueAt = new Date(e.target.value).toISOString();
            setDueAt(newDueAt);
        } else {
            newDueAt = "-1000000000-01-01T00:00:00Z";
            setDueAt(null);
        }
        updateTask({dueAt: newDueAt});
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Priority */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Flag className="h-4 w-4"/>
                    Độ ưu tiên
                </label>

                <Select.Root
                    value={priority}
                    onValueChange={handleSavePriority}
                    disabled={!canManage || task.completed || isUpdating}
                >
                    <Select.Trigger
                        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border
                            flex items-center justify-between transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                            hover:opacity-80 ${getPriorityColor(priority)}`}
                    >
                        <Select.Value>{priority}</Select.Value>
                        <Select.Icon>
                            <ChevronDown className="h-4 w-4"/>
                        </Select.Icon>
                    </Select.Trigger>

                    <Select.Portal>
                        <Select.Content
                            className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50"
                            position="popper"
                            sideOffset={5}
                        >
                            <Select.Viewport className="p-1">
                                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((p) => (
                                    <Select.Item
                                        key={p}
                                        value={p}
                                        className="px-3 py-2 text-sm rounded-md cursor-pointer
                                            hover:bg-gray-100 outline-none flex items-center justify-between"
                                    >
                                        <Select.ItemText>
                                            <span className={`px-2 py-1 rounded font-medium ${getPriorityColor(p)}`}>
                                                {p}
                                            </span>
                                        </Select.ItemText>
                                        <Select.ItemIndicator>
                                            <Check className="h-4 w-4 text-blue-600"/>
                                        </Select.ItemIndicator>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4"/>
                    Hạn hoàn thành
                </label>

                <input
                    type="date"
                    min={new Date().toLocaleDateString('sv')}
                    value={dueAt ? new Date(dueAt).toLocaleDateString('sv') : ""}
                    onChange={handleSaveDueDate}
                    disabled={!canManage || task.completed || isUpdating}
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50
                        border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>

            {/* Creator */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4"/>
                    Người tạo
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <Avatar fullname={creator?.fullName} className="h-5 w-5"/>
                    <span className="text-sm text-gray-900">{creator?.fullName}</span>
                </div>
            </div>

            {/* Created At */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4"/>
                    Ngày tạo
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                    {formatDateLocalDate(task.createdAt)}
                </div>
            </div>

            {/* Updated At */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4"/>
                    Cập nhật lần cuối
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                    {formatDateLocalDate(task.updatedAt)}
                </div>
            </div>
        </div>
    );
};