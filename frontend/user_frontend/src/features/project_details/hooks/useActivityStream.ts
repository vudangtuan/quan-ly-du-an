import {useEffect, useMemo, useState} from "react";
import {EventSourcePolyfill} from 'event-source-polyfill';
import {useInfiniteQuery, useQueryClient} from "@tanstack/react-query";
import type {Activity} from "@/shared/types";
import {useAuthStore} from "@/store";
import {ActivityService} from "@/shared/services";


export const useActivityStream = (projectId: string) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();
    const accessToken = useAuthStore((state) => state.accessToken);
    const userId = useAuthStore(state => state.userInfo!.userId);

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ["activities", projectId],
        queryFn: ({pageParam = 0}) =>
            ActivityService.getActivityByProjectId(projectId, pageParam, 10),
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
        enabled: !!projectId,
        initialPageParam: 0,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    const derivedActivities = useMemo(() => {
        if (data) {
            return data.pages
                .map(p => p.content).flat();
        }
        return [];
    }, [data]);

    useEffect(() => {
        setActivities(derivedActivities)
    }, [derivedActivities]);


    useEffect(() => {
        if (!projectId) return;
        if (!accessToken) return;

        const sseUrl = `/api/activity/stream/project/${projectId}`;
        const eventSource = new EventSourcePolyfill(sseUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            heartbeatTimeout: 120000,
        });


        eventSource.addEventListener("connected", (event: any) => {
            console.log(event.data);
            setIsConnected(true);
        })


        eventSource.addEventListener('activity', (event: any) => {
            const activity:Activity = JSON.parse(event.data);
            setActivities(prev => [activity, ...prev]);
            if(activity.taskId){
                queryClient.invalidateQueries({queryKey: ['task-activity', activity.taskId]});
            }
            if(activity.actorId===userId) return;
            if (activity.actionType.includes("PROJECT") ||
                activity.actionType.includes("MEMBER") ||
                activity.actionType.includes("ROLE") ||
                activity.actionType.includes("LABEL") ||
                activity.actionType.includes("BOARD_COLUMN")) {
                queryClient.invalidateQueries({queryKey: ['projectDetails', projectId]});
                if (activity.actionType.includes("DELETE_BOARD_COLUMN")) {
                    queryClient.invalidateQueries({queryKey: ['archived', projectId]});
                }
            }
            if (activity.taskId) {
                if (activity.actionType.includes("DELETE_TASK")) {
                    queryClient.invalidateQueries({queryKey: ['archived', projectId]});
                } else {
                    queryClient.invalidateQueries({queryKey: ['task', activity.taskId]});
                    queryClient.invalidateQueries({queryKey: ['tasks', projectId]});
                }
            }
            if (activity.actionType.includes("ARCHIVE") ||
                activity.actionType.includes("RESTORE")) {
                queryClient.invalidateQueries({queryKey: ['archived', projectId]});
            }
        });

        eventSource.onerror = (err: any) => {
            console.error('SSE Error:', err);
            setIsConnected(false);

            if (err.status === 401) {
                console.log('Token expired, closing connection');
                eventSource.close();
            }
        };
        return () => {
            eventSource.close();
            setIsConnected(false);
            console.log("Closed event source");
        };
    }, [accessToken, projectId]);
    return {
        activities, isConnected, isLoading
        , isFetchingNextPage, hasNextPage, fetchNextPage
    };
}