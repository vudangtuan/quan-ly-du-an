import { useEffect, useMemo, useState } from 'react';
import { Bell, UserPlus, Trash2, MessageSquare, Users, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useNotificationStream } from '@/shared/hooks';
import type { AppNotification } from '@/shared/types';

interface NotificationBellProps {
    userId: string;
    accessToken: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
}

export const NotificationBell = ({
                                     userId,
                                     accessToken,
                                     align = "end",
                                     side = "bottom"
                                 }: NotificationBellProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const {
        notifications,
        isConnected,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        markAllReadMutation
    } = useNotificationStream(userId, accessToken);

    useEffect(() => {
        if (isOpen) {
            markAllReadMutation.mutate();
        }
    }, [isOpen]);

    const unreadCount = useMemo(() =>
        notifications.filter(n => !n.isRead).length, [notifications]);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'INVITE_MEMBER':
                return <UserPlus className="w-5 h-5 text-blue-500" />;
            case 'ASSIGN_TASK':
                return <Users className="w-5 h-5 text-green-500" />;
            case 'REMOVE_ASSIGNEE_TASK':
                return <Trash2 className="w-5 h-5 text-red-500" />;
            case 'MENTION':
                return <MessageSquare className="w-5 h-5 text-purple-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    };

    const renderNotificationContent = (notification: AppNotification) => {
        const { properties, subject, content } = notification;
        const type = properties.type;

        switch (type) {
            case 'INVITE_MEMBER':
                return (
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                            {properties.creatorName} mời bạn tham gia
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            Dự án: <span className="font-medium">{properties.projectName}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Vai trò: {properties.role}</p>
                        {properties.link && (
                            <a
                                href={properties.link}
                                className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                Chấp nhận lời mời →
                            </a>
                        )}
                    </div>
                );

            case 'ASSIGN_TASK':
                return (
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                            {properties.creatorName} đã thêm bạn vào nhiệm vụ
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{properties.titleTask}</span>
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span>Dự án: {properties.projectName}</span>
                        </div>
                        {properties.dueAt && (
                            <p className="text-xs text-red-500 mt-1">
                                Hạn: {new Date(properties.dueAt).toLocaleDateString('vi-VN')}
                            </p>
                        )}
                        {properties.link && (
                            <a
                                href={properties.link}
                                className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                Xem nhiệm vụ →
                            </a>
                        )}
                    </div>
                );

            case 'REMOVE_ASSIGNEE_TASK':
                return (
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                            {properties.creatorName} đã xóa bạn khỏi nhiệm vụ
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{properties.taskTitle}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Dự án: {properties.projectName}</p>
                    </div>
                );

            case 'MENTION':
                return (
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                            {properties.creatorName} đã nhắc đến bạn
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{content || 'trong một bình luận'}</p>
                        {properties.link && (
                            <a
                                href={properties.link}
                                className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                Xem bình luận →
                            </a>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{subject}</p>
                        {content && <p className="text-sm text-gray-600 mt-1">{content}</p>}
                    </div>
                );
        }
    };

    return (
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <Popover.Trigger asChild>
                <button
                    className="relative p-1.5 hover:bg-slate-800 group rounded-full transition-colors outline-none"
                    aria-label="Thông báo"
                >
                    <Bell className="w-6 h-6 text-slate-400 group-hover:text-white" />

                    {/* Badge số lượng thông báo chưa đọc */}
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full min-w-[16px]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}

                    {/* Chấm trạng thái kết nối SSE */}
                    <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                            isConnected ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                    />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    className="w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] outline-none
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                     data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                     data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2
                     data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2"
                    sideOffset={5}
                    align={align}
                    side={side}
                    collisionPadding={10}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50 rounded-t-lg">
                        <h3 className="text-base font-semibold text-gray-900">Thông báo</h3>
                        <Popover.Close className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <X className="w-4 h-4" />
                        </Popover.Close>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Bell className="w-10 h-10 mb-3 text-gray-300" />
                                <p className="text-sm">Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification: AppNotification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                            !notification.isRead ? 'bg-blue-50/60' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.properties.type)}
                                            </div>
                                            {renderNotificationContent(notification)}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 ml-8">
                                            <span className="text-[11px] text-gray-400">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {hasNextPage && (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="w-full py-3 text-sm text-blue-600 hover:bg-gray-50 font-medium transition-colors border-t border-gray-100 flex justify-center items-center gap-2"
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                Đang tải...
                                            </>
                                        ) : (
                                            'Xem thêm'
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <Popover.Arrow className="fill-white drop-shadow-sm" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};