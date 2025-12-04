import {TaskPriority, TaskResponse} from "@features/projects/types/task.types";
import React, {useMemo} from "react";
import {UserInfo} from "@features/auth/types/auth.types";
import {LabelResponse} from "@features/projects/types/label.types";
import {AlertTriangle, CalendarDays, Flag} from "lucide-react";
import {Avatar} from "@components/Avatar";
import {useOutletContext} from "react-router-dom";
import {ProjectMemberResponse} from "@features/projects/types/project.types";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {Label} from "@components/Label";
import {formatDate, isOverdue} from "@features/utils/date.utils";
import {TaskContextMenu} from "@features/projects/components/TaskContextMenu";


interface TaskCardProps {
    task: TaskResponse
}

const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
        case 'HIGH':
            return 'bg-red-50 text-red-600 border-red-200';
        case 'MEDIUM':
            return 'bg-yellow-50 text-yellow-600 border-yellow-200';
        case 'LOW':
            return 'bg-green-50 text-green-600 border-green-200';
    }
};

export const TaskCard: React.FC<TaskCardProps> = ({task}) => {
    const {projectDetail: project} = useOutletContext<ProjectDetailContext>();

    const labels: LabelResponse[] = useMemo(() => {
        if (!task || !task.labelIds || !project || !project.labels) {
            return [];
        }
        return project.labels.filter((label: LabelResponse) =>
            task.labelIds.includes(label.labelId)
        );
    }, [task, project]);

    const assignees: ProjectMemberResponse[] = useMemo(() => {
        if (!task || !task.assigneeIds || !project || !project.members) {
            return [];
        }
        return project.members.filter((m: ProjectMemberResponse) =>
            task.assigneeIds.includes(m.userId)
        );
    }, [task, project]);

    const creator: ProjectMemberResponse = useMemo(() => {
        return project.members.filter(
            (m: ProjectMemberResponse) => m.userId === task.creatorId)[0];
    }, [task, project]);

    const overdue = useMemo(() => {
        return isOverdue(task.dueAt, task.completed);
    }, [task]);

    const displayAssignees = assignees.slice(0, 3);
    const remainingCount = assignees.length - displayAssignees.length;

    return (
        <TaskContextMenu
            task={task}
            projectId={project.projectId}
            currentRole={project.currentRoleInProject}
        >
            <div className={`
                w-full max-w-sm bg-white rounded-lg shadow-sm border border-gray-200 p-4 
                hover:shadow-md transition-all duration-200 flex gap-3 flex-col
                ${task.completed ? 'opacity-60' : ''}
            `}>
                {/* Labels */}
                <div className="flex gap-1.5 min-h-6 flex-wrap">
                    {labels.map((l: LabelResponse) => (
                        <Label label={l} key={l.labelId}/>
                    ))}
                </div>

                {/* Title */}
                <h3 className={`text-gray-800 font-medium text-sm line-clamp-2 h-9 ${
                    task.completed ? 'line-through text-gray-500' : ''
                }`}>
                    {task.title}
                </h3>

                {/* Footer Section */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    {/* Priority Badge */}
                    <span className={`px-2 py-1 rounded font-medium flex items-center gap-1.5 text-xs capitalize ${getPriorityColor(task.priority)}`}>
                        <Flag className="h-3 w-3" strokeWidth={3}/>
                        {task.priority.toLowerCase()}
                    </span>

                    {/* Assignees */}
                    <div className="flex -space-x-2">
                        {displayAssignees.map((assignee: UserInfo) => (
                            <div key={assignee.userId} title={assignee.fullName}>
                                <Avatar
                                    className="h-6 w-6 rounded-full ring-2 ring-white"
                                    fullname={assignee.fullName}
                                />
                            </div>
                        ))}
                        {remainingCount > 0 && (
                            <div
                                title={`+${remainingCount} người khác`}
                                className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs font-semibold text-gray-700 ring-2 ring-white"
                            >
                                +{remainingCount}
                            </div>
                        )}
                    </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center justify-between text-xs">
                    <div
                        className={`flex items-center gap-1.5 ${overdue ? "text-red-600 font-medium" : "text-gray-600"}`}
                        title={overdue ? "Đã quá hạn" : "Ngày tới hạn"}
                    >
                        {overdue ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500"/>
                        ) : (
                            <CalendarDays className="h-3.5 w-3.5 text-gray-500"/>
                        )}
                        <span>{formatDate(task.dueAt)}</span>
                    </div>
                </div>
            </div>
        </TaskContextMenu>
    );
};