import React, {useState} from 'react';
import {useAuthStore} from '@store/slices/authSlice';
import {User, Lock, Save, Loader2, User2, ShieldAlert, LogOut} from 'lucide-react';
import toast from 'react-hot-toast';
import {useMutation} from "@tanstack/react-query";
import {UserService} from "@features/projects/services/UserService";
import {UserInfo} from "@features/auth/types/auth.types";
import {AuthService} from "@features/auth/services/authService";
import {data, useNavigate} from "react-router-dom";
import {useConfirm} from "@components/ConfirmDialog";


const SettingsPage: React.FC = () => {
    const {userInfo} = useAuthStore();
    const navigate = useNavigate();
    const confirm = useConfirm();

    // --- State cho Form Thông tin ---
    const [fullName, setFullName] = useState(userInfo?.fullName || '');

    // --- State cho Form Mật khẩu ---
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const updateAction = useAuthStore((state) => state.update);
    const logoutAction = useAuthStore((state) => state.logout);
    //Mutation
    const updateNameMutation = useMutation({
        mutationFn: () => UserService.updateName(fullName),
        onSuccess: (data: UserInfo) => {
            updateAction(data);
        },
        onError: (e) => {
            toast.error(e.message);
            setFullName(userInfo.fullName);
        }
    });
    const logoutMutation = useMutation({
        mutationFn: () => AuthService.logout(),
        onSuccess: () => {
            navigate('/login');
            logoutAction();
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const createPasswordMutation = useMutation({
        mutationFn: () => AuthService.createPassword({password: newPassword, confirmPassword: confirmPassword}),
        onSuccess: () => {
            updateAction({...userInfo, hasPassword: true});
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Cập nhập thành công');
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
    const updatePasswordMutation = useMutation({
        mutationFn: () => AuthService.updatePassword({
            password: currentPassword,
            confirmPassword: confirmPassword, newPassword: newPassword
        }),
        onSuccess: () => {
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
            toast.success('Cập nhập thành công');
        },
        onError: (e) => {
            toast.error(e.message);
        }
    })

    // Handler cập nhật thông tin
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        updateNameMutation.mutate();
    };

    // Handler đổi mật khẩu
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userInfo.hasPassword) {
            updatePasswordMutation.mutate();
        } else {
            createPasswordMutation.mutate();
        }
    };

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: 'Đăng xuất?',
            description: `Bạn có chắc chắn muốn đăng xuất chứ?`,
            confirmText: 'Đăng xuất ngay',
            isLoading: logoutMutation.isPending,
            type: 'danger',
        });
        if (confirmed) {
            logoutMutation.mutate();
        }
    };
    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Cài đặt tài khoản</h1>

            {/* Grid layout*/}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* BOX 1: THÔNG TIN CHUNG */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit">
                    <div className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
                                    border-gray-200">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <User2 size={25}/>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-5 p-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={userInfo?.email}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                            <input
                                type="text"
                                value={fullName}
                                onBlur={() => setFullName(userInfo?.fullName)}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Nhập họ tên của bạn"
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={fullName.trim().length === 0 || updateNameMutation.isPending || fullName === userInfo.fullName}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {updateNameMutation.isPending ? <Loader2 className="animate-spin h-4 w-4"/> :
                                    <Save className="h-4 w-4"/>}
                                Lưu thông tin
                            </button>
                        </div>
                    </form>
                </div>

                {/* BOX 2: BẢO MẬT */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit">
                    <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
                                   border-gray-200">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Lock size={25}/>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{userInfo.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5 p-5">
                        {userInfo.hasPassword &&
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện
                                    tại</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        }
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
                            <input
                                type="password"
                                value={newPassword}
                                minLength={8}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Xác nhận mật khẩu mới
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all ${
                                    newPassword !== confirmPassword && confirmPassword !== ''
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="••••••••"
                            />
                            {newPassword !== confirmPassword && confirmPassword !== '' && (
                                <p className="text-red-500 font-semibold text-xs mt-1 ml-1">Mật khẩu không khớp</p>
                            )}
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={createPasswordMutation.isPending ||
                                    updatePasswordMutation.isPending ||
                                    (userInfo.hasPassword && !currentPassword) ||
                                    !newPassword.trim() ||!currentPassword.trim() ||
                                    newPassword.trim() !== confirmPassword.trim()}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {createPasswordMutation.isPending ||
                                updatePasswordMutation.isPending
                                    ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                                Cập nhật mật khẩu
                            </button>
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-red-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <ShieldAlert size={20}/>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Quản lý phiên đăng nhập</h2>
                            <p className="text-sm text-gray-500">Đăng xuất khỏi tài khoản của bạn trên thiết bị này.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        >
                            <LogOut className="h-4 w-4"/>
                            Đăng xuất
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default SettingsPage