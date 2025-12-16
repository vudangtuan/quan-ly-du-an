import React from "react";
import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import {useFilterTask} from "@/shared/hooks";
import {KanbanBoard} from "./components";
import {TaskCreationForm, TaskFilterBar} from "@/features/project_details/components";


export const ProjectKanban: React.FC = () => {
    const {allTasks, projectDetail} = useOutletContext<ProjectDetailContext>();
    const filter = useFilterTask(allTasks);
    return (
        <div className={"py-2 px-4 space-y-2"}>
            <div className={"flex items-center justify-between"}>
                <TaskFilterBar {...filter} allMembers={projectDetail.members}/>
                <TaskCreationForm>
                    <button className="flex items-center justify-center gap-1 px-4 py-1.5
                             bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                             text-white text-sm font-semibold rounded-lg
                             transition-all shadow-sm hover:shadow-md">
                        <span>Tạo nhiệm vụ</span>
                    </button>
                </TaskCreationForm>
            </div>
            <div className={"h-screen"}>
                <KanbanBoard
                    tasks={filter.filteredTasks}
                    columns={projectDetail.boardColumns}/>
            </div>
        </div>
    );
}