import React, {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {TaskService} from "@features/projects/services/TaskService";
import {useAuthStore} from "@store/slices/authSlice";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {useNavigate} from "react-router-dom";
import {TaskPriority, TaskResponse} from "@features/projects/types/task.types";
import {ArrowRight, CheckCircle2, ChevronDown, Circle, Eye, FolderKanban, Loader2, Filter, X, Search} from "lucide-react";
import {formatDate, isOverdue} from "@features/utils/date.utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type FilterState = {
    name: string;
    status: string[];
    priority: string[];
};

export const MyTasksPage: React.FC = () => {
    const userId = useAuthStore.getState().userInfo.userId;
    const navigate = useNavigate();

    const {data:tasks,isLoading} = useQuery({
        queryKey:['tasks',userId],
        queryFn:()=>TaskService.getMyTask(),
        enabled: !!userId
    });

    const [filters, setFilters] = useState<FilterState>({
        name: '',
        status: [],
        priority: []
    });

    // Lọc tasks theo filters
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];

        return tasks.filter(task => {
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
    }, [tasks, filters]);

    const tasksByProject = useMemo(() => {
        if (!filteredTasks) return {};

        return filteredTasks.reduce((acc, task) => {
            const projectKey = task.projectName || "Dự án khác";
            if (!acc[projectKey]) {
                acc[projectKey] = [];
            }
            acc[projectKey].push(task);
            return acc;
        }, {} as Record<string, TaskResponse[]>);
    }, [filteredTasks]);

    const projectNames = useMemo(()=>
        Object.keys(tasksByProject).sort(),[tasksByProject]);

    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

    const toggleProject = (projectName: string) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectName]: !prev[projectName]
        }));
    };
    const isExpanded = (projectName: string) => expandedProjects[projectName] !== true;

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

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 flex-shrink-0 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Nhiệm vụ của tôi</h1>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4" />
                        Xóa tất cả bộ lọc
                    </button>
                )}
            </div>

            {/* TABLE CONTAINER */}
            <div className="flex flex-col flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

                {/* 1. Table Header */}
                <div className="flex-shrink-0 grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6 pl-8 flex items-center gap-2">
                        Tên nhiệm vụ
                        <SearchFilterDropdown
                            value={filters.name}
                            onChange={(value) => setFilters(prev => ({ ...prev, name: value }))}
                        />
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                        Trạng thái
                        <CheckboxFilterDropdown
                            options={[
                                { value: 'completed', label: 'Hoàn thành' },
                                { value: 'overdue', label: 'Quá hạn' },
                                { value: 'inprogress', label: 'Đang làm' }
                            ]}
                            selected={filters.status}
                            onToggle={(value) => toggleFilter('status', value)}
                        />
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                        Độ ưu tiên
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
                    <div className="col-span-2 text-right pr-4">Hạn hoàn thành</div>
                </div>

                {/* 2. Table Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {projectNames.length > 0 ? (
                        projectNames.map((projectName) => {
                            const projectTasks = tasksByProject[projectName];
                            const isOpen = isExpanded(projectName);

                            return (
                                <div key={projectName} className="bg-white">
                                    {/* Group Header (Tên Dự Án) */}
                                    <div
                                        className="px-4 py-3 bg-blue-50/50 flex items-center gap-2 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100"
                                        onClick={() => toggleProject(projectName)}
                                    >
                                        <button className="p-1 text-gray-500 hover:bg-blue-100 rounded transition-transform">
                                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                                        </button>
                                        <FolderKanban className="h-4 w-4 text-blue-600" />
                                        <h3 className="text-sm font-bold text-gray-800">{projectName}</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                            {projectTasks.length} nhiệm vụ
                                        </span>
                                    </div>

                                    {/* Task Rows (Animation đóng mở) */}
                                    <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            {projectTasks.map((task) => (
                                                <TaskRow
                                                    key={task.taskId}
                                                    task={task}
                                                    onClick={() => navigate(`/projects/${task.projectId}/kanban?taskId=${task.taskId}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <p>{hasActiveFilters ? 'Không tìm thấy nhiệm vụ phù hợp với bộ lọc.' : 'Bạn chưa có nhiệm vụ nào.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Component Search Filter Dropdown (cho tên nhiệm vụ)
const SearchFilterDropdown: React.FC<{
    value: string;
    onChange: (value: string) => void;
}> = ({ value, onChange }) => {
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

// Component Checkbox Filter Dropdown (cho status và priority)
const CheckboxFilterDropdown: React.FC<{
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (value: string) => void;
}> = ({options, selected, onToggle }) => {
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
                                    onChange={() => {}}
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

const TaskRow: React.FC<{ task: TaskResponse; onClick: () => void }> = ({ task, onClick }) => {
    const overdue = isOverdue(task.dueAt, task.completed);

    return (
        <div
            onClick={onClick}
            className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-gray-50 cursor-pointer group transition-colors border-b border-gray-50 last:border-0"
        >
            {/* Tên Task */}
            <div className="col-span-6 flex items-center gap-3 pl-4">
                <span className={`text-sm font-medium truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.title}
                </span>
            </div>

            {/* Trạng thái (Text) */}
            <div className="col-span-2 flex justify-center">
                {task.completed ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Hoàn thành</span>
                ) : overdue ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Quá hạn</span>
                ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Đang làm</span>
                )}
            </div>

            {/* Độ ưu tiên */}
            <div className="col-span-2 flex justify-center">
                <PriorityBadge priority={task.priority} />
            </div>

            {/* Hạn chót */}
            <div className="col-span-2 flex items-center justify-end gap-2 text-sm">
                <span className={`${overdue && !task.completed ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {formatDate(task.dueAt)}
                </span>
                {/* Icon mũi tên chỉ hiện khi hover */}
                <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
            </div>
        </div>
    );
};

const PriorityBadge = ({ priority }: { priority: TaskPriority }) => {
    const styles: Record<TaskPriority, string> = {
        HIGH: "bg-red-50 text-red-600 border-red-200",
        MEDIUM: "bg-yellow-50 text-yellow-600 border-yellow-200",
        LOW: "bg-green-50 text-green-600 border-green-200"
    };
    return (
        <span className={`px-2 capitalize py-0.5 rounded border text-[10px] font-bold ${styles[priority]}`}>
            {priority.toLowerCase()}
        </span>
    );
};