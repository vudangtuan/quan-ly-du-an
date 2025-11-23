import React, {useMemo} from "react";
import {useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {Check, Clock, Flag, ListCheck} from "lucide-react";
import {TaskResponse} from "@features/projects/types/task.types";
import {isOverdue} from "@features/utils/date.utils";
import {BoardColumnResponse, ProjectMemberResponse} from "@features/projects/types/project.types";
import {Avatar} from "@components/Avatar";
import {ProgressChart} from "@features/projects/components/dashboard/ProgressChart";
import {BoardColumnChart} from "@features/projects/components/dashboard/BoardColumnChart";
import {MemberTasksChart} from "@features/projects/components/dashboard/MemberTasksChart";
import {PriorityChart} from "@features/projects/components/dashboard/PriorityChart";
import {StatCard} from "@features/projects/components/dashboard/StatCard";

export const ProjectDashboard: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();

    const activeTasks = useMemo(() => {
        if (!allTasks || !projectDetail?.boardColumns) return [];
        const activeColumnIds = new Set(projectDetail.boardColumns
            .map((c: BoardColumnResponse) => c.boardColumnId));
        return allTasks.filter((t: TaskResponse) => activeColumnIds.has(t.boardColumnId));
    }, [allTasks, projectDetail?.boardColumns]);

    const completedTasks = useMemo(() => {
        return activeTasks.filter((t: TaskResponse) => t.completed);
    }, [activeTasks]);

    const inCompletedTasks = useMemo(() => {
        return activeTasks.filter((t: TaskResponse) => !t.completed && !isOverdue(t.dueAt, t.completed));
    }, [activeTasks]);

    const dueTasks = useMemo(() => {
        return activeTasks.filter((t: TaskResponse) => isOverdue(t.dueAt, t.completed));
    }, [activeTasks]);

    const memberTasks = useMemo(() => {
        if (!projectDetail?.members || !activeTasks) return [];
        return projectDetail.members.map((member: ProjectMemberResponse) => {
            const tasks = activeTasks.filter((t: TaskResponse) =>
                t.assigneeIds.includes(member.userId)
            );
            return {
                ...member,
                tasks: tasks
            };
        });
    }, [activeTasks, projectDetail.members]);


    const boardColumnTasks = useMemo(() => {
        if (!projectDetail?.boardColumns || !activeTasks) return [];
        return projectDetail.boardColumns.map((column: BoardColumnResponse) => {
            const tasks = activeTasks.filter((t: TaskResponse) =>
                t.boardColumnId === column.boardColumnId);
            return {
                ...column,
                tasks: tasks
            }
        });
    }, [activeTasks, projectDetail.boardColumns]);

    const tasksByPriority = useMemo(() => {
        if (!activeTasks) return [];
        const priorities = ['LOW', 'MEDIUM', 'HIGH'];
        return priorities.map((p) => {
            const tasks = activeTasks.filter((t: TaskResponse) => t.priority === p);
            return {
                name: p,
                tasks: tasks
            };
        });
    }, [activeTasks]);

    return (
        <div className="p-8 space-y-4 h-full overflow-auto">
            {/* Statistics Cards */}
            <div className="grid sm:grid-cols-4 grid-cols-1 gap-4">
                <StatCard
                    title="Đã hoàn thành"
                    value={completedTasks.length}
                    icon={Check}
                    bgColor="bg-green-100"
                    hoverBgColor="bg-green-200"
                    iconColor="text-green-600"
                />
                <StatCard
                    title="Chưa hoàn thành"
                    value={inCompletedTasks.length}
                    icon={Clock}
                    bgColor="bg-yellow-100"
                    hoverBgColor="bg-yellow-200"
                    iconColor="text-yellow-600"
                />
                <StatCard
                    title="Quá hạn"
                    value={dueTasks.length}
                    icon={Flag}
                    bgColor="bg-red-100"
                    hoverBgColor="bg-red-200"
                    iconColor="text-red-600"
                />
                <StatCard
                    title="Tổng số nhiệm vụ"
                    value={activeTasks.length}
                    icon={ListCheck}
                    bgColor="bg-blue-100"
                    hoverBgColor="bg-blue-200"
                    iconColor="text-blue-600"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <ProgressChart
                        completedTasks={completedTasks.length}
                        totalTasks={activeTasks.length}
                    />
                    <BoardColumnChart boardColumnTasks={boardColumnTasks} />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <MemberTasksChart memberTasks={memberTasks} />
                    <PriorityChart
                        tasksByPriority={tasksByPriority}
                        totalTasks={activeTasks.length}
                    />
                </div>
            </div>
        </div>
    )
}