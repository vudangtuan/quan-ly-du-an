import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import React, {useState} from "react";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {Layers, Users} from "lucide-react";
import "./projectGantt.css"
import {useGanttChart} from "@/features/project_details/tabs/gantt/useGanttChart";
import type {GridColumn} from "dhtmlx-gantt";


const columns: GridColumn[] = [
    {
        name: "text",
        label: "Tên nhiệm vụ",
        tree: true,
        width: 220,
    }
];


export const ProjectGantt: React.FC = () => {
    const {projectDetail, allTasks} = useOutletContext<ProjectDetailContext>();
    const [groupBy, setGroupBy] = useState<string>('column');

    const {ganttContainer} = useGanttChart({projectDetail, groupBy, allTasks,columns});


    return (
        <>
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
                            <span>Cột</span>
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