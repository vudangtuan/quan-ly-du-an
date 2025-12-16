import React, {type ReactNode, useState} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {Loader2, Mail, Search, User, UserPlus, X} from "lucide-react";
import {useAddMember} from "../hooks";
import {OptionRole} from "../components";
import {Avatar} from "@/shared/components";


interface AddMemberDialogProps {
    children: ReactNode;
    projectId: string
}


export const MemberInvitationFormDialog: React.FC<AddMemberDialogProps> = ({children, projectId}) => {
    const {
        selectedRole, setSelectedRole, handleCancel,
        isLoading, inviteMemberMutation, selectedUserId, setSelectedUserId,
        allSearchedUsers, searchUserQuery, searchQuery, setSearchQuery
    } = useAddMember(projectId);
    const [open, setOpen] = useState(false);
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            handleCancel();
        }
    }
    const handleSubmit = () => {
        inviteMemberMutation.mutate();
    }
    return (
        <Dialog.Root modal open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in
                                data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                                 data-[state=open]:fade-in-0 duration-300"/>
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%]
                                            translate-y-[-50%] bg-white rounded-lg shadow-xl
                                            w-[90%] max-w-xl max-h-[90vh] flex flex-col
                                            data-[state=open]:animate-in data-[state=closed]:animate-out
                                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                                            duration-300 ease-out">
                    <div
                        className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b
                                  border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="items-center gap-3">
                            <Dialog.Title className="text-lg font-semibold text-gray-900">
                                Mời thành viên
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500">
                                Tìm kiếm và mời người khác tham gia dự án
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="rounded-full p-2 hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500"/>
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <form className="flex flex-col gap-5">
                            {/* Search Bar */}
                            <div className="">
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
                                {isLoading && searchQuery.trim() !== '' && (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2"/>
                                            <p className="text-sm text-gray-500">Đang tìm kiếm...</p>
                                        </div>
                                    </div>
                                )}

                                {!isLoading && searchQuery.trim() !== '' && allSearchedUsers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <User className="h-12 w-12 text-gray-400 mb-3"/>
                                        <p className="text-sm font-medium text-gray-900 mb-1">Không tìm thấy người
                                            dùng</p>
                                        <p className="text-xs text-gray-500">Thử tìm kiếm với từ khóa khác</p>
                                    </div>
                                )}

                                {!isLoading && allSearchedUsers.length > 0 && (
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
                                                    <Avatar userId={user.userId} fullName={user.fullName}/>
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

                                        {searchUserQuery.hasNextPage && (
                                            <div className="pt-2">
                                                {searchUserQuery.isFetchingNextPage ? (
                                                    <div className="flex justify-center items-center py-3">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600"/>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => searchUserQuery.fetchNextPage()}
                                                        disabled={searchUserQuery.isFetchingNextPage}
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
                            {/*option role*/}
                            <OptionRole selectedRole={selectedRole} setSelectedRole={setSelectedRole}/>
                        </form>
                        <div className={"flex items-center justify-end"}>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={inviteMemberMutation.isPending || !selectedUserId}
                                className=" px-4 py-2 text-sm font-medium text-white bg-blue-600
                             hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {inviteMemberMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                        Đang thêm...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4"/>
                                        Gửi lời mời
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}