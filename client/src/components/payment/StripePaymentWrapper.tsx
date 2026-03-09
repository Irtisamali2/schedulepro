import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Initialize Stripe outside component
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
    ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
    : null;

interface StripePaymentWrapperProps {
    plan: any;
    billingPeriod: 'monthly' | 'yearly';
    customerEmail: string;
    onSuccess: () => void;
}

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href, // This might need to be adjusted based on flow
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
            } else {
                // Payment succeeded
                onSuccess();
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
            <PaymentElement />

            {errorMessage && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now
                    </>
                )}
            </Button>

            <div className="flex items-center justify-center text-xs text-gray-500 gap-1">
                <Lock className="w-3 h-3" />
                <span>Payments secured by Stripe</span>
            </div>
        </form>
    );
}

export default function StripePaymentWrapper({
    plan,
    billingPeriod,
    customerEmail,
    onSuccess
}: StripePaymentWrapperProps) {
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Fetch payment intent
        const createPaymentIntent = async () => {
            if (!plan) return;

            try {
                const response = await fetch('/api/payments/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: plan.id,
                        clientEmail: customerEmail,
                        billingPeriod
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to create payment intent');
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
            } catch (error) {
                console.error('Payment setup error:', error);
                toast({
                    title: "Payment Setup Error",
                    description: "Could not initialize payment. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        createPaymentIntent();
    }, [plan, billingPeriod, customerEmail]);

    if (!stripePromise) {
        return (
            <div className="p-4 bg-red-50 text-red-800 rounded-md">
                Stripe configuration missing. Please add VITE_STRIPE_PUBLIC_KEY to your .env file.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="p-4 bg-red-50 text-red-800 rounded-md text-center">
                Unable to initialize payment. Please try again.
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm onSuccess={onSuccess} />
        </Elements>
    );
}
