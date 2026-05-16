import { useMutation } from "@tanstack/react-query";
import authApi from "../api/auth/api";

export const useLogin = () => {
    return useMutation({
        mutationFn: (data: any) => authApi.login(data)
    })
}

export const useRegister = () => {
    return useMutation({
        mutationFn: (data: any) => authApi.register(data)
    })
}

export const useForgotPassword = () => {
    return useMutation({ 
        mutationFn: (email: string) => authApi.forgotPassword(email) 
    });

}
export const useVerifyOTP = () => {
    return useMutation({ 
        mutationFn: (data: { email: string, otp: string }) => authApi.verifyOTP(data) 
    });
}
export const useResetPassword = () => {
    return useMutation({ 
        mutationFn: (data: any) => authApi.resetPassword(data) 
    });
}