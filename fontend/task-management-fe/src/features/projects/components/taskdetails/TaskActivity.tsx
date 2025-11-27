import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";
import { ActivityService } from "@features/projects/services/ActivityService";
import { ActivityItem } from "../overview/ProjectActivity";
import { QUERY_STALE_TIME } from "@config/query.config";

interface TaskActivityProps {
    taskId: string;
}

export const TaskActivity: React.FC<TaskActivityProps> = ({ taskId }) => {
    const {
        data,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["task-activity", taskId],
        queryFn: ({ pageParam = 0 }) =>
            ActivityService.getActivityByTaskId(taskId, pageParam, 5),
        getNextPageParam: (lastPage) => {
            return lastPage.last ? undefined : lastPage.number + 1;
        },
        initialPageParam: 0,
        staleTime: QUERY_STALE_TIME.SHORT,
    });

    const activities = data?.pages.flatMap(page => page.content) || [];

    return (
        <div className="space-y-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <History className="h-4 w-4" />
                <h3>Lịch sử hoạt động</h3>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
            ) : activities.length === 0 ? (
                <p className="text-sm text-gray-400 italic px-2">Chưa có hoạt động nào.</p>
            ) : (
                <div className="">
                    {activities.map((activity) => (
                        <div key={activity.id} className="">
                                <ActivityItem activity={activity} />
                        </div>
                    ))}

                    {hasNextPage && (
                        <div className="flex items-center justify-center p-4">
                            <button
                                onClick={()=>fetchNextPage()}
                                className="group relative px-6 py-2.5 font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
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