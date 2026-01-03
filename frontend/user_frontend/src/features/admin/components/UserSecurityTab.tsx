import React from 'react';
import {
    Lock, Unlock, Trash2
} from 'lucide-react';
import {AdminService, type User} from "@/shared/services";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {useConfirm} from "@/confirm_dialog";
import {useNavigate} from "react-router-dom";


interface UserSecurityTabProp {
    user: User
}

export const UserSecurityTab: React.FC<UserSecurityTabProp> = ({user}) => {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const navigate = useNavigate();
    const banUserMutation = useMutation({
        mutationFn: () => AdminService.banUser(user.userId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['user', user.userId]});
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const unbanUserMutation = useMutation({
        mutationFn: () => AdminService.unBanUser(user.userId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['user', user.userId]});
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const deleteUserMutation = useMutation({
        mutationFn: () => AdminService.deleteUser(user.userId),
        onSuccess: () => {
            navigate(-1);
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })

    const handleClickBanUser = async () => {
        if (user.status === 'ACTIVE') {
            const confirmed = await confirm({
                type: "danger",
                confirmText: "Khóa",
                isLoading: banUserMutation.isPending,
                title: "Khóa tài khoản",
                cancelText: "Hủy",
                description: "Bạn có chắc khóa tài khoản này không?"
            });
            if (confirmed) {
                banUserMutation.mutate();
            }
        }
        if (user.status === 'SUSPENDED') {
            const confirmed = await confirm({
                type: "info",
                confirmText: "Mở khóa",
                isLoading: unbanUserMutation.isPending,
                title: "Mở tài khoản",
                cancelText: "Hủy",
                description: "Bạn có chắc mở khóa tài khoản này không?"
            });
            if (confirmed) {
                unbanUserMutation.mutate();
            }
        }
    }

    const handleDeleteUser = async () => {
        const confirmed = await confirm({
            type: "danger",
            confirmText: "Xóa",
            isLoading: deleteUserMutation.isPending,
            title: "Xóa",
            cancelText: "Hủy",
            description: "Bạn có chắc xóa vĩnh viễn tài khoản này không?"
        });
        if (confirmed) {
            deleteUserMutation.mutate();
        }
    }
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="p-6 bg-white space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {user.status === 'ACTIVE'
                                    ? 'Người dùng sẽ bị đăng xuất ngay lập tức và không thể truy cập hệ thống.'
                                    : 'Cho phép người dùng đăng nhập trở lại.'}
                            </p>
                        </div>
                        <button
                            onClick={handleClickBanUser}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm text-white ${
                                user.status === 'ACTIVE'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {user.status === 'ACTIVE' ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
                            {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                    </div>

                    <div className="w-full h-px bg-gray-100"></div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Xóa vĩnh viễn</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Hành động này <span className="text-red-600 font-bold">không thể hoàn tác</span>. Toàn
                                bộ dữ liệu của user sẽ bị xóa.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteUser}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-500 text-sm font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                        >
                            <Trash2 className="w-4 h-4"/>
                            Xóa
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};