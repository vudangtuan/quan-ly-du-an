import {gantt, type GridColumn} from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {BoardColumnResponse, ProjectMemberResponse} from "@features/projects/types/project.types";
import {formatDate, isOverdue} from "@features/utils/date.utils";
import {Users, Layers} from "lucide-react";
import "./projectGantt.css"
import {TaskDetailModal} from "@features/projects/components/taskdetails/TaskDetailModal";


const columns: GridColumn[] = [
    {
        name: "text",
        label: "Tên nhiệm vụ",
        tree: true,
        width: 300
    },
    {
        name: "status",
        label: "Trạng thái",
        align: "center",
        width: 120,
        template: function (task: any) {
            if (task.type === 'project') return '';

            let statusClass = '';
            let statusText;

            if (task.status === 'Completed') {
                statusClass = 'status-completed';
                statusText = 'Hoàn thành';
            } else if (task.status === 'Overdue') {
                statusClass = 'status-overdue';
                statusText = 'Quá hạn';
            } else {
                statusClass = 'status-in-progress';
                statusText = 'Đang thực hiện';
            }

            return `<div class="w-full h-full items-center flex justify-center">
                        <span class="px-2.5 flex items-center justify-center gap-1 py-1 rounded-md text-xs font-medium shadow-sm ${statusClass}">${statusText}</span>
                    </div>`;
        }
    }
];

type GroupBy = 'column' | 'member';

export const ProjectGantt: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();
    const ganttContainer = useRef<HTMLDivElement>(null);

    // State quản lý chế độ xem: 'column' hoặc 'member'
    const [groupBy, setGroupBy] = useState<GroupBy>('column');

    // State task detail
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>();
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const ganttTasks = useMemo(() => {
        if (!projectDetail || !allTasks) return [];

        // === CASE 1: GROUP BY BOARD COLUMN (Status) ===
        if (groupBy === 'column') {
            // 1. Tạo Parent là các Cột (Board Column)
            const parents = projectDetail.boardColumns.map((bc: BoardColumnResponse) => ({
                id: bc.boardColumnId,
                text: bc.name,
                type: "project",
                open: true,
            }));

            // 2. Tạo Children là các Task
            const children = allTasks
                .filter(t => projectDetail.boardColumns.some(bc => bc.boardColumnId === t.boardColumnId))
                .map(t => ({
                    id: t.taskId,
                    text: t.title,
                    start_date: new Date(t.createdAt),
                    end_date: t.dueAt ? new Date(t.dueAt) : new Date(t.createdAt),
                    parent: t.boardColumnId,
                    status: t.completed ? "Completed" : (isOverdue(t.dueAt, t.completed)) ? "Overdue" : "In progress",
                    progress: t.completed ? 1 : 0,
                    type: "task",
                }));

            return [...parents, ...children];
        }

        // === CASE 2: GROUP BY MEMBER (Assignee) ===
        else {
            // 1. Tạo Parent là các Member
            const parents = projectDetail.members.map((mem: ProjectMemberResponse) => ({
                id: mem.userId,
                text: mem.fullName,
                type: "project",
                open: true,
            }));

            // Thêm nhóm "Chưa giao" (Unassigned)
            parents.push({
                id: "unassigned_group",
                text: "Chưa giao",
                type: "project",
                open: true,
            } as any);

            // 2. Tạo Children là các Task
            const children: any[] = [];

            allTasks.forEach(t => {
                const commonProps = {
                    text: t.title,
                    start_date: new Date(t.createdAt),
                    end_date: t.dueAt ? new Date(t.dueAt) : new Date(new Date(t.createdAt).getTime() + 86400000),
                    status: t.completed ? "Completed" : (isOverdue(t.dueAt, t.completed)) ? "Overdue" : "In progress",
                    progress: t.completed ? 1 : 0,
                    type: "task",
                };

                if (!t.assigneeIds || t.assigneeIds.length === 0) {
                    // Nếu không có người giao -> Vào nhóm Unassigned
                    children.push({
                        ...commonProps,
                        id: `${t.taskId}_unassigned`,
                        parent: "unassigned_group"
                    });
                } else {
                    // Nếu có người giao -> Lặp qua từng người để tạo dòng task tương ứng
                    t.assigneeIds.forEach(memberId => {
                        // Kiểm tra xem member này có còn trong project không (để tránh lỗi parent not found)
                        if (projectDetail.members.some(m => m.userId === memberId)) {
                            children.push({
                                ...commonProps,
                                id: `${t.taskId}_${memberId}`,
                                parent: memberId
                            });
                        }
                    });
                }
            });

            return [...parents, ...children];
        }

    }, [projectDetail, allTasks, groupBy]);

    useEffect(() => {
        if (ganttContainer.current) {
            // Cấu hình gantt
            gantt.config.date_format = '%Y-%m-%d %H:%i';
            gantt.config.scale_unit = 'day';
            gantt.config.step = 1;
            gantt.config.date_scale = '%d %M';


            gantt.config.row_height = 50;
            gantt.config.subscales = [
                {unit: "month", step: 1, date: "%F %Y"}
            ];

            gantt.config.columns = columns;
            gantt.config.readonly = true;


            gantt.plugins({tooltip: true});

            //click task
            gantt.attachEvent("onTaskClick", (id) => {
                const task = gantt.getTask(id);
                const tooltips = gantt.ext?.tooltips;
                if (tooltips && tooltips.tooltip) {
                    tooltips.tooltip.hide();
                }
                if (gantt.tooltip) {
                    gantt.tooltip.hide();
                }
                if (task.type === 'task') {
                    setIsDetailModalOpen(true);
                    setSelectedTaskId(task.id as string);
                }
                return true;
            })

            // Tooltip Template
            gantt.templates.tooltip_text = function (start, end, task) {
                if (task.type === 'project') return '';

                const startDate = formatDate(start);
                const endDate = formatDate(end);
                let statusClass = '', statusText = '';

                if (task.status === 'Completed') {
                    statusClass = 'bg-green-100 text-green-800';
                    statusText = 'Hoàn thành';
                } else if (task.status === 'Overdue') {
                    statusClass = 'bg-red-100 text-red-800';
                    statusText = 'Quá hạn';
                } else {
                    statusClass = 'bg-blue-100 text-blue-800';
                    statusText = 'Đang làm';
                }

                return `
                <div class="p-3 max-w-xs">
                    <div class="font-semibold text-sm mb-2 text-wrap text-gray-900">${task.text}</div>
                    <div class="mb-2"><span class="${statusClass} px-2 py-1 rounded-lg text-xs font-medium">${statusText}</span></div>
                    <div class="text-xs text-gray-600 space-y-1">
                        <div class="flex justify-between"><span class="font-medium">Bắt đầu:</span><span>${startDate}</span></div>
                        <div class="flex justify-between"><span class="font-medium">Kết thúc:</span><span>${endDate}</span></div>
                    </div>
                </div>`;
            };

            // Class Template
            gantt.templates.task_class = (_, __, task) => {
                if (task.type === 'project') return 'gantt-hide-bar';
                if (task.status === 'Completed') return 'gantt-completed';
                if (task.status === 'Overdue') return 'gantt-overdue';
                return 'gantt-in-progress';
            };
            gantt.init(ganttContainer.current);
        }
        return () => {
            gantt.clearAll();
        };
    }, []);


    useEffect(() => {
        if (ganttTasks.length === 0) {
            gantt.clearAll();
            return;
        }
        try {
            gantt.clearAll();
            gantt.parse({data: ganttTasks, links: []});
        } catch (error) {
            console.error('Error parsing Gantt data:', error);
        }
    }, [ganttTasks]);

    return (
        <>
            <TaskDetailModal
                isOpen={isDetailModalOpen}
                taskId={selectedTaskId}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedTaskId(null);
                }}
            />
            <div className={"h-full w-full flex flex-col"}>
                {/* TOOLBAR - Nút chuyển đổi chế độ xem */}
                <div className="p-3 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setGroupBy('column')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                groupBy === 'column' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Layers size={16}/>
                            <span>Theo Cột</span>
                        </button>
                        <button
                            onClick={() => setGroupBy('member')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                groupBy === 'member' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Users size={16}/>
                            <span>Thành viên</span>
                        </button>
                    </div>
                </div>

                {/* GANTT CONTAINER */}
                <div className={"flex-1 relative"}>
                    <div
                        ref={ganttContainer}
                        className={"absolute inset-0 w-full h-full"}
                    />
                </div>
            </div>
        </>
    );
}