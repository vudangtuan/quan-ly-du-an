import {useOutletContext} from "react-router-dom";
import type {ProjectDetailContext} from "@/features/project_details";
import React from "react";
import {ProjectActivity, ProjectInfo, ProjectLabels, ProjectMember} from "./components";



export const ProjectOverview: React.FC = () => {
    const {projectDetail} = useOutletContext<ProjectDetailContext>();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 p-4 lg:p-8 h-full overflow-auto">
            <div className="sm:col-span-2 flex flex-col gap-6">
                <ProjectInfo project={projectDetail}/>
                <ProjectLabels project={projectDetail}/>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-6">
                <ProjectMember project={projectDetail}/>
                <ProjectActivity/>
            </div>
        </div>
    )
}