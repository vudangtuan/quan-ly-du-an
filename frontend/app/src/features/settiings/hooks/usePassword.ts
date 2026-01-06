import type {UserInfo} from "@/shared/types";
import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {AuthService} from "@/shared/services";
import {useAuthStore} from "@/store";
import toast from "react-hot-toast";


export const usePassword = (user: UserInfo) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const updateAction = useAuthStore((state) => state.update);

    const createPasswordMutation = useMutation({
        mutationFn: () => AuthService.createPassword({password: newPassword, confirmPassword: confirmPassword}),
        onSuccess: () => {
            updateAction({...user, hasPassword: true});
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Tạo thành công');
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

    return{
        currentPassword,setCurrentPassword,
        newPassword,setNewPassword,
        confirmPassword,setConfirmPassword,
        createPasswordMutation,updatePasswordMutation
    }
}