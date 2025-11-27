import {useEffect, useState} from "react";
import {useAuthStore} from "@store/slices/authSlice";
import {EventSourcePolyfill} from 'event-source-polyfill';
import {Activity} from "@features/projects/types/project.types";
import {ActivityService} from "@features/projects/services/ActivityService";
import toast from "react-hot-toast";
import {useInfiniteQuery, useQueryClient} from "@tanstack/react-query";
import {QUERY_STALE_TIME} from "@config/query.config";


// eslint-disable-next-line react-refresh/only-export-components
export const useActivityStream = (projectId: string) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();
    const accessToken = useAuthStore((state) => state.accessToken);

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
    useEffect(() => {
        if (data) {
            setActivities(data.pages.map(p => p.content).flat())
        }
    }, [data]);
    useEffect(() => {
        if (!projectId) return;
        if (!accessToken) return;

        const sseUrl = `/api/activity/stream/project/${projectId}`;
        const eventSource = new EventSourcePolyfill(sseUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            heartbeatTimeout: 120000,
            connectionTimeout: 10000
        });


        eventSource.addEventListener("connected", (event) => {
            console.log(event.data);
            setIsConnected(true);
        })


        eventSource.addEventListener('activity', (event) => {
            const activity = JSON.parse(event.data);
            setActivities(prev => [activity, ...prev]);
            toast.custom(t => <ActivityToast activity={activity}/>, {
                duration: 1000,
                position: 'top-left',
            })
            if (activity.actionType.includes("PROJECT") ||
                activity.actionType.includes("MEMBER") ||
                activity.actionType.includes("ROLE") ||
                activity.actionType.includes("LABEL") ||
                activity.actionType.includes("BOARD_COLUMN")) {
                queryClient.invalidateQueries({queryKey: ['projectDetails', projectId]});
            }
            if (activity.taskId) {
                queryClient.invalidateQueries({queryKey: ['task', activity.taskId]});
                queryClient.invalidateQueries({queryKey: ['tasks', projectId]});
                queryClient.invalidateQueries({queryKey: ['task-activity', activity.taskId]});
            }
        });

        eventSource.onclose = ()=>{
            console.log("Closed event source");
        }


        eventSource.onerror = (err) => {
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


interface ActivityToastProps {
    activity: Activity;
}

export const ActivityToast = ({activity}: ActivityToastProps) => {
    const getBadgeColor = (actionType: string) => {
        if (actionType.includes('DELETE')) return 'bg-red-100 text-red-700';
        if (actionType.includes('CREATE') || actionType.includes('ADD')) return 'bg-green-100 text-green-700';
        if (actionType.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
        if (actionType.includes('COMPLETE')) return 'bg-green-100 text-green-700';
        if (actionType.includes('ARCHIVE')) return 'bg-orange-100 text-orange-700';
        if (actionType.includes('RESTORE')) return 'bg-purple-100 text-purple-700';
        if (actionType.includes('MOVE')) return 'bg-indigo-100 text-indigo-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 max-w-sm">
            {/* Action Badge */}
            <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${getBadgeColor(activity.actionType)}`}>
                {activity.actionType}
            </span>

            {/* Content */}
            <div className="mt-2">
                <p className="text-md font-semibold text-gray-900">
                    {activity.actorName}
                </p>
                <p className="text-md font-semibold text-gray-600 mt-1">
                    {activity.description}
                </p>
            </div>
        </div>
    );
};