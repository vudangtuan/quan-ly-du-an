import {ProjectDetailHeader} from "../components/ProjectDetailHeader";
import {Link, Outlet, useLocation, useParams} from "react-router-dom";
import React from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "../services/ProjectService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {Loader2} from "lucide-react";
import {useAuthStore} from "@store/slices/authSlice";
import {ProjectDetailResponse} from "@features/projects/types/project.types";
import {TaskResponse} from "@features/projects/types/task.types";
import {TaskService} from "@features/projects/services/TaskService";
import {useTaskFilter} from "@features/projects/components/kanban/useTaskFilter";
import {SearchTaskBar} from "@features/projects/components/kanban/SearchTaskBar";

export interface ProjectDetailContext {
    projectDetail: ProjectDetailResponse;
    allTasks: TaskResponse[] | undefined;
    filteredKanbanTasks: TaskResponse[];
}

export const ProjectDetailPage: React.FC = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const userId = useAuthStore.getState().userInfo?.userId;
    const queryClient = useQueryClient();
    const location = useLocation();


    const {data: projectDetail, isLoading: isLoadingProject, error: errorProject} = useQuery({
        queryKey: ["projectDetails", projectId],
        queryFn: () => ProjectService.getDetailProject(projectId!),
        enabled: !!projectId,
        gcTime: QUERY_GC_TIME.SHORT,
        staleTime: QUERY_STALE_TIME.SHORT,
    });
    const {data: tasks, isLoading: isLoadingTasks} = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () => TaskService.getTasksByProject(projectId!),
        enabled: !!projectId,
        gcTime: QUERY_GC_TIME.SHORT,
        staleTime: QUERY_STALE_TIME.SHORT,
    });
    const filterControls = useTaskFilter(tasks);
    const showKanbanFilterBar = location.pathname.endsWith('/kanban');
    if (isLoadingProject || isLoadingTasks) {
        return (
            <div className="flex w-full justify-center h-full items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-blue-700"/>
            </div>
        );
    }
    if (errorProject) {
        queryClient.invalidateQueries({queryKey: ["projects", userId]});
        return <div>Có lỗi xảy ra. Có thể bạn đã bị xóa khỏi dự án.
            <Link to={"/projects"} className="hover:underline text-blue-700">
                {" Chuyển tới trang dự án"}</Link>
        </div>;
    }
    const outletContext: ProjectDetailContext = {
        projectDetail: projectDetail!,
        allTasks: tasks,
        filteredKanbanTasks: filterControls.filteredTasks,
    };

    return (
        <div className={"pt-8 h-screen flex flex-col overflow-hidden"}>
            <div className={"flex-shrink-0"}>
                <ProjectDetailHeader projectName={projectDetail!.name}/>
                {showKanbanFilterBar && projectDetail && (
                    <div className={"flex-shrink-0"}>
                        <SearchTaskBar
                            project={projectDetail}
                            {...filterControls}
                        />
                    </div>
                )}
            </div>
            <div className={`flex-1 overflow-hidden`}>
                <Outlet context={outletContext}/>
            </div>
        </div>
    )
}