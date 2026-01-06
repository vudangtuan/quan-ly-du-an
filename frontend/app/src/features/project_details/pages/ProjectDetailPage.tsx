import React from "react";
import {Link, Outlet, useParams} from "react-router-dom";
import {useActivityStream, useProjectDetail} from "@/features/project_details/hooks";
import {Loader2} from "lucide-react";
import {ProjectDetailHeader} from "@/features/project_details/layouts";
import type {ProjectDetailResponse, TaskResponse} from "@/shared/types";
import {ChatBot} from "@/features/project_details/components";

export interface ProjectDetailContext {
    projectDetail: ProjectDetailResponse;
    allTasks: TaskResponse[];
    activityStream: any;
}

export const ProjectDetailPage: React.FC = () => {
    const {projectId} = useParams<{ projectId: string }>();

    const {projectDetail, tasks, isLoading, isError} = useProjectDetail(projectId!);
    const activityStream = useActivityStream(projectId!);

    const outletContext: ProjectDetailContext = {
        projectDetail: projectDetail!,
        allTasks: tasks!,
        activityStream: activityStream,
    };


    if (isLoading) {
        return (
            <div className="flex w-full justify-center h-full items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-blue-700"/>
            </div>
        );
    }
    if (isError) {
        return (
            <div>Có lỗi xảy ra. Có thể bạn đã bị xóa khỏi dự án.
                <Link to={"/projects"} className="hover:underline text-blue-700">
                    {" Chuyển tới trang dự án"}</Link>
            </div>
        );
    }
    return (
        <div className={"pt-5 h-screen flex flex-col overflow-hidden"}>
            <ProjectDetailHeader project={projectDetail!}
                                 activityConnected={activityStream.isConnected}/>
            <div className={`flex-1 overflow-hidden`}>
                <Outlet context={outletContext}/>
            </div>
            <ChatBot project={projectDetail!}/>
        </div>
    )
}