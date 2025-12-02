import {ProjectDetailHeader} from "../components/ProjectDetailHeader";
import {Link, Outlet, useLocation, useParams} from "react-router-dom";
import React from "react";
import {useInfiniteQuery, useQuery, useQueryClient} from "@tanstack/react-query";
import {ProjectService} from "../services/ProjectService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {Loader2} from "lucide-react";
import {useAuthStore} from "@store/slices/authSlice";
import {ProjectDetailResponse} from "@features/projects/types/project.types";
import {TaskResponse} from "@features/projects/types/task.types";
import {TaskService} from "@features/projects/services/TaskService";
import {useTaskFilter} from "@features/projects/components/kanban/useTaskFilter";
import {SearchTaskBar} from "@features/projects/components/kanban/SearchTaskBar";
import {useActivityStream} from "@hooks/useActivityStream";

export interface ProjectDetailContext {
    projectDetail: ProjectDetailResponse;
    allTasks: TaskResponse[] | undefined;
    filteredKanbanTasks: TaskResponse[];
    activityStream: any;
    archivedItemsInfiniteQuery: any
}

export const ProjectDetailPage: React.FC = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const userId = useAuthStore.getState().userInfo?.userId;
    const queryClient = useQueryClient();
    const location = useLocation();
    const activityStream = useActivityStream(projectId);

    const archivedItemsInfiniteQuery = useInfiniteQuery({
        queryKey: ["archived", projectId],
        queryFn: ({pageParam = 0}) => {
            return ProjectService.getItemArchived(projectId!, pageParam, 10);
        },
        enabled: !!projectId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
    })

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
    if (isLoadingProject || isLoadingTasks || activityStream.isLoading || archivedItemsInfiniteQuery.isPending) {
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
        activityStream: activityStream,
        archivedItemsInfiniteQuery: archivedItemsInfiniteQuery
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