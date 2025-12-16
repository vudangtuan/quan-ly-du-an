import React, {useMemo} from "react";
import type {TaskDetailResponse, TaskPriority} from "@/shared/types";
import {ChevronDown, Flag, Layers, Tag, X} from "lucide-react";
import {PRIORITY_CONFIG} from "@/utils";
import {ColumnsPopover, LabelsPopover, PriorityPopover} from "@/features/project_details/components";
import {useTask} from "@/features/project_details/components/task_details/hooks";
import {useProjectDetail} from "@/features/project_details/hooks";
import {LabelBadge} from "@/shared/components";


interface TaskFieldsProps {
    task: TaskDetailResponse;
}

export const TaskFields: React.FC<TaskFieldsProps> = ({task}) => {
    const priority = PRIORITY_CONFIG[task.priority];

    const {updateTaskMutation, handleToggleLabel, deleteLabelMutation, moveTaskMutation} = useTask(task);

    const {projectDetail} = useProjectDetail(task.projectId);
    const labels = useMemo(() => {
        if (!projectDetail || !projectDetail.labels || !task.labelIds) return [];
        return projectDetail.labels.filter(l => task.labelIds.includes(l.labelId));
    }, [projectDetail, task.labelIds]);
    const boardColumn = useMemo(() => {
        if (!projectDetail || !projectDetail.boardColumns || !task.boardColumnId) return null;
        return projectDetail.boardColumns.find(bc => bc.boardColumnId === task.boardColumnId);
    }, [projectDetail, task.boardColumnId])

    return (
        <div className="flex items-start gap-4">
            <div className="w-35 text-gray-600 font-medium">Thuộc tính</div>
            <div className={"flex-1 border border-gray-300 rounded-md overflow-hidden bg-white"}>
                <div className={"flex items-stretch"}>
                    <div
                        className={"flex p-2 gap-2 items-start hover:bg-blue-50 cursor-pointer w-30 text-gray-700 transition-colors"}>
                        <Flag size={14} className="text-orange-500 mt-0.5"/>
                        Độ ưu tiên
                    </div>
                    <PriorityPopover value={task.priority} setValue={(value: TaskPriority) => {
                        updateTaskMutation.mutate({priority: value})
                    }}>
                        <div
                            className={"flex-1 group flex items-center justify-between p-2 hover:bg-gray-50 border-l border-gray-200 transition-colors cursor-pointer text-gray-600"}>
                        <span
                            className={`inline-flex items-center justify-center px-3 py-0.5 text-xs rounded font-semibold flex-shrink-0 ${priority.color} ${priority.bgColor} ${priority.borderColor} border`}
                            title={`Priority ${task.priority}`}
                        >
                            {priority.label}
                        </span>
                            <ChevronDown size={16}
                                         className={"opacity-0 group-hover:opacity-100 transition-opacity duration-300"}/>
                        </div>
                    </PriorityPopover>
                </div>
                <div className={"flex border-t border-gray-200 items-stretch"}>
                    <div
                        className={"flex p-2 gap-2 items-start hover:bg-blue-50 cursor-pointer w-30 text-gray-700 transition-colors"}>
                        <Tag size={14} className="text-blue-500"/>
                        Nhãn
                    </div>
                    <LabelsPopover labels={projectDetail!.labels}
                                   selectedLabelIds={labels.map(l => l.labelId)}
                                   toggleLabels={handleToggleLabel}
                    >
                        <div
                            className={"flex-1 flex justify-between items-start p-2 group hover:bg-gray-50 border-l border-gray-200 transition-colors cursor-pointer text-gray-600"}>
                            <div className={"flex flex-1 flex-wrap gap-2"}>
                                {labels.map((label) =>
                                    <LabelBadge key={label.labelId} label={label}
                                                childrenRight={<X
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteLabelMutation.mutate(label.labelId)
                                                    }}
                                                    size={12}/>}/>)}
                            </div>
                            <ChevronDown size={16}
                                         className={"opacity-0 group-hover:opacity-100 transition-opacity duration-300"}/>
                        </div>
                    </LabelsPopover>
                </div>
                <div className={"flex border-t border-gray-200 items-stretch"}>
                    <div
                        className={"flex p-2 gap-2 items-center hover:bg-blue-50 cursor-pointer w-30 text-gray-700 transition-colors"}>
                        <Layers size={14} className="text-purple-500"/>
                        Cột
                    </div>
                    <ColumnsPopover columns={projectDetail!.boardColumns}
                                    selectedColumnId={task.boardColumnId}
                                    setSelectedColumnId={(id) => {
                                        moveTaskMutation.mutate(id);
                                    }}
                    >
                        <div
                            className={"flex-1 group flex items-center justify-between p-2 hover:bg-gray-50 border-l border-gray-200 transition-colors cursor-pointer text-gray-600"}>
                            {boardColumn!.name}
                            <ChevronDown size={16}
                                         className={"opacity-0 group-hover:opacity-100 transition-opacity duration-300"}/>
                        </div>
                    </ColumnsPopover>
                </div>
            </div>
        </div>
    );
}