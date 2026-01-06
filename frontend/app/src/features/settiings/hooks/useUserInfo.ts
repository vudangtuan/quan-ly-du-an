import type {UserInfo} from "@/shared/types";
import {useState} from "react";
import {useAuthStore} from "@/store";
import {useMutation} from "@tanstack/react-query";
import {UserService} from "@/shared/services";
import toast from "react-hot-toast";


export const useUserInfo = (user:UserInfo) => {
    const [fullName, setFullName] = useState(user.fullName || '');
    const updateAction = useAuthStore((state) => state.update);

    const updateNameMutation = useMutation({
        mutationFn: () => UserService.updateName(fullName),
        onSuccess: (data: UserInfo) => {
            updateAction(data);
        },
        onError: (e) => {
            toast.error(e.message);
            setFullName(user.fullName);
        }
    });
    return {fullName, setFullName , updateNameMutation};
}