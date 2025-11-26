import React from "react";
import {useNavigate, useOutletContext} from "react-router-dom";
import {ProjectDetailContext} from "@features/projects/pages/ProjectDetailPage";
import {Avatar} from "@components/Avatar";
import {
    Archive,
    ArrowRight,
    CheckCircle2,
    Edit, Loader2, MessageSquare,
    PlusCircle,
    RotateCcw,
    Trash2, Undo,
} from "lucide-react";
import {Activity, ChangeLog} from "@features/projects/types/project.types";
import {formatDateLocalDate} from "@features/utils/date.utils";
import {useAuthStore} from "@store/slices/authSlice";


export const ProjectActivity: React.FC = () => {
    const {activityStream} = useOutletContext<ProjectDetailContext>();
    return (
        <div className={"overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm"}>
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
            border-gray-200 flex justify-between items-center">
                <h3 className={"text-base font-semibold text-gray-900 flex items-center gap-2"}>
                    Hoạt động gần đây
                </h3>
            </div>
            <div className={"h-100 flex flex-col overflow-auto"}>
                {activityStream.activities.map((activity: Activity) => (
                    <ActivityItem key={activity.id} activity={activity}></ActivityItem>
                ))}
                {activityStream.hasNextPage &&
                    <div className="flex items-center justify-center p-4">
                        <button
                            onClick={activityStream.fetchNextPage}
                            className="group relative px-6 py-2.5 font-medium text-blue-600 transition-all duration-200 hover:text-blue-700">
                            {activityStream.isFetchingNextPage ? <Loader2 className="h-5 w-5 animate-spin"/> :
                                <span className="relative z-10">Tải thêm</span>}
                            <div
                                className="absolute inset-0 rounded-lg bg-blue-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100"/>
                        </button>
                    </div>}
            </div>
        </div>
    );
}

interface ActivityItemProps {
    activity: Activity;
}

const getActionIcon = (actionType: string) => {
    if (actionType.includes('COMMENT')) {
        return <MessageSquare className="h-3 w-3 text-indigo-600"/>;
    }
    if (actionType.includes('INCOMPLETE')) {
        return <Undo className="h-3 w-3 text-gray-600"/>;
    }
    if (actionType.includes('CREATE') || actionType.includes('ADD')) return <PlusCircle
        className="h-3 w-3 text-blue-600"/>;
    if (actionType.includes('UPDATE') || actionType.includes('MOVE')) return <Edit className="h-3 w-3 text-amber-600"/>;
    if (actionType.includes('COMPLETE')) return <CheckCircle2 className="h-3 w-3 text-green-600"/>;
    if (actionType.includes('DELETE')) return <Trash2 className="h-3 w-3 text-red-600"/>;
    if (actionType.includes('ARCHIVE')) return <Archive className="h-3 w-3 text-gray-600"/>;
    if (actionType.includes('RESTORE')) return <RotateCcw className="h-3 w-3 text-cyan-600"/>;
    return <div className="h-1.5 w-1.5 rounded-full bg-gray-400"/>;
};

export const ActivityItem: React.FC<ActivityItemProps> = ({activity}) => {
    const changes = activity.metadata?.changes as ChangeLog[] | undefined;
    const userInfo = useAuthStore((state) => state.userInfo);
    const isMe = userInfo?.userId === activity.actorId;
    const displayName = isMe ? "Bạn" : activity.actorName;
    const navigate = useNavigate();
    return (
        <div onDoubleClick={() => {
            if (activity.taskId) {
                navigate(`/projects/${activity.projectId}/kanban?taskId=${activity.taskId}`);
            } else {
                navigate(`/projects/${activity.projectId}`);
            }
        }}
             title={"xem chi tiết"}
             className="flex gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group animate-in fade-in slide-in-from-top-1 duration-300">
            {/* Avatar & Icon */}
            <div className="relative flex-shrink-0 mt-1 h-fit">
                <Avatar fullname={activity.actorName} className="h-9 w-9"/>
                <div
                    className="absolute -bottom-1.5 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                    {getActionIcon(activity.actionType)}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                {/* Header: Người dùng + Hành động + Đối tượng */}
                <div className="text-sm text-gray-900">
                    <span className="font-semibold">{displayName}</span>
                    {' '}{activity.description}{' '}
                    {activity.targetName && (
                        <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                            {activity.targetName}
                        </span>
                    )}
                </div>

                {/* Body: Danh sách thay đổi (Generic Rendering) */}
                {changes && changes.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {changes.map((change, idx) => (
                            <div key={idx}
                                 className="text-xs flex items-center gap-1.5 text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 w-fit max-w-full">
                                <span className="font-semibold text-gray-700 flex-shrink-0">{change.field}:</span>

                                <span
                                    className={`truncate max-w-[100px] ${!change.old ? 'italic text-gray-400' : 'line-through text-gray-400'}`}>
                                    {change.old || 'Trống'}
                                </span>

                                <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0"/>

                                <span
                                    className={`truncate max-w-[150px] font-medium ${!change.new ? 'italic text-gray-400' : 'text-green-700'}`}>
                                    {change.new || 'Trống'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer: Thời gian */}
                <div className="mt-1 text-xs text-gray-400">
                    {formatDateLocalDate(activity.createdAt)}
                </div>
            </div>
        </div>
    );
};