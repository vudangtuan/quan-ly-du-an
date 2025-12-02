import React from "react";
import {useOutletContext} from "react-router-dom";
import {ProjectInfo} from "@features/projects/components/overview/ProjectInfo";
import {ProjectMember} from "@features/projects/components/overview/ProjectMember";
import {ProjectLabel} from "@features/projects/components/overview/ProjectLabel";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {ProjectActivity} from "@features/projects/components/overview/ProjectActivity";
import {LogOut, ShieldAlert, Trash2} from "lucide-react";

export const ProjectOverview: React.FC = () => {
    const {projectDetail:project} = useOutletContext<ProjectDetailContext>();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 p-8 h-full overflow-auto">
            <div className="sm:col-span-2 flex flex-col gap-6">
                <ProjectInfo project={project}/>
                <ProjectMember members={project.members}
                               projectId={project.projectId}
                               canManage={project.currentRoleInProject === 'OWNER'}
                />

            </div>
            <div className="sm:col-span-2 flex flex-col gap-6">
                <ProjectLabel labels={project.labels}
                              projectId={project.projectId}
                              canManage={project.currentRoleInProject === 'OWNER'}/>
                <ProjectActivity/>
            </div>
        </div>
    )
}