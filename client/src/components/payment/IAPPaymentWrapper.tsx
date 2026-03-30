import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { purchaseSubscription, getIAPProduct, type IAPProduct } from '@/lib/iap';

interface IAPPaymentWrapperProps {
  plan: any;
  billingPeriod: 'monthly' | 'yearly';
  customerEmail: string;
  onSuccess: () => void;
}

// Map plan names to App Store Connect product IDs
const IAP_PRODUCT_IDS: Record<string, Record<string, string>> = {
  basic: {
    monthly: 'com.scheduledpro.basic.monthly',
    yearly: 'com.scheduledpro.basic.yearly',
  },
  team: {
    monthly: 'com.scheduledpro.team.monthly',
    yearly: 'com.scheduledpro.team.yearly',
  },
};

function getProductId(plan: any, billingPeriod: 'monthly' | 'yearly'): string {
  const planName = (plan.name || '').toLowerCase().trim();
  return IAP_PRODUCT_IDS[planName]?.[billingPeriod] || `com.scheduledpro.${planName}.${billingPeriod}`;
}

export default function IAPPaymentWrapper({
  plan,
  billingPeriod,
  customerEmail,
  onSuccess,
}: IAPPaymentWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [product, setProduct] = useState<IAPProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const productId = getProductId(plan, billingPeriod);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const iapProduct = await getIAPProduct(productId);
        setProduct(iapProduct);
      } catch (err: any) {
        console.error('Failed to load IAP product:', err);
        setError('Unable to load subscription details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      const transaction = await purchaseSubscription(productId);

      // Verify the purchase with our server
      const response = await fetch('/api/iap/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction,
          productId,
          planId: plan.id,
          billingPeriod,
          customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify purchase');
      }

      toast({
        title: 'Purchase Successful',
        description: 'Your subscription has been activated!',
      });

      onSuccess();
    } catch (err: any) {
      const message = err.message || 'Purchase failed. Please try again.';
      setError(message);
      toast({
        title: 'Purchase Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
      <div className="text-center space-y-2">
        <Smartphone className="h-10 w-10 text-blue-600 mx-auto" />
        <h3 className="font-semibold text-lg">Subscribe via App Store</h3>
        {product ? (
          <p className="text-gray-600">
            {product.displayName} — {product.displayPrice}/{billingPeriod === 'monthly' ? 'month' : 'year'}
          </p>
        ) : (
          <p className="text-gray-600">
            {plan.name} Plan — ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}/{billingPeriod === 'monthly' ? 'month' : 'year'}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Secure payment through Apple</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Cancel anytime from your device settings</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Subscription auto-renews until cancelled</span>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handlePurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Smartphone className="mr-2 h-4 w-4" />
            Subscribe with Apple
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-400">
        Payment will be charged to your Apple ID account. Subscription automatically renews unless
        cancelled at least 24 hours before the end of the current period.
      </p>
    </div>
  );
}
