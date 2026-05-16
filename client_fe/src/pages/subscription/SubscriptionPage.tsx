import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from './CheckoutForm';
import { useGetPlans, useCreateStripeIntent } from '../../hooks/subscription/useSubscription'
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SubscriptionPage = () => {
  const navigate = useNavigate()
  const { data: plansData, isLoading } = useGetPlans();
  
  const [clientSecret, setClientSecret] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  
  const { mutateAsync: createIntent, isPending: isCreatingIntent } = useCreateStripeIntent();

  const handleSubscribe = async (planId: number) => {
    try {
      const res = await createIntent(planId);
      const secret = (res as any)?.clientSecret || res?.data?.clientSecret;
      
      if (secret) {
        setClientSecret(secret);
        setSelectedPlan(planId);
      }
    } catch (error: any) {
      console.error("Error from BE:", error.response?.data || error);
      alert(`Error: ${error.response?.data?.error || "Connection lost!"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-xl text-text-sub">Loading...</div>
      </div>
    );
  }

  const plans = (plansData as any)?.results || plansData || [];

  return (
    <div className="min-h-screen bg-base py-20 px-4 text-text-main font-sans">
      <div className="max-w-6xl mx-auto text-center">
        {/* Header */}
        <h1 className="text-4xl font-extrabold mb-4 text-text-main">
          Upgrade to Premium
        </h1>
        <p className="text-lg text-text-sub mb-12">
          Ad-free music listening, offline downloads, and highest audio quality.
        </p>

        {/* Khung item cac gói dky */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan: any) => {
            const isBestValue = plan.duration_days === 180;
            const isProcessingThisPlan = isCreatingIntent && selectedPlan === plan.id;
            
            return (
              <div 
                key={plan.id} 
                className={`relative rounded-2xl shadow-sm border p-8 flex flex-col transition-transform hover:-translate-y-1 bg-card ${
                  isBestValue 
                    ? 'border-highlight ring-2 ring-highlight shadow-[0_0_20px_rgba(29,185,84,0.2)]' 
                    : 'border-border'
                }`}
              >
                {/* Badge Best Option */}
                {isBestValue && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-highlight text-text-dark text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Best Option
                    </span>
                  </div>
                )}
                  {/* Tên gói */}
                <h3 className="text-xl font-semibold text-text-main">{plan.name}</h3>
                
                  {/* Giá gói */}
                <div className="mt-4 flex items-baseline justify-center text-4xl font-extrabold text-text-main">
                  {formatCurrency(plan.price)}
                </div>
                <p className="mt-2 text-sm text-text-sub">for {plan.duration_days} days</p>

                  {/* Lợi ích */}
                <ul className="mt-8 space-y-4 text-sm text-text-sub flex-1 text-left">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-highlight mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Ad-free music listening
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-highlight mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Download to listen offline
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-highlight mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Highest audio quality
                  </li>
                </ul>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    handleSubscribe(plan.id);
                  }}
                  disabled={isCreatingIntent}
                  className={`mt-8 block w-full py-3 px-6 rounded-full text-center font-bold tracking-wide hover:scale-105 focus:outline-none transition-all ${
                    isBestValue 
                      ? 'bg-highlight text-text-dark hover:brightness-110' 
                      : 'bg-panel text-text-main border border-border hover:bg-hover'
                  } ${isProcessingThisPlan ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
                >
                  {isProcessingThisPlan ? 'Processing...' : 'Get Premium'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL NHẬP THẺ STRIPE */}
      {clientSecret && selectedPlan && (
        <div className="fixed inset-0 bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-panel border border-border p-8 rounded-2xl w-100 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-2 text-text-main text-center">Enter Card Details</h2>
            <p className="text-sm text-text-sub mb-6 text-center bg-search py-2 rounded-lg">
              Test card: <span className="text-text-main font-mono">4242 4242 4242 4242</span> <br/> 
              Exp: <span className="text-text-main font-mono">12/34</span> | CVC: <span className="text-text-main font-mono">123</span>
            </p>
            
            {/* Box chứa thẻ Stripe */}
            <div className="mb-4">
               <Elements 
                stripe={stripePromise} 
                options={{ clientSecret }}
              >

                <CheckoutForm 
                  clientSecret={clientSecret} 
                  planId={selectedPlan}
                  onSuccess={() => {
                    setClientSecret('');
                    setSelectedPlan(null);
                    navigate('/');
                  }}
                />
              </Elements>
            </div>
            
            <button 
              onClick={() => setClientSecret('')} 
              className="mt-4 text-text-sub hover:text-text-main text-sm font-medium w-full text-center transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;