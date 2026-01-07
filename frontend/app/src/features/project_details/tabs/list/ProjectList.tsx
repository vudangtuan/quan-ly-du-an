import React, {useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate, useOutletContext, useParams} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
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
import type {ProjectMemberResponse, TaskResponse} from "@/shared/types";
import {ArrowDown, ArrowUp, CheckCircle, ChevronDown, Clock, Layers, Timer} from "lucide-react";
import {formatDate, isOverdue, PRIORITY_CONFIG} from "@/utils";
import {Avatar, LabelBadge} from "@/shared/components";
import {useFilterTask} from "@/shared/hooks";
import {TaskCreationForm, TaskFilterBar} from "@/features/project_details/components";


const columnHelper = createColumnHelper<TaskResponse>();

export const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();

    const filter = useFilterTask(allTasks);


    const [grouping, setGrouping] = useState<GroupingState>(["boardColumnId"]);
    const [expanded, setExpanded] = useState<ExpandedState>(true);
    const getColumnName = (columnId: string) => {
        const column = projectDetail.boardColumns?.find(c => c.boardColumnId === columnId);
        return column ? column.name : null;
    };
    const handleClickTask = (taskId: string) => {
        navigate(`/project/${projectDetail.projectId}/task/${taskId}`, {
            state: {
                backgroundLocation: location,
            }
        });
    }

    const columns = useMemo(() => {
        return [
            columnHelper.accessor("boardColumnId", {
                header: "Cột",
                enableGrouping: true,
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
            columnHelper.accessor("labelIds", {
                header: "Nhãn",
                cell: ({getValue}) => {
                    const labels = projectDetail.labels
                        .filter(l => getValue().includes(l.labelId));
                    return <div className={"flex flex-wrap gap-2 w-40"}>
                        {labels.map(label =>
                            <LabelBadge label={label} key={label.labelId} className={"text-[10px]"}/>)}
                    </div>
                }
            }),
            columnHelper.accessor("assigneeIds", {
                header: "Đảm nhiệm",
                cell: (info) => {
                    const assignees = projectDetail.members
                        .filter((m: ProjectMemberResponse) => info.getValue().includes(m.userId));
                    const displayAssignees = assignees.slice(0, 2) || [];
                    const remainingCount = assignees.length - displayAssignees.length;
                    return (
                        <div className="flex -space-x-1.5 text-xs w-40">
                            {displayAssignees.map((assignee) => (
                                <div key={assignee.userId} title={assignee.fullName}>
                                    <Avatar
                                        className="h-6 w-6 rounded-full ring-2 ring-white"
                                        fullName={assignee.fullName}
                                    />
                                </div>
                            ))}
                            {remainingCount > 0 && (
                                <div
                                    title={`+${remainingCount} người khác`}
                                    className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 font-semibold text-gray-700 ring-2 ring-white"
                                >
                                    +{remainingCount}
                                </div>
                            )}
                        </div>
                    )
                },
                enableSorting: false
            })
        ];
    }, [projectDetail])

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: filter.filteredTasks || [],
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

    const { projectId } = useParams();
    const isCheckedRef = useRef(false);
    useEffect(() => {
        const state = location.state as { openTaskId?: string } | null;
        if (state?.openTaskId && !isCheckedRef.current) {
            isCheckedRef.current = true;
            navigate(`/project/${projectId}/task/${state.openTaskId}`, {
                state: {
                    backgroundLocation: location
                }
            });
        }
    }, [projectId]);

    return (
        <div className={"flex flex-col h-full"}>
            <div className={"flex items-center justify-between p-2"}>
                <TaskFilterBar {...filter} allMembers={projectDetail.members}/>
                <TaskCreationForm>
                    <button className="flex items-center justify-center gap-1 px-4 py-1.5
                             bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                             text-white text-sm font-semibold rounded-lg
                             transition-all shadow-sm hover:shadow-md">
                        <span>Tạo mới</span>
                    </button>
                </TaskCreationForm>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => {
                        return (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    if (header.id === "boardColumnId") return null;
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
                                                <Layers className="h-4 w-4 text-blue-600"/>
                                                <span>{getColumnName(row.getValue("boardColumnId"))}</span>
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
                                handleClickTask(row.original.taskId);
                            }} key={row.id} className="hover:bg-blue-50/50 transition-colors">
                                {row.getVisibleCells().map((cell) => {
                                    if (cell.column.id === 'boardColumnId') return null;
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
                {(!allTasks || allTasks.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                        Chưa có nhiệm vụ nào
                    </div>
                )}
            </div>
        </div>
    )
}