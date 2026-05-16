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

export const useGetProfileForSystem = () => {
    return;
}