import React from "react";
import {useAuthStore} from "@/store";
import {Loader2, Lock, Save} from "lucide-react";
import {usePassword} from "@/features/settiings/hooks";


export const UserSecurity: React.FC = () => {
    const userInfo = useAuthStore(state => state.userInfo);

    const {
        currentPassword, setCurrentPassword,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        createPasswordMutation, updatePasswordMutation
    } = usePassword(userInfo!);

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (userInfo!.hasPassword) {
            updatePasswordMutation.mutate();
        } else {
            createPasswordMutation.mutate();
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit">
            <div className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b
                                   border-gray-200">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <Lock size={25}/>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{userInfo!.hasPassword ? "Đổi mật khẩu" : "Tạo mật khẩu"}</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 p-5">
                {userInfo!.hasPassword &&
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
                            !newPassword.trim() || !confirmPassword.trim()}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg
                         hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createPasswordMutation.isPending ||
                        updatePasswordMutation.isPending
                            ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4"/>}
                        Cập nhật mật khẩu
                    </button>
                </div>
            </form>
        </div>
    );
}