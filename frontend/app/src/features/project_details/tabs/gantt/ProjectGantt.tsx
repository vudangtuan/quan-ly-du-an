import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { ProjectDetailContext } from "@/features/project_details";
import {Layers, PanelLeftClose, PanelLeftOpen, Users} from "lucide-react";
import "./projectGantt.css"
import { useGanttChart } from "@/features/project_details/tabs/gantt/useGanttChart";
import type { GridColumn } from "dhtmlx-gantt";

const columns: GridColumn[] = [
    {
        name: "text",
        label: "Nhiệm vụ",
        tree: true,
        width: 200,
        min_width: 150,
        resize: true
    }
];



export const ProjectGantt: React.FC = () => {
    const { projectDetail, allTasks } = useOutletContext<ProjectDetailContext>();
    const [groupBy, setGroupBy] = useState<string>('column');
    const [showGrid, setShowGrid] = useState<boolean>(false);

    const { ganttContainer } = useGanttChart({
        projectDetail,
        groupBy,
        allTasks,
        columns,
        showGrid
    });

    return (
        <div className="h-full w-full flex flex-col bg-white overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-3 border-b border-gray-200 bg-white shadow-sm z-10">

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200 w-full sm:w-auto">
                    <button
                        onClick={() => setShowGrid(!showGrid)}
                        className={`
                            p-2 rounded-lg border transition-all flex items-center justify-center gap-1
                            ${showGrid
                            ? "bg-blue-50 border-blue-200 text-blue-600"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}
                        `}
                    >
                        {showGrid ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                    <button
                        onClick={() => setGroupBy('column')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                            groupBy === 'column'
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                    >
                        <Layers size={14} />
                        <span>Theo Cột</span>
                    </button>
                    <button
                        onClick={() => setGroupBy('member')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                            groupBy === 'member'
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                    >
                        <Users size={14} />
                        <span>Thành viên</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 relative w-full overflow-x-auto bg-gray-50">
                <div
                    ref={ganttContainer}
                    className="absolute inset-0 w-full h-full gantt-container-custom"
                />
            </div>
        </div>
    );
}