import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { userApi } from '../../api/user/api';
import { useAuthStore } from '../../stores/auth/authStore';
import { useQueryClient } from '@tanstack/react-query';

export const CheckoutForm = ({ clientSecret, onSuccess }: any) => {
    const stripe = useStripe();
    const elements = useElements();

    // quản lý gán user sau khi dky xong
    const { setUser } = useAuthStore(state => state)
    const queryClient = useQueryClient()
    // quản lý trang 5 thái thanh toán
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError(null);

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement)!,
            }
        });

        if (result.error) {
            setError(result.error.message || 'Payment failed');
            setProcessing(false);
        } else {
            if (result.paymentIntent?.status === 'succeeded') {
                CustomToast.success("Payment successful! Upgrading your account...");
                // Đợi 3s cho Webhook BE chạy xong rồi -> cập nhật lại UI
                setTimeout(async () => {
                    try {
                        await queryClient.invalidateQueries({
                            queryKey: ['user_me']
                        })
                        const userData: any = await userApi.getMe();
                        setUser(userData.data || userData);
                        onSuccess();
                    } catch(error) {
                        console.error('Error updating user: ', error);
                        onSuccess()
                    }
                }, 3000);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-xl bg-search shadow-sm">
            <div className="mb-4 p-3 border rounded border-gray-300">
                <CardElement 
                    options={{ 
                        hidePostalCode: true,
                        style: {
                            base: { color: '#ffffff', '::placeholder': { color: '#b3b3b3' } },
                        },
                    }} 
                />
            </div>
            {/* báo lỗi */}
            {error && <div className="text-error mb-4 text-sm font-semibold">{error}</div>}
            {/* nút thanh toán */}
            <button 
                type="submit" 
                disabled={!stripe || processing}
                className="w-full bg-highlight text-text-dark py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50"
            >
                {processing ? 'Processing Payment...' : 'Pay Now'}
            </button>
        </form>
    );
}