import {NotificationService} from "@/shared/services";
import {useEffect, useMemo, useState} from "react";
import {useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {EventSourcePolyfill} from 'event-source-polyfill';
import type {AppNotification} from "@/shared/types";


export const useNotificationStream = (userId: string, accessToken: string) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
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

    const derivedNotifications = useMemo(() => {
        if (data) {
            return data.pages
                .map(p => p.content).flat();
        }
        return [];
    }, [data]);

    useEffect(() => {
        setNotifications(derivedNotifications);
    }, [derivedNotifications]);


    useEffect(() => {
        if (!accessToken) return;

        const sseUrl = import.meta.env.VITE_API_BASE_URL + `/api/notifications/stream`;
        const eventSource = new EventSourcePolyfill(sseUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            heartbeatTimeout: 120000
        });

        eventSource.addEventListener("connected", (event: any) => {
            console.log(event.data);
            setIsConnected(true);
        });


        eventSource.onerror = (err: any) => {
            console.error('SSE Error:', err);
            setIsConnected(false);

            if (err.status === 401) {
                console.log('Token expired, closing connection notification');
                eventSource.close();
            }
        };

        eventSource.addEventListener('notification', (event: any) => {
            const notification: AppNotification = JSON.parse(event.data);
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