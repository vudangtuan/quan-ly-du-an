import React from "react";
import * as Dialog from "@radix-ui/react-dialog"
import * as Tabs from "@radix-ui/react-tabs";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {TaskService} from "@/shared/services";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@/utils";
import {Loader2, HistoryIcon, MessageSquare} from "lucide-react";
import {
    TaskActivity,
    TaskAssignees,
    TaskCheckLists, TaskComment,
    TaskDescription,
    TaskFields,
    TaskHeader,
    TaskOverdue,
    TaskTitle
} from "./components";


export const TaskDetailDialog: React.FC = () => {
    const {taskId, projectId} = useParams<{ taskId: string, projectId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { backgroundLocation?: Location };

    const {data: task, isLoading, error} = useQuery({
        queryKey: ["task", taskId],
        queryFn: () => TaskService.getTask(projectId!, taskId!),
        enabled: !!projectId && !!taskId,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT
    });

    const handleClose = () => {
        if (state?.backgroundLocation) {
            navigate(-1);
        } else {
            navigate(`/project/${projectId}/kanban`);
        }
    };


    return (
        <Dialog.Root open={true} modal={false} onOpenChange={(open) => {
            if (!open) {
                handleClose();
            }
        }}>
            <Dialog.Title/>
            <Dialog.Portal>
                <Dialog.Content
                    aria-describedby=""
                    className={`fixed right-0 top-0 z-40 h-full w-full sm:w-150 flex flex-col
                        bg-white shadow-2xl overflow-hidden
                        data-[state=open]:animate-in data-[state=closed]:animate-out
                        data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
                        duration-500 ease-in-out`}
                >
                    {isLoading && <div className="flex-1 flex items-center justify-center p-6">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin"/>
                    </div>}
                    {error && <div className="flex-1 flex items-center justify-center p-6">
                        <span className="font-semibold text-red-500">Có lỗi xảy ra or đã bị xóa</span>
                    </div>}
                    {(!isLoading && !error) && <>
                        <TaskHeader task={task!}/>

                        <div className="overflow-y-auto scrollbar-thin py-3 px-5 flex flex-col space-y-3">
                            <TaskTitle task={task!}/>
                            <div className="space-y-3 text-xs px-2">
                                <TaskAssignees task={task!}/>
                                <TaskOverdue task={task!}/>
                                <TaskFields task={task!}/>
                            </div>
                            <TaskDescription task={task!}/>
                            <TaskCheckLists task={task!}/>
                            <Tabs.Root defaultValue="comments" className="w-full">
                                <Tabs.List className="flex w-full border-b border-gray-200 mb-4">
                                    <Tabs.Trigger
                                        value="comments"
                                        className="flex-1 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent
                                                   data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
                                                   hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={14}/>
                                        Bình luận
                                    </Tabs.Trigger>
                                    <Tabs.Trigger
                                        value="activity"
                                        className="flex-1 pb-2 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent
                                                   data-[state=active]:text-blue-600 data-[state=active]:border-blue-600
                                                   hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <HistoryIcon size={14}/>
                                        Hoạt động
                                    </Tabs.Trigger>
                                </Tabs.List>

                                <Tabs.Content value="comments"
                                              className="outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50">
                                    <TaskComment task={task!}/>
                                </Tabs.Content>

                                <Tabs.Content value="activity"
                                              className="outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50">
                                    <TaskActivity taskId={task!.taskId}/>
                                </Tabs.Content>
                            </Tabs.Root>
                            <div className="h-10"></div>
                        </div>
                    </>}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}