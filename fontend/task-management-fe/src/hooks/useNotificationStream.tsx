import {useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {NotificationService} from "@features/projects/services/NotificationService";
import {useEffect, useState} from "react";
import {EventSourcePolyfill} from 'event-source-polyfill';
import {Notification} from "@features/projects/types/project.types";
import toast from "react-hot-toast";


export const useNotificationStream = (userId: string, accessToken: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const queryClient = useQueryClient();

    const markAllReadMutation = useMutation({
        mutationFn: () => NotificationService.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['notifications', userId]});
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const {data, fetchNextPage, isLoading, hasNextPage, isFetchingNextPage} = useInfiniteQuery({
        queryKey: ["notifications", userId],
        queryFn: ({pageParam}) =>
            NotificationService.getNotifications(pageParam, 10),
        initialPageParam: 0,
        enabled: !!userId,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length;
            const totalPages = lastPage.totalPages || 0;
            return nextPage < totalPages ? nextPage : undefined;
        },
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (data) {
            setNotifications(data.pages.map(p => p.content).flat())
        }
    }, [data]);

    useEffect(() => {
        if (!accessToken) return;

        const sseUrl = `/api/notifications/stream`;
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
        });

        eventSource.onclose = () => {
            console.log("Closed event source notification");
        }

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            setIsConnected(false);

            if (err.status === 401) {
                console.log('Token expired, closing connection notification');
                eventSource.close();
            }
        };

        eventSource.addEventListener('notification', (event) => {
            const notification: Notification = JSON.parse(event.data);
            setNotifications(prevState => [notification, ...prevState]);
        });

        return () => {
            eventSource.close();
            setIsConnected(false);
            console.log("Closed event source notification");
        };

    }, [accessToken]);

    return {
        notifications,
        isConnected,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        markAllReadMutation
    };
}