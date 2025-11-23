import React, { useState } from 'react';
import { ProjectDetailResponse } from '@features/projects/types/project.types';
import { TaskPriority } from '@features/projects/types/task.types';
import * as Popover from "@radix-ui/react-popover";
import { User, Tag, Flag, ChevronDown, FilterX } from 'lucide-react';
import { Avatar } from '@components/Avatar';


const PRIORITY_OPTIONS: { value: TaskPriority, label: string, icon: React.ReactNode }[] = [
    { value: "HIGH", label: "High", icon: <Flag className="h-4 w-4 text-red-500" /> },
    { value: "MEDIUM", label: "Medium", icon: <Flag className="h-4 w-4 text-yellow-500" /> },
    { value: "LOW", label: "Low", icon: <Flag className="h-4 w-4 text-green-500" /> },
];

interface KanbanFilterBarProps {
    project: ProjectDetailResponse;
    filterAssignees: string[];
    filterLabels: string[];
    filterPriorities: TaskPriority[];
    isFiltered: boolean;
    toggleAssigneeFilter: (id: string) => void;
    toggleLabelFilter: (id: string) => void;
    togglePriorityFilter: (priority: TaskPriority) => void;
    clearFilters: () => void;
}

export const SearchTaskBar: React.FC<KanbanFilterBarProps> = ({
                                                                    project,
                                                                    filterAssignees,
                                                                    filterLabels,
                                                                    filterPriorities,
                                                                    isFiltered,
                                                                    toggleAssigneeFilter,
                                                                    toggleLabelFilter,
                                                                    togglePriorityFilter,
                                                                    clearFilters
                                                                }) => {
    // State đóng/mở Popover được quản lý BÊN TRONG component này
    const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
    const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
    const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);

    const totalFilters = filterAssignees.length + filterLabels.length + filterPriorities.length;

    return (
        <div className="flex justify-end items-center gap-2 p-3 sticky top-0 backdrop-blur-sm">
            {/* Clear Filter */}
            {isFiltered && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white text-gray-700 border-gray-300 hover:bg-gray-50 border"
                >
                    <FilterX className="h-4 w-4" />
                    <span>Xóa lọc ({totalFilters})</span>
                </button>
            )}
            {/* Filter Người thực hiện */}
            <Popover.Root open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                <Popover.Trigger asChild>
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border
                        ${filterAssignees.length > 0
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    >
                        <User className="h-4 w-4" />
                        <span className={"font-semibold"}>Assignee</span>
                        {filterAssignees.length > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 text-xs bg-blue-600 text-white rounded-full">
                                {filterAssignees.length}
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto"
                        sideOffset={5}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {project.members.map(member => {
                            const isSelected = filterAssignees.includes(member.userId);
                            return (
                                <button
                                    key={member.userId}
                                    onClick={() => toggleAssigneeFilter(member.userId)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
                                >
                                    <div className={`w-4 h-4 border-2 rounded ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} />
                                    <Avatar fullname={member.fullName} className="h-6 w-6" />
                                    <span className="text-sm">{member.fullName}</span>
                                </button>
                            )
                        })}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            {/* Filter Nhãn */}
            <Popover.Root open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
                <Popover.Trigger asChild>
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border
                        ${filterLabels.length > 0
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    >
                        <Tag className="h-4 w-4" />
                        <span className={"font-semibold"}>Nhãn</span>
                        {filterLabels.length > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 text-xs bg-blue-600 text-white rounded-full">
                                {filterLabels.length}
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto"
                        sideOffset={5}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {project.labels.map(label => {
                            const isSelected = filterLabels.includes(label.labelId);
                            return (
                                <button
                                    key={label.labelId}
                                    onClick={() => toggleLabelFilter(label.labelId)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
                                >
                                    <div className={`w-4 h-4 border-2 rounded ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} />
                                    <span
                                        className="px-2 py-0.5 rounded text-xs font-medium"
                                        style={{ backgroundColor: `${label.color}20`, color: label.color }}
                                    >
                                        {label.name}
                                    </span>
                                </button>
                            )
                        })}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            {/* Filter Độ ưu tiên */}
            <Popover.Root open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
                <Popover.Trigger asChild>
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border
                        ${filterPriorities.length > 0
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    >
                        <Flag className="h-4 w-4" />
                        <span className={"font-semibold"}>Ưu tiên</span>
                        {filterPriorities.length > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 text-xs bg-blue-600 text-white rounded-full">
                                {filterPriorities.length}
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto"
                        sideOffset={5}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        {PRIORITY_OPTIONS.map(option => {
                            const isSelected = filterPriorities.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => togglePriorityFilter(option.value)}
                                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
                                >
                                    <div className={`w-4 h-4 border-2 rounded ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`} />
                                    {option.icon}
                                    <span className="text-sm">{option.label}</span>
                                </button>
                            )
                        })}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}