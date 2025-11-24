import React, {useMemo, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {ProjectDetailContext} from '@features/projects/pages/ProjectDetailPage';
import {ChevronDown, Calendar as CalendarIcon, User, Filter, X, Search} from 'lucide-react';
import {TaskResponse, TaskPriority} from '@features/projects/types/task.types';
import {formatDate, isOverdue} from '@features/utils/date.utils';
import {Avatar} from '@components/Avatar';
import {TaskDetailModal} from '../kanban/TaskDetailModal';
import {ProjectMemberResponse} from '../types/project.types';
import {TaskContextMenu} from "@features/projects/components/TaskContextMenu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type FilterState = {
    name: string;
    status: string[];
    priority: string[];
};

export const ProjectList: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const [filters, setFilters] = useState<FilterState>({
        name: '',
        status: [],
        priority: []
    });

    // Lọc tasks theo filters
    const filteredTasks = useMemo(() => {
        if (!allTasks) return [];

        return allTasks.filter(task => {
            // Filter by name (search)
            if (filters.name) {
                if (!task.title.toLowerCase().includes(filters.name.toLowerCase())) return false;
            }

            // Filter by status
            if (filters.status.length > 0) {
                const taskStatus = task.completed ? 'completed' : isOverdue(task.dueAt, task.completed) ? 'overdue' : 'inprogress';
                if (!filters.status.includes(taskStatus)) return false;
            }

            // Filter by priority
            if (filters.priority.length > 0) {
                if (!filters.priority.includes(task.priority)) return false;
            }

            return true;
        });
    }, [allTasks, filters]);

    // Gom nhóm tasks theo Cột (Trạng thái)
    const groupedTasks = useMemo(() => {
        if (!filteredTasks || !projectDetail?.boardColumns) return [];

        return projectDetail.boardColumns.map((col) => {
            // Lọc task thuộc cột này TỪ DANH SÁCH ĐÃ ĐƯỢC FILTER
            const tasksInCol = filteredTasks.filter(t => t.boardColumnId === col.boardColumnId);
            return {
                ...col,
                tasks: tasksInCol,
                count: tasksInCol.length
            };
        });
    }, [filteredTasks, projectDetail?.boardColumns]);

    const toggleGroup = (columnId: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [columnId]: !prev[columnId]
        }));
    };

    const isExpanded = (columnId: string) => expandedGroups[columnId] !== true; // Mặc định mở

    const toggleFilter = (column: keyof FilterState, value: string) => {
        setFilters(prev => {
            const currentFilters = prev[column] as string[];
            const newFilters = currentFilters.includes(value)
                ? currentFilters.filter(v => v !== value)
                : [...currentFilters, value];

            return {
                ...prev,
                [column]: newFilters
            };
        });
    };


    const hasActiveFilters = filters.name !== '' || filters.status.length > 0 || filters.priority.length > 0;

    const clearAllFilters = () => {
        setFilters({
            name: '',
            status: [],
            priority: []
        });
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header với nút Clear All Filters */}
            {hasActiveFilters && (
                <div className="flex-shrink-0 px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Xóa tất cả bộ lọc
                    </button>
                </div>
            )}

            {/* Header Bảng */}
            <div
                className="flex-shrink-0 grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-5 flex items-center gap-2">
                    Tên nhiệm vụ
                    <SearchFilterDropdown
                        value={filters.name}
                        onChange={(value) => setFilters(prev => ({ ...prev, name: value }))}
                    />
                </div>
                <div className="col-span-2 text-center flex items-center gap-1">
                    Trạng thái
                    <CheckboxFilterDropdown
                        options={[
                            { value: 'completed', label: 'Completed' },
                            { value: 'overdue', label: 'Overdue' },
                            { value: 'inprogress', label: 'In process' }
                        ]}
                        selected={filters.status}
                        onToggle={(value) => toggleFilter('status', value)}
                    />
                </div>
                <div className="col-span-1 text-center flex items-center gap-1">
                    Ưu tiên
                    <CheckboxFilterDropdown
                        options={[
                            { value: 'HIGH', label: 'High' },
                            { value: 'MEDIUM', label: 'Medium' },
                            { value: 'LOW', label: 'Low' }
                        ]}
                        selected={filters.priority}
                        onToggle={(value) => toggleFilter('priority', value)}
                    />
                </div>
                <div className="col-span-2 text-center flex items-center">Hạn chót</div>
                <div className="col-span-2 text-center flex items-center">Người thực hiện</div>
            </div>

            {/* Body */}
            <div className="divide-y flex-1 overflow-y-auto divide-gray-100">
                {groupedTasks.map((group) => (
                    <div key={group.boardColumnId}>
                        {/* Group Header */}
                        <div
                            className="px-4 py-2.5 bg-gray-50/80 flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
                            onClick={() => toggleGroup(group.boardColumnId)}
                        >
                            <button className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-transform">
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-300 ${
                                        isExpanded(group.boardColumnId) ? 'rotate-0' : '-rotate-90'
                                    }`}
                                />
                            </button>
                            <h3 className="text-sm font-semibold text-gray-800">
                                {group.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                {group.count}
                            </span>
                        </div>

                        {/* Task Rows với animation */}
                        <div
                            className={`grid transition-all duration-300 ease-in-out ${
                                isExpanded(group.boardColumnId)
                                    ? 'grid-rows-[1fr] opacity-100'
                                    : 'grid-rows-[0fr] opacity-0'
                            }`}
                        >
                            <div className="overflow-hidden">
                                {group.tasks.length === 0 ? (
                                    <div className="px-12 py-4 text-sm text-gray-400 italic">
                                        {hasActiveFilters ? 'Không có nhiệm vụ phù hợp' : ''}
                                    </div>
                                ) : (
                                    <div>
                                        {group.tasks.map((task, index) => (
                                            <div
                                                key={task.taskId}
                                                className={`transition-all duration-300 ${
                                                    isExpanded(group.boardColumnId)
                                                        ? 'opacity-100 translate-y-0'
                                                        : 'opacity-0 -translate-y-2'
                                                }`}
                                                style={{
                                                    transitionDelay: isExpanded(group.boardColumnId)
                                                        ? `${index * 30}ms`
                                                        : '0ms'
                                                }}
                                            >
                                                <TaskRow
                                                    task={task}
                                                    members={projectDetail.members}
                                                    onViewDetail={() => setSelectedTaskId(task.taskId)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Chi Tiết */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
};

// Component Search Filter Dropdown
const SearchFilterDropdown: React.FC<{
    value: string;
    onChange: (value: string) => void;
}> = ({ value, onChange}) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${value ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <Filter className="h-3.5 w-3.5" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[240px] bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50"
                    sideOffset={5}
                    align="start"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên..."
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

// Component Checkbox Filter Dropdown
const CheckboxFilterDropdown: React.FC<{
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (value: string) => void;
}> = ({options, selected, onToggle}) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${selected.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <Filter className="h-3.5 w-3.5" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    sideOffset={5}
                    align="center"
                >
                    <div className="max-h-64 overflow-y-auto py-1">
                        {options.map((option) => (
                            <DropdownMenu.CheckboxItem
                                key={option.value}
                                checked={selected.includes(option.value)}
                                onCheckedChange={() => onToggle(option.value)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option.value)}
                                    readOnly
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                {option.label}
                            </DropdownMenu.CheckboxItem>
                        ))}
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const TaskRow: React.FC<{
    task: TaskResponse,
    members: ProjectMemberResponse[],
    onViewDetail: () => void
}> = ({task, members, onViewDetail}) => {
    const overdue = isOverdue(task.dueAt, task.completed);
    const assignees = members.filter(m => task.assigneeIds.includes(m.userId));
    const {projectDetail} = useOutletContext<ProjectDetailContext>();
    return (
        <TaskContextMenu
            task={task}
            projectId={projectDetail.projectId}
            currentRole={projectDetail.currentRoleInProject}
            className={"hidden"}
        >
            <div
                onClick={onViewDetail}
                className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-blue-50 cursor-pointer group transition-colors"
            >
                {/* Tên */}
                <div className="col-span-5 flex items-center gap-3">
                    <span
                        className={`text-sm font-medium truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                </span>
                </div>

                {/* Trạng thái */}
                <div className="col-span-2 flex">
                    <StatusBadge completed={task.completed} overdue={overdue}/>
                </div>

                {/* Ưu tiên */}
                <div className="col-span-1 flex">
                    <PriorityBadge priority={task.priority}/>
                </div>

                {/* Ngày hết hạn */}
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 text-center">
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400"/>
                    {task.dueAt ? (
                        <span className={`${overdue ? 'text-red-600 font-medium' : ''}`}>
                        {formatDate(task.dueAt)}
                    </span>
                    ) : (
                        <span className="text-gray-400">--/--/----</span>
                    )}
                </div>

                {/* Người thực hiện */}
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600 text-center">
                    <div className="flex -space-x-2 overflow-hidden py-1">
                        {assignees.length > 0 ? (
                            assignees.slice(0, 3).map(m => (
                                <Avatar key={m.userId} fullname={m.fullName}
                                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white"/>
                            ))
                        ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1"><User className="h-3 w-3"/> Chưa giao</span>
                        )}
                        {assignees.length > 3 && (
                            <div
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 ring-2 ring-white text-[10px] font-medium text-gray-600">
                                +{assignees.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TaskContextMenu>
    );
}

const StatusBadge = ({completed, overdue}: {
    completed: boolean,
    overdue: boolean,
}) => {
    if (completed) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>;
    if (overdue) return <span
        className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Overdue</span>;
    return <span
        className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 truncate max-w-full">In process</span>;
}

const PriorityBadge = ({priority}: { priority: TaskPriority }) => {
    const styles: Record<TaskPriority, string> = {
        HIGH: "bg-red-50 text-red-600 border-red-200",
        MEDIUM: "bg-yellow-50 text-yellow-600 border-yellow-200",
        LOW: "bg-green-50 text-green-600 border-green-200"
    };
    return (
        <span className={`px-2 capitalize py-0.5 rounded border text-xs font-medium ${styles[priority]}`}>
            {priority.toLowerCase()}
        </span>
    );
}