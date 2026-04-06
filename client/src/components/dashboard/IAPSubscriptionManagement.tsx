import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Loader2,
  Star,
  Users,
  HardDrive,
  Zap,
  AlertTriangle,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getIAPProducts,
  purchaseSubscription,
  getActiveSubscriptions,
  manageSubscriptions,
  type IAPProduct,
} from '@/lib/iap';

interface SubscriptionDetails {
  id: string;
  planId: string;
  planName: string;
  planPrice: number;
  billing: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'CANCELLED' | 'TRIAL' | 'PAST_DUE';
  currentPeriodEnd: string;
  nextPaymentDate: string;
  features: string[];
  maxUsers: number;
  storageGB: number;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
}

interface PlanFromAPI {
  id: string;
  name: string;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  description?: string;
  features?: string[];
  maxUsers?: number;
  storageGB?: number;
  isPopular?: boolean;
  isFreeTrial?: boolean;
}

// Map plan names to App Store Connect product IDs
const IAP_PRODUCT_IDS: Record<string, Record<string, string>> = {
  basic: {
    monthly: 'com.scheduledpro.basic.month',
    yearly: 'com.scheduledpro.basic.year',
  },
  team: {
    monthly: 'com.scheduledpro.team.month',
    yearly: 'com.scheduledpro.team.year',
  },
};

function getProductId(planName: string, billingPeriod: 'monthly' | 'yearly'): string {
  const key = planName.toLowerCase().trim();
  const suffix = billingPeriod === 'monthly' ? 'month' : 'year';
  return IAP_PRODUCT_IDS[key]?.[billingPeriod] || `com.scheduledpro.${key}.${suffix}`;
}

interface IAPSubscriptionManagementProps {
  clientId: string;
}

export default function IAPSubscriptionManagement({ clientId }: IAPSubscriptionManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanFromAPI | null>(null);
  const [iapProducts, setIapProducts] = useState<Record<string, IAPProduct>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeIAPSubscriptions, setActiveIAPSubscriptions] = useState<string[]>([]);

  // Fetch subscription details
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionDetails>({
    queryKey: [`/api/client/${clientId}/subscription`],
    enabled: !!clientId,
  });

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<PlanFromAPI[]>({
    queryKey: ['/api/public/plans'],
  });

  // Load IAP products from App Store
  useEffect(() => {
    const loadIAPProducts = async () => {
      try {
        const paidPlans = plans.filter(p => !p.isFreeTrial);
        if (paidPlans.length === 0) {
          setLoadingProducts(false);
          return;
        }

        const productIds = paidPlans.flatMap(plan => [
          getProductId(plan.name, 'monthly'),
          getProductId(plan.name, 'yearly'),
        ]);

        const products = await getIAPProducts(productIds);
        const productMap: Record<string, IAPProduct> = {};
        products.forEach(p => { productMap[p.id] = p; });
        setIapProducts(productMap);

        const activeSubs = await getActiveSubscriptions();
        setActiveIAPSubscriptions(activeSubs);
      } catch (err) {
        console.error('Failed to load IAP products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (plans.length > 0) {
      loadIAPProducts();
    }
  }, [plans]);

  const handlePlanSelect = (plan: PlanFromAPI) => {
    setPendingPlan(plan);
    setShowUpgradeConfirm(true);
  };

  const handlePurchase = async () => {
    if (!pendingPlan) return;

    const productId = getProductId(pendingPlan.name, billingPeriod);
    setIsPurchasing(productId);
    setShowUpgradeConfirm(false);

    try {
      const transactionId = await purchaseSubscription(productId);

      // Verify the purchase with our server
      const response = await apiRequest('/api/iap/verify', 'POST', {
        transaction: transactionId,
        productId,
        planId: pendingPlan.id,
        billingPeriod,
      });

      if (!response.ok) {
        throw new Error('Failed to verify purchase with server');
      }

      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/subscription`] });

      // Refresh active subscriptions
      const activeSubs = await getActiveSubscriptions();
      setActiveIAPSubscriptions(activeSubs);

      toast({
        title: 'Subscription Activated',
        description: `You are now on the ${pendingPlan.name} plan!`,
      });
    } catch (err: any) {
      const message = err.message || 'Purchase failed. Please try again.';
      toast({
        title: 'Purchase Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(null);
      setPendingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await manageSubscriptions();
    } catch (err) {
      toast({
        title: 'Unable to open',
        description: 'Could not open subscription management. Please go to Settings > Subscriptions on your device.',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getDisplayPrice = (plan: PlanFromAPI): string => {
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    if (price == null) return '$0';
    return formatPrice(price);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default' as const;
      case 'TRIAL': return 'secondary' as const;
      case 'CANCELLED': return 'destructive' as const;
      case 'PAST_DUE': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading subscription details...</span>
      </div>
    );
  }

  const paidPlans = plans.filter(p => !p.isFreeTrial);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-gray-600">Manage your plan and subscription through the App Store</p>
      </div>

      {/* Current Plan Overview */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Plan: {subscription.planName}
                </CardTitle>
                <CardDescription>
                  Billed {subscription.billing === 'MONTHLY' ? 'monthly' : 'yearly'} via App Store
                </CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{formatPrice(subscription.planPrice)}</p>
                  <p className="text-xs text-gray-600">per {subscription.billing === 'MONTHLY' ? 'month' : 'year'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{subscription.maxUsers} users</p>
                  <p className="text-xs text-gray-600">maximum</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">{subscription.storageGB}GB</p>
                  <p className="text-xs text-gray-600">storage</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">
                    {subscription.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'MMM dd') : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600">next billing</p>
                </div>
              </div>
            </div>

            {subscription.features && subscription.features.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Plan Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {subscription.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {subscription.status === 'TRIAL' && subscription.trialEndsAt && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Free Trial Active</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Your trial ends on {format(new Date(subscription.trialEndsAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            )}

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-900">Cancellation Scheduled</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  Your subscription will end on {subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMMM dd, yyyy') : 'N/A'}
                </p>
              </div>
            )}

            <Separator />

            <Button variant="outline" onClick={handleManageSubscription} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription in App Store
            </Button>
            <p className="text-xs text-center text-gray-400">
              To cancel or modify your subscription renewal, use the App Store subscription management.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Change Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Change Plan</CardTitle>
          <CardDescription>
            Upgrade or switch your plan. New subscriptions are processed through the App Store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Billing Period Toggle */}
          <div className="flex justify-center">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading plans...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paidPlans.map((plan) => {
                const productId = getProductId(plan.name, billingPeriod);
                const iapProduct = iapProducts[productId];
                const isCurrentPlan = subscription?.planId === plan.id;
                const isActive = activeIAPSubscriptions.includes(productId);
                const isPurchasingThis = isPurchasing === productId;

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg' : ''} ${isCurrentPlan ? 'bg-green-50 border-green-500' : ''}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-3">
                        <Badge className="bg-green-600 text-white">Current Plan</Badge>
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-lg">
                        {plan.name}
                        {plan.isPopular && <Star className="w-4 h-4 text-yellow-500" />}
                      </CardTitle>
                      <div className="text-2xl font-bold">
                        {iapProduct ? iapProduct.displayPrice : getDisplayPrice(plan)}
                        <span className="text-sm font-normal text-gray-600">
                          /{billingPeriod === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-1.5">
                          {plan.features.slice(0, 5).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                              <span className="text-xs">{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 5 && (
                            <p className="text-xs text-gray-500">+ {plan.features.length - 5} more</p>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Users: {(plan.maxUsers || 1) === 999 ? 'Unlimited' : plan.maxUsers || 1}</span>
                        <span>Storage: {plan.storageGB || 5}GB</span>
                      </div>

                      {isCurrentPlan || isActive ? (
                        <Button disabled className="w-full" size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePlanSelect(plan)}
                          disabled={!!isPurchasing}
                          className="w-full"
                          size="sm"
                          variant={plan.isPopular ? 'default' : 'outline'}
                        >
                          {isPurchasingThis ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-4 h-4 mr-2" />
                              Subscribe via App Store
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400">
              All subscriptions are processed securely through Apple. Payment will be charged to your Apple ID account.
            </p>
            <p className="text-xs text-gray-400">
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Confirmation Dialog */}
      <AlertDialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscribe to {pendingPlan?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPlan && (
                <div className="space-y-3">
                  <p>
                    You are about to subscribe to the <strong>{pendingPlan.name}</strong> plan at{' '}
                    {getDisplayPrice(pendingPlan)}/{billingPeriod === 'monthly' ? 'month' : 'year'}.
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>- Apple will process your payment securely</li>
                      <li>- Your plan will be activated immediately</li>
                      <li>- Subscription renews automatically</li>
                      <li>- Cancel anytime from your device Settings</li>
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPlan(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Subscribe with Apple
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
