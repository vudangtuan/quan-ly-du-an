import {useInfiniteQuery} from "@tanstack/react-query";
import {ProjectService} from "@/shared/services";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {useMemo} from "react";

export const useProject = (userId: string) => {
    const {
        data, isLoading, error,
        fetchNextPage, hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['projects', userId],
        queryFn: ({pageParam = 0}) => {
            return ProjectService.getProjects(pageParam, 6);
        },
        enabled: !!userId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
    });
    const projects = useMemo(() => {
        return data?.pages.flatMap(page => page.content) || [];
    }, [data]);

    return {
        isLoading, error, projects, fetchNextPage, hasNextPage, isFetchingNextPage
    }
}