import {useQuery} from "@tanstack/react-query";
import {ProjectService, TaskService} from "@/shared/services";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {useMemo} from "react";


export const useProjectDetail = (projectId: string) => {
    const {data: projectDetail, isLoading: isLoadingProject, isError: isErrorProject} = useQuery({
        queryKey: ["projectDetails", projectId],
        queryFn: () => ProjectService.getDetailProject(projectId!),
        enabled: !!projectId,
        gcTime: QUERY_GC_TIME.SHORT,
        staleTime: QUERY_STALE_TIME.SHORT,
    });

    const {data: tasks, isLoading: isLoadingTasks, isError: isErrorTasks} = useQuery({
        queryKey: ["tasks", projectId],
        queryFn: () => TaskService.getTasksByProject(projectId!),
        enabled: !!projectId,
        gcTime: QUERY_GC_TIME.SHORT,
        staleTime: QUERY_STALE_TIME.SHORT,
    });
    const isLoading = useMemo(() => {
        return isLoadingTasks || isLoadingProject;
    }, [isLoadingProject, isLoadingTasks]);
    const isError = useMemo(() => {
        return isErrorProject || isErrorTasks;
    }, [isErrorTasks, isErrorProject]);


    return {
        projectDetail, tasks, isLoading, isError
    }
}