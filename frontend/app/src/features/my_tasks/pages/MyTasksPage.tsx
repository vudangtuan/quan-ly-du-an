import React, {useMemo, useState} from "react";
import {useAuthStore} from "@/store";
import {useQuery} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";
import {formatDate, isOverdue, PRIORITY_CONFIG} from "@/utils";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getGroupedRowModel,
    getExpandedRowModel,
    flexRender,
    createColumnHelper,
    type ExpandedState,
    type GroupingState,

} from "@tanstack/react-table";
import type {TaskResponse} from "@/shared/types";
import {useNavigate} from "react-router-dom";
import {ArrowDown, ArrowUp, CheckCircle, ChevronDown, Clock, FolderKanban, Loader2, Timer} from "lucide-react";

const columnHelper = createColumnHelper<TaskResponse>();


export const MyTasksPage: React.FC = () => {
    const userId = useAuthStore.getState().userInfo?.userId;
    const navigate = useNavigate();


    const {data: tasks, isLoading} = useQuery({
        queryKey: ['my_tasks', userId],
        queryFn: () => TaskService.getMyTask(),
        enabled: !!userId
    });


    const [grouping, setGrouping] = useState<GroupingState>(["projectId"]);
    const [expanded, setExpanded] = useState<ExpandedState>(true);

    const columns = useMemo(() => [
        columnHelper.accessor("projectId", {
            header: "Dự án",
            enableGrouping: true
        }),
        columnHelper.accessor("title", {
            header: (({table}) => {
                const filteredTasks = table.getFilteredRowModel().rows.length;
                return (
                    <div className="flex items-center gap-2">
                        <span>Nhiệm vụ</span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                                {filteredTasks}
                            </span>
                    </div>
                )
            }),
            cell: (info) => {
                const dueAt = info.row.original.dueAt;
                const completed = info.row.original.completed;
                if (completed) {
                    return (
                        <div className="font-medium flex items-center gap-1 text-xs">
                            <CheckCircle size={16} className={"text-green-600"}/>
                            {info.getValue()}
                        </div>
                    );
                } else {
                    if (isOverdue(dueAt, completed)) {
                        return (
                            <div className="font-medium flex items-center gap-1 text-xs">
                                <Timer size={16} className={"text-red-600"}/>
                                {info.getValue()}
                            </div>
                        );
                    } else {
                        return (
                            <div className="font-medium flex items-center gap-1 text-xs">
                                <Clock size={16} className={"text-blue-600"}/>
                                {info.getValue()}
                            </div>
                        );
                    }
                }
            }
        }),
        columnHelper.accessor("dueAt", {
            header: "Hạn chót",
            cell: (info) => {
                const dueAt = info.row.original.dueAt;
                const completed = info.row.original.completed;
                return <div className={"text-xs"}>
                        <span className={`${isOverdue(dueAt, completed) && "text-red-600 font-medium"}`}>
                             {formatDate(info.getValue())}
                        </span>
                </div>
            }
        }),
        columnHelper.accessor("priority", {
            header: "Ưu tiên",
            cell: ({getValue}) => {
                const priority = PRIORITY_CONFIG[getValue()];
                return <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0
                         ${priority.color} ${priority.bgColor} ${priority.borderColor} border`}
                >
                        {getValue()}
                    </span>
            }
        }),
    ], []);


    const table = useReactTable({
        data: tasks || [],
        columns,
        state: {
            grouping,
            expanded,
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        autoResetExpanded: false,
        enableExpanding: true,
        onExpandedChange: setExpanded,
        onGroupingChange: setGrouping
    });

    const handleClickTask = (taskId: string, projectId: string) => {
        navigate(`/project/${projectId}/list`, {
            state: {
                openTaskId: taskId
            }
        });
    }



    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className={"flex flex-col h-full"}>
            <div className="flex-1 overflow-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => {
                        return (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    if (header.id === "projectId") return null;
                                    return (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getIsSorted() && (
                                                    <span>
                                                    {header.column.getIsSorted() === "asc" ?
                                                        <ArrowDown className={"h-4 w-4"}/> :
                                                        <ArrowUp className={"h-4 w-4"}/>}
                                                 </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {table.getRowModel().rows.map((row) => {
                        if (row.getIsGrouped()) {
                            return (
                                <tr key={row.id} className="bg-blue-100 hover:bg-blue-200 transition-colors">
                                    <td colSpan={columns.length} className="px-4 py-1"
                                        onClick={row.getToggleExpandedHandler()}>
                                        <button
                                            className="flex items-center gap-2 text-sm font-semibold text-gray-800 focus:outline-none w-full text-left"
                                        >
                                            <ChevronDown
                                                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ease-in-out ${row.getIsExpanded() ? 'rotate-90' : ''}`}/>
                                            <div className="flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4 text-blue-600"/>
                                                <span>{row.original.projectName}</span>
                                                <span
                                                    className="ml-1 text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                                {row.subRows.length}
                                            </span>
                                            </div>
                                        </button>
                                    </td>
                                </tr>
                            );
                        }
                        return (
                            <tr onClick={() => {
                                handleClickTask(row.original.taskId, row.original.projectId);
                            }} key={row.id} className="hover:bg-blue-50/50 transition-colors">
                                {row.getVisibleCells().map((cell) => {
                                    if (cell.column.id === 'projectId') return null;
                                    return (
                                        <td key={cell.id} className="px-6 py-2 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}