import { api } from "../axiosConfig";

export const subscriptionApi = {
    getPlans: () => api.get('/subscription/plans/'),
    createStripeIntent: (planId: number) => api.post('/subscription/stripe/create-intent/', { plan_id: planId }),
};