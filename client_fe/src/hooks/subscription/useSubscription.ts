import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "../../api/subscription/api";

export const useGetPlans = () => {
    return useQuery({
        queryKey: ['subscriptionPlans'],
        queryFn: () => subscriptionApi.getPlans()
    });
};

export const useCreateStripeIntent = () => {
    return useMutation({
        mutationFn: (planId: number) => subscriptionApi.createStripeIntent(planId)
    });
};
