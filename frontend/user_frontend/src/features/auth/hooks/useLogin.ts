import {useState} from "react";
import {useAuthStore} from "@/store";
import {useMutation} from "@tanstack/react-query";
import {AuthService} from "@/shared/services";
import type {CredentialResponse} from "@react-oauth/google";


export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const loginAction =
        useAuthStore((state) => state.login);

    const loginMutation = useMutation({
        mutationFn: () => AuthService.login({email, password}),
        onSuccess: (auth) => {
            loginAction(auth);
        },
        onError: (error) => {
            if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        }
    });

    const loginGoogleMutation = useMutation({
        mutationFn: (credentialResponse: CredentialResponse) =>
            AuthService.loginWithGoogle(credentialResponse.credential),
        onSuccess: (auth) => {
            loginAction(auth);
        },
        onError: (error) => {
            if (error.message) {
                setError(error.message);
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        }
    });

    return {
        error, setError, email, setEmail, password, setPassword, loginMutation, loginGoogleMutation
    }
}