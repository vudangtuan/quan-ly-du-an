import type {TaskDetailResponse} from "@/shared/types";
import React, {useMemo} from "react";
import {useProjectDetail} from "@/features/project_details/hooks";
import {Avatar} from "@/shared/components";
import {UserPlus, X} from "lucide-react";
import {MembersPopover} from "@/features/project_details/components";
import {useTask} from "@/features/project_details/components/task_details/hooks";


interface TaskAssigneesProps {
    task: TaskDetailResponse
}

export const TaskAssignees: React.FC<TaskAssigneesProps> = ({task}) => {

    const {projectDetail} = useProjectDetail(task.projectId);
    const assignees = useMemo(() => {
        if (!projectDetail || !projectDetail.members || !task.assigneeIds) return [];
        return projectDetail.members.filter(m => task.assigneeIds.includes(m.userId));
    }, [projectDetail, task.assigneeIds]);

    const {handleToggleMember, deleteAssigneeMutation} = useTask(task);


    return (
        <div className="flex items-center gap-4">
            <div className="w-35">Thành viên đảm nhiệm</div>
            <div className="flex">
                {assignees.map((assignee) => {
                    return (
                        <div key={assignee.userId} className="flex items-center p-1 gap-1 hover:bg-gray-100">
                            <Avatar userId={assignee.userId} className={"w-6 h-6"} fullName={assignee.fullName}/>
                            <span className={"font-normal"}>{assignee.fullName}</span>
                            <X onClick={() => deleteAssigneeMutation.mutate(assignee.userId)} size={16}/>
                        </div>
                    );
                })}
            </div>
            <MembersPopover members={projectDetail!.members} selectedMemberIds={task.assigneeIds}
                            toggleMembers={handleToggleMember}>
                <button
                    className="p-1 border border-dashed rounded-full
                                    hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                    <UserPlus className="h-4 w-4"/>
                </button>
            </MembersPopover>
            {task.assigneeIds.length === 0 && <span className={"text-gray-500"}>No assignee</span>}
        </div>
    );
}