import {useInfiniteQuery} from "@tanstack/react-query";
import {ActivityService} from "@/shared/services";
import {QUERY_STALE_TIME} from "@/utils";
import {Loader2} from "lucide-react";
import {ActivityItem} from "@/features/project_details/tabs/overview/components";
import React from "react";

interface TaskActivityProps {
    taskId: string;
}

export const TaskActivity: React.FC<TaskActivityProps> = ({taskId}) => {
    const {
        data,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["task-activity", taskId],
        queryFn: ({pageParam = 0}) =>
            ActivityService.getActivityByTaskId(taskId, pageParam, 5),
        getNextPageParam: (lastPage) => {
            return lastPage.last ? undefined : lastPage.number + 1;
        },
        initialPageParam: 0,
        staleTime: QUERY_STALE_TIME.SHORT,
    });

    const activities = data?.pages.flatMap(page => page.content) || [];

    return (
        <div className="space-y-2 px-2 relative">
            <div className="text-md font-medium">Hoạt động</div>

            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600"/>
                </div>
            ) : activities.length === 0 ? (
                <p className="text-xs text-gray-400 italic px-2">Chưa có hoạt động nào.</p>
            ) : (
                <div className="">
                    {activities.map((activity) => (
                        <div key={activity.id} className="">
                            <ActivityItem activity={activity}/>
                        </div>
                    ))}

                    {hasNextPage && (
                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => fetchNextPage()}
                                className="group relative px-6 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
                                {isFetchingNextPage ? <Loader2 className="h-5 w-5 animate-spin"/> :
                                    <span className="relative z-10">Tải thêm</span>}
                                <div
                                    className="absolute inset-0 rounded-lg bg-blue-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"/>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};