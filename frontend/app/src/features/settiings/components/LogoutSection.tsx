import {LogOut, ShieldAlert} from "lucide-react";
import {useLogout} from "@/features/settiings/hooks";


export const LogoutSection = () => {
    const {handleLogout} = useLogout();
    return (
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
    );
}