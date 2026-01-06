import {useConfirm} from "@/confirm_dialog";
import {useMutation} from "@tanstack/react-query";
import {AuthService} from "@/shared/services";
import toast from "react-hot-toast";
import {useAuthStore} from "@/store";


export const useLogout = () => {
    const confirm = useConfirm();
    const logoutAction = useAuthStore(state => state.logout);
    const logoutMutation = useMutation({
        mutationFn: () => AuthService.logout(),
        onSuccess: () => {
            window.location.href = "/login";
            logoutAction();
        },
        onError: (e) => {
            toast.error(e.message);
        }
    });
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
    return {handleLogout}
}