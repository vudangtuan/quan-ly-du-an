import {useEffect, useMemo, useRef} from "react";
import {gantt, type GridColumn} from "dhtmlx-gantt";
import {useLocation, useNavigate} from "react-router-dom";
import type {
    BoardColumnResponse,
    ProjectDetailResponse,
    ProjectMemberResponse,
    TaskResponse
} from "@/shared/types";
import {isOverdue} from "@/utils";


interface UseGanttChartOptions {
    projectDetail: ProjectDetailResponse;
    allTasks: TaskResponse[];
    groupBy: string;
    columns: GridColumn[];
}


export const useGanttChart = ({projectDetail, groupBy, allTasks,columns}: UseGanttChartOptions) => {
    const ganttContainer = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();


    const ganttTasks = useMemo(() => {
        if (!projectDetail || !allTasks) return [];

        if (groupBy === 'column') {
            return transformByColumn(projectDetail, allTasks);
        } else {
            return transformByMember(projectDetail, allTasks);
        }
    }, [projectDetail, allTasks, groupBy]);

    useEffect(() => {
        let taskClickEventId: string | null = null;

        if (ganttContainer.current) {
            configureGantt(columns);

            taskClickEventId = gantt.attachEvent('onTaskClick', (id) => {
                hideTooltips();
                const task = gantt.getTask(id);
                if (task.type === 'task' && projectDetail) {
                    navigate(`/project/${projectDetail.projectId}/task/${id}`, {
                        state: {backgroundLocation: location}
                    });
                }
                return true;
            });

            setupTooltipTemplate();
            setupTaskClassTemplate();
            gantt.init(ganttContainer.current);
        }

        return () => {
            if (taskClickEventId) {
                gantt.detachEvent(taskClickEventId);
            }
            gantt.clearAll();
            hideTooltips();
        };
    }, [])

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

    return {ganttContainer}
}


const transformByColumn = (projectDetail: ProjectDetailResponse, allTasks: TaskResponse[]) => {
    const parents = projectDetail.boardColumns.map((bc: BoardColumnResponse) => ({
        id: bc.boardColumnId,
        text: bc.name,
        type: "project",
        open: true,
    }));

    const children = allTasks
        .filter(t => projectDetail.boardColumns.some(bc => bc.boardColumnId === t.boardColumnId))
        .map(t => createTaskNode(t, t.boardColumnId));

    return [...parents, ...children];
}

const transformByMember = (projectDetail: ProjectDetailResponse, allTasks: TaskResponse[]) => {
    const parents = projectDetail.members.map((mem: ProjectMemberResponse) => ({
        id: mem.userId,
        text: mem.fullName,
        type: "project",
        open: true,
    }));

    parents.push({
        id: "unassigned_group",
        text: "Chưa giao",
        type: "project",
        open: true,
    });

    const children: any[] = [];

    allTasks.forEach(t => {
        if (!t.assigneeIds || t.assigneeIds.length === 0) {
            children.push(createTaskNode(t, 'unassigned_group'));
        } else {
            t.assigneeIds.forEach(memberId => {
                if (projectDetail.members.some(m => m.userId === memberId)) {
                    children.push(createTaskNode(t, memberId));
                }
            });
        }
    });


    return [...parents, ...children];
}

const createTaskNode = (task: TaskResponse, parentId: string) => {
    return {
        id: task.taskId,
        text: task.title,
        start_date: new Date(task.createdAt),
        end_date: task.dueAt ? new Date(task.dueAt) : new Date(new Date(task.createdAt).getTime() + 86400000),
        parent: parentId,
        status: task.completed ? 'Completed' : (isOverdue(task.dueAt, task.completed) ? 'Overdue' : 'In progress'),
        progress: task.completed ? 1 : 0,
        type: 'task',
    };
}

const configureGantt = (columns: GridColumn[]) => {
    gantt.config.date_format = '%Y-%m-%d %H:%i';
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.date_scale = '%d %M';
    gantt.config.row_height = 32;
    gantt.config.bar_height = 18;
    gantt.config.subscales = [{unit: 'month', step: 1, date: '%F %Y'}];
    gantt.config.columns = columns;
    gantt.config.readonly = true;
    gantt.plugins({tooltip: true});
}

const setupTooltipTemplate = () => {
    gantt.templates.tooltip_text = function (start, end, task) {
        if (task.type === 'project') return '';

        const startDate = start.toLocaleDateString();
        const endDate = end.toLocaleDateString();
        const {statusClass, statusText} = getStatusInfo(task.status);

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
}

const getStatusInfo = (status?: string) => {
    if (status === 'Completed') {
        return {statusClass: 'bg-green-100 text-green-800', statusText: 'Hoàn thành'};
    } else if (status === 'Overdue') {
        return {statusClass: 'bg-red-100 text-red-800', statusText: 'Quá hạn'};
    }
    return {statusClass: 'bg-blue-100 text-blue-800', statusText: 'Đang làm'};
}

const setupTaskClassTemplate = () => {
    gantt.templates.task_class = (_, __, task) => {
        if (task.type === 'project') return 'gantt-hide-bar';
        if (task.status === 'Completed') return 'gantt-completed';
        if (task.status === 'Overdue') return 'gantt-overdue';
        return 'gantt-in-progress';
    };
}

const hideTooltips = () => {
    const tooltips = gantt.ext?.tooltips;
    if (tooltips?.tooltip) {
        tooltips.tooltip.hide();
    }
    if (gantt.tooltip) {
        gantt.tooltip.hide();
    }
}