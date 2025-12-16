import React from "react";
import {Loader2, Save, User2} from "lucide-react";
import {useUserInfo} from "@/features/settiings/hooks";
import {useAuthStore} from "@/store";


export const UserInformation: React.FC = () => {
    const userInfo = useAuthStore((state) => state.userInfo);
    const {fullName, setFullName, updateNameMutation} = useUserInfo(userInfo!);


    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        updateNameMutation.mutate();
    };
    return (
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
                        onBlur={() => setFullName(userInfo!.fullName)}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Nhập họ tên của bạn"
                    />
                </div>
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={fullName.trim().length === 0 || updateNameMutation.isPending || fullName === userInfo!.fullName}
                        className="w-full sm:w-auto flex justify-center items-center gap-2 px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {updateNameMutation.isPending ? <Loader2 className="animate-spin h-4 w-4"/> :
                            <Save className="h-4 w-4"/>}
                        Lưu thông tin
                    </button>
                </div>
            </form>
        </div>
    );
}