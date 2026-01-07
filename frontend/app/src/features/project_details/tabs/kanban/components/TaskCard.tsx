import type {ProjectMemberResponse, TaskResponse} from "@/shared/types";
import React, {useMemo} from "react";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import {useLocation, useNavigate, useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {CalendarDays} from "lucide-react";
import {formatDate, isOverdue, PRIORITY_CONFIG} from "@/utils";
import {Avatar} from "@/shared/components";


interface TaskCardProps {
    task: TaskResponse,
    isDragging?: boolean,
}


export const TaskCard = React.memo<TaskCardProps>(({task, isDragging}) => {
    const {projectDetail} = useOutletContext<ProjectDetailContext>();
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging: isSortableDragging,
    } = useSortable({
        id: task.taskId,
        data: {
            task
        }
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1
    };

    const overdue = useMemo(() => {
        return isOverdue(task.dueAt, task.completed);
    }, [task]);
    const assignees: ProjectMemberResponse[] = useMemo(() => {
        return projectDetail.members.filter((m: ProjectMemberResponse) =>
            task.assigneeIds.includes(m.userId)
        );
    }, [task, projectDetail.members]);
    const displayAssignees = assignees.slice(0, 2) || [];
    const remainingCount = assignees.length - displayAssignees.length;

    const priority = PRIORITY_CONFIG[task.priority];

    const navigate = useNavigate();
    const location = useLocation();
    const handleCardClick = () => {
        if (!isSortableDragging) {
            navigate(`/project/${projectDetail.projectId}/task/${task.taskId}`, {
                state: {backgroundLocation: location}
            });
        }
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleCardClick}
            className={`bg-white border p-2 cursor-default touch-none border-gray-200 min-h-[70px] shadow-sm hover:shadow-md transition-all ${
                isDragging ? 'shadow-xl ring-1 ring-blue-500' : ''
            } ${isSortableDragging}`}
        >
            {/* Nội dung card */}
            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                        className={`text-xs font-semibold leading-tight line-clamp-2 ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                        {task.title}
                    </span>
                    <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${priority.color} ${priority.bgColor} ${priority.borderColor} border`}
                        title={`Priority ${task.priority}`}
                    >
                        {priority.label}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div
                        className={`flex items-center gap-1 ${overdue ? "text-red-600 font-medium" : "text-gray-600"}`}
                        title={overdue ? "Đã quá hạn" : "Ngày tới hạn"}
                    >
                        <CalendarDays className="h-3.5 w-3.5"/>
                        <span>{formatDate(task.dueAt)}</span>
                    </div>
                    <div className="flex -space-x-1.5">
                        {displayAssignees.map((assignee) => (
                            <div key={assignee.userId} title={assignee.fullName}>
                                <Avatar
                                    className="h-4.5 w-4.5 rounded-full ring-2 ring-white"
                                    fullName={assignee.fullName}
                                />
                            </div>
                        ))}
                        {remainingCount > 0 && (
                            <div
                                title={`+${remainingCount} người khác`}
                                className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 ring-2 ring-white"
                            >
                                +{remainingCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})