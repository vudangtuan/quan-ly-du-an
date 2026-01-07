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
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            {/* Header: Mobile nằm trên, Desktop nằm ngang */}
            <div className="text-sm font-semibold text-gray-900 sm:text-gray-600 sm:font-medium sm:w-32 sm:pt-2">
                Thuộc tính
            </div>

            {/* Content Box */}
            <div className="flex-1 w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">

                {/* --- ROW 1: PRIORITY --- */}
                <div className="flex items-stretch min-h-[44px]">
                    {/* Left Label: Fixed width để thẳng hàng dọc */}
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50/50 w-28 sm:w-32 border-r border-transparent text-gray-600 text-sm font-medium shrink-0">
                        <Flag size={16} className="text-orange-500 shrink-0"/>
                        Độ ưu tiên
                    </div>

                    {/* Right Value */}
                    <PriorityPopover
                        value={task.priority}
                        setValue={(value: TaskPriority) => updateTaskMutation.mutate({priority: value})}
                    >
                        <div className="flex-1 group flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-l border-gray-100 transition-colors cursor-pointer">
                            <span
                                className={`inline-flex items-center justify-center px-2.5 py-1 text-xs rounded font-semibold whitespace-nowrap ${priority.color} ${priority.bgColor} ${priority.borderColor} border`}
                            >
                                {priority.label}
                            </span>
                            <ChevronDown size={16} className="text-gray-400 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2"/>
                        </div>
                    </PriorityPopover>
                </div>

                {/* --- ROW 2: LABELS --- */}
                <div className="flex items-stretch min-h-[44px] border-t border-gray-100">
                    <div className="flex items-start pt-3 gap-2.5 px-3 bg-gray-50/50 w-28 sm:w-32 border-r border-transparent text-gray-600 text-sm font-medium shrink-0">
                        <Tag size={16} className="text-blue-500 shrink-0"/>
                        Nhãn
                    </div>

                    <LabelsPopover
                        labels={projectDetail!.labels}
                        selectedLabelIds={labels.map(l => l.labelId)}
                        toggleLabels={handleToggleLabel}
                    >
                        <div className="flex-1 flex justify-between items-start px-3 py-2 group hover:bg-gray-50 border-l border-gray-100 transition-colors cursor-pointer min-w-0">
                            <div className="flex flex-1 flex-wrap gap-2">
                                {labels.length === 0 && <span className="text-sm text-gray-400 italic">Chưa có nhãn</span>}
                                {labels.map((label) => (
                                    <LabelBadge
                                        key={label.labelId}
                                        label={label}
                                        className="max-w-full truncate"
                                        childrenRight={
                                            <div
                                                className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteLabelMutation.mutate(label.labelId)
                                                }}
                                            >
                                                <X size={12}/>
                                            </div>
                                        }
                                    />
                                ))}
                            </div>
                            <ChevronDown size={16} className="text-gray-400 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-1 shrink-0"/>
                        </div>
                    </LabelsPopover>
                </div>

                {/* --- ROW 3: COLUMNS --- */}
                <div className="flex items-stretch min-h-[44px] border-t border-gray-100">
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50/50 w-28 sm:w-32 border-r border-transparent text-gray-600 text-sm font-medium shrink-0">
                        <Layers size={16} className="text-purple-500 shrink-0"/>
                        Cột
                    </div>

                    <ColumnsPopover
                        columns={projectDetail!.boardColumns}
                        selectedColumnId={task.boardColumnId}
                        setSelectedColumnId={(id) => moveTaskMutation.mutate(id)}
                    >
                        <div className="flex-1 group flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-l border-gray-100 transition-colors cursor-pointer text-sm text-gray-700">
                            <span className="truncate">{boardColumn?.name || "Chọn cột"}</span>
                            <ChevronDown size={16} className="text-gray-400 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"/>
                        </div>
                    </ColumnsPopover>
                </div>

            </div>
        </div>
    );
}