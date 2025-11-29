import React, {useState} from "react";
import {useDebounce} from "@hooks/useDebounce";
import {
    InviteMemberRequest, PaginatedResponse,
    ProjectDetailResponse,
    ProjectMemberResponse, ProjectResponse,
    ProjectRole
} from "@features/projects/types/project.types";
import {type InfiniteData, useInfiniteQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {UserService} from "@features/projects/services/UserService";
import {QUERY_GC_TIME, QUERY_STALE_TIME} from "@config/query.config";
import {ProjectService} from "@features/projects/services/ProjectService";
import toast from "react-hot-toast";
import {Loader2, Search, X, UserPlus, Mail, User} from "lucide-react";
import {Avatar} from "@components/Avatar";
import * as Dialog from "@radix-ui/react-dialog";
import {useAuthStore} from "@store/slices/authSlice";
import {roleOptions} from "@features/projects/components/overview/ProjectMember";

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({isOpen, onClose, projectId}) => {
    const queryClient = useQueryClient();
    const queryCache = queryClient.getQueryCache();
    const userId = useAuthStore.getState().userInfo?.userId;


    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<ProjectRole>("EDITOR");


    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isLoading: isLoadingSearch,
        isFetchingNextPage
    } = useInfiniteQuery({
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined
            if (!lastPage.last) {
                return lastPage.number + 1;
            }
            return undefined;
        },
        initialPageParam: 0,
        queryFn: ({pageParam = 0}: { pageParam: number | undefined }) => {
            if (debouncedSearchQuery.trim() === '') {
                return Promise.resolve(null);
            }
            return UserService.searchUsers(pageParam, 5, debouncedSearchQuery)
        },
        queryKey: ["searchsUser", debouncedSearchQuery],
        enabled: isOpen && debouncedSearchQuery.length > 0,
        staleTime: QUERY_STALE_TIME.SHORT,
        gcTime: QUERY_GC_TIME.SHORT,
    });

    const allSearchedUsers = infiniteData?.pages.flatMap(page => page ? page.content : []) || [];

    const isDebouncing = searchQuery !== debouncedSearchQuery;
    const showLoadingSpinner = isDebouncing || isLoadingSearch;

    const inviteMemberMutation = useMutation({
        mutationFn: (data: InviteMemberRequest) => {
            return ProjectService.sendInvitation(data);
        },
        onSuccess: () => {
            toast.success('Đã gửi lời mời');
            onClose();
            setSearchQuery("")
            setSelectedUserId("")
            setSelectedRole("EDITOR")
        },
        onError: (error) => {
            toast.error(`${error.message || 'Không thể thêm thành viên'}`);
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast.error('Vui lòng chọn thành viên từ danh sách');
            return;
        }
        const data: InviteMemberRequest = {
            projectId: projectId,
            memberId: selectedUserId,
            role: selectedRole
        }
        inviteMemberMutation.mutate(data)
    };

    const handleCancel = () => {
        if (!inviteMemberMutation.isPending) {
            onClose();
            setSearchQuery("")
            setSelectedUserId("")
            setSelectedRole("EDITOR")
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleCancel}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"/>
                <Dialog.Content
                    className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-xl w-[90%] max-w-xl max-h-[90vh] flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 ease-out">

                    {/* Header */}
                    <div
                        className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div>
                                <Dialog.Title className="text-lg font-semibold text-gray-900">
                                    Thêm thành viên
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-gray-500">
                                    Tìm kiếm và mời người khác tham gia dự án
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="rounded-full p-2 hover:bg-gray-200 transition-colors"
                                disabled={inviteMemberMutation.isPending}
                            >
                                <X className="h-5 w-5 text-gray-500"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            {/* Search Bar */}
                            <div className="px-6 pt-5 pb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm thành viên
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400"/>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Nhập tên hoặc email..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                                        disabled={inviteMemberMutation.isPending}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* User List */}
                            <div className="px-6 pb-4">
                                {showLoadingSpinner && searchQuery.trim() !== '' && (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2"/>
                                            <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
                                        </div>
                                    </div>
                                )}

                                {!showLoadingSpinner && searchQuery.trim() !== '' && allSearchedUsers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <User className="h-12 w-12 text-gray-400 mb-3"/>
                                        <p className="text-sm font-medium text-gray-900 mb-1">Không tìm thấy người
                                            dùng</p>
                                        <p className="text-xs text-gray-500">Thử tìm kiếm với từ khóa khác</p>
                                    </div>
                                )}

                                {!showLoadingSpinner && allSearchedUsers.length > 0 && (
                                    <div className="space-y-2">
                                        {allSearchedUsers.map(user => (
                                            <label
                                                key={user.userId}
                                                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                                                    selectedUserId === user.userId
                                                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="selectedUser"
                                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    checked={selectedUserId === user.userId}
                                                    onChange={() => setSelectedUserId(user.userId)}
                                                    disabled={inviteMemberMutation.isPending}
                                                />
                                                <div className="relative">
                                                    <Avatar fullname={user.fullName}/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {user.fullName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                        <Mail className="h-3 w-3"/>
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}

                                        {hasNextPage && (
                                            <div className="pt-2">
                                                {isFetchingNextPage ? (
                                                    <div className="flex justify-center items-center py-3">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600"/>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => fetchNextPage()}
                                                        disabled={isFetchingNextPage}
                                                        className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        Tải thêm kết quả
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Role Selection */}
                            <div className="px-6 pb-5 border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Vai trò
                                </label>
                                <div className="space-y-2">
                                    {roleOptions.map((role) => (
                                        <div
                                            key={role.value}
                                            onClick={() => !inviteMemberMutation.isPending && setSelectedRole(role.value as ProjectRole)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                                                transition-all duration-150
                                                ${selectedRole === role.value
                                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                                : "border-gray-200 bg-white hover:border-gray-300"
                                            }
                                                ${inviteMemberMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}
                                            `}
                                        >
                                            {/* Radio button */}
                                            <div className="flex-shrink-0">
                                                <div className={`
                                                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                                                    transition-colors
                                                    ${selectedRole === role.value
                                                    ? "border-blue-500 bg-blue-500"
                                                    : "border-gray-300 bg-white"
                                                }
                                                `}>
                                                    {selectedRole === role.value && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Role info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={role.color}>{role.icon}</span>
                                                    <span className="font-medium text-sm text-gray-900">
                                                        {role.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600">{role.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={inviteMemberMutation.isPending}
                            >
                                Hủy
                            </button>
                        </Dialog.Close>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={inviteMemberMutation.isPending || !selectedUserId}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {inviteMemberMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin"/>
                                    Đang thêm...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4"/>
                                    Thêm vào dự án
                                </>
                            )}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}