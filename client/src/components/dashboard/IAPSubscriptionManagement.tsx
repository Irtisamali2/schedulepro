import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Calendar,
  CheckCircle,
  Loader2,
  Users,
  HardDrive,
  Zap,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  ArrowUp,
  ArrowDown,
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
  const [billingInitialized, setBillingInitialized] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<PlanFromAPI | null>(null);
  const [iapProducts, setIapProducts] = useState<Record<string, IAPProduct>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeIAPSubscriptions, setActiveIAPSubscriptions] = useState<string[]>([]);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionDetails>({
    queryKey: [`/api/client/${clientId}/subscription`],
    enabled: !!clientId,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<PlanFromAPI[]>({
    queryKey: ['/api/public/plans'],
  });

  // Sync billing toggle ONCE on first load to match the subscription's actual billing period.
  useEffect(() => {
    if (subscription && !billingInitialized) {
      setBillingPeriod(normalizeBilling(subscription.billing));
      setBillingInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription, billingInitialized]);

  useEffect(() => {
    const loadIAPProducts = async () => {
      try {
        const paidPlans = plans.filter(p => !p.isFreeTrial);
        if (paidPlans.length === 0) { setLoadingProducts(false); return; }

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

    if (plans.length > 0) loadIAPProducts();
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
      // Step 1: Native Apple IAP purchase — if this throws, show error toast
      const transactionId = await purchaseSubscription(productId);

      // Step 2: Get user info from localStorage
      const storedClient = (() => {
        try { return JSON.parse(localStorage.getItem('clientData') || '{}'); } catch { return {}; }
      })();
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('clientUser') || '{}'); } catch { return {}; }
      })();
      const customerEmail = storedClient?.email || storedUser?.email || '';
      const customerName = storedClient?.contactPerson || storedClient?.businessName || storedUser?.name || '';

      // Step 3: Notify server — wrapped so a server error never blocks the success flow.
      // updateClient runs first on the server so the plan IS activated even if createPayment
      // later fails and returns 500. We still refresh data and show success.
      try {
        await apiRequest('/api/iap/verify', 'POST', {
          transaction: transactionId,
          productId,
          planId: pendingPlan.id,
          billingPeriod,
          customerEmail,
          customerName,
        });
      } catch (verifyErr: any) {
        // Server verify failed, but Apple already charged the user and updateClient
        // may have succeeded. Log it and continue — invalidation below will sync the UI.
        console.error('IAP server verify error (plan may still be activated):', verifyErr?.message);
      }

      // Step 4: Optimistically update the cache so the UI reflects the new plan/billing
      // immediately — the invalidation below will overwrite with server-confirmed data.
      const newBilling = billingPeriod === 'yearly' ? 'YEARLY' : 'MONTHLY';
      queryClient.setQueryData(
        [`/api/client/${clientId}/subscription`],
        (old: SubscriptionDetails | undefined) => old ? {
          ...old,
          planId: pendingPlan.id,
          planName: pendingPlan.name,
          billing: newBilling,
          planPrice: billingPeriod === 'yearly'
            ? (pendingPlan.yearlyPrice ?? old.planPrice)
            : (pendingPlan.monthlyPrice ?? old.planPrice),
          status: 'ACTIVE' as const,
        } : old
      );
      await queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/subscription`] });
      try {
        const activeSubs = await getActiveSubscriptions();
        setActiveIAPSubscriptions(activeSubs);
      } catch (_) { /* non-critical */ }

      toast({ title: 'Subscription Activated', description: `You are now on the ${pendingPlan.name} plan!` });
    } catch (err: any) {
      // Only reaches here if the Apple IAP purchase itself failed (Step 1)
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('cancelled')) {
        return; // Silent dismissal
      }
      toast({ title: 'Purchase Failed', description: msg || 'Purchase failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsPurchasing(null);
      setPendingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await manageSubscriptions();
    } catch {
      toast({
        title: 'Unable to open',
        description: 'Could not open subscription management. Please go to Settings > Subscriptions on your device.',
        variant: 'destructive',
      });
    }
  };

  // Normalize any billing string ('MONTHLY','monthly','MONTH' → 'monthly'; everything else → 'yearly')
  const normalizeBilling = (billing: string): 'monthly' | 'yearly' =>
    billing?.toLowerCase().includes('month') ? 'monthly' : 'yearly';

  const subscriptionBilling = normalizeBilling(subscription?.billing ?? '');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const getPlanPrice = (plan: PlanFromAPI): number | null =>
    billingPeriod === 'monthly' ? (plan.monthlyPrice ?? null) : (plan.yearlyPrice ?? null);

  const getDisplayPrice = (plan: PlanFromAPI): string => {
    const price = getPlanPrice(plan);
    return price == null ? '$0' : formatPrice(price);
  };

  const isUpgrade = (plan: PlanFromAPI): boolean => {
    if (!subscription) return true;
    const targetPrice = getPlanPrice(plan) ?? 0;
    return targetPrice > subscriptionBasePrice;
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIAL: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PAST_DUE: 'bg-orange-100 text-orange-800',
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        <span className="text-gray-600">Loading subscription details...</span>
      </div>
    );
  }

  const paidPlans = plans.filter(p => !p.isFreeTrial);

  // Look up the full plan object for the active subscription
  const currentPlanDetails = paidPlans.find(p => p.id === subscription?.planId);

  // Price for the top card: always use the plan's price for the subscription's OWN billing period,
  // not subscription.planPrice which may not reflect monthly vs yearly correctly.
  const currentPlanDisplayPrice = (() => {
    if (!subscription || !currentPlanDetails) return null;
    const price = subscriptionBilling === 'monthly'
      ? currentPlanDetails.monthlyPrice
      : currentPlanDetails.yearlyPrice;
    return price ?? subscription.planPrice;
  })();

  const subscriptionBasePrice = (() => {
    if (!subscription || !currentPlanDetails) return subscription?.planPrice ?? 0;
    const price = subscriptionBilling === 'monthly'
      ? currentPlanDetails.monthlyPrice
      : currentPlanDetails.yearlyPrice;
    return price ?? subscription.planPrice;
  })();

  // Calculate yearly savings %
  const savingsPercent = (() => {
    const firstPaid = paidPlans[0];
    if (!firstPaid?.monthlyPrice || !firstPaid?.yearlyPrice) return null;
    const monthlyAnnual = firstPaid.monthlyPrice * 12;
    const saving = Math.round(((monthlyAnnual - firstPaid.yearlyPrice) / monthlyAnnual) * 100);
    return saving > 0 ? saving : null;
  })();

  return (
    <div className="space-y-6 pb-4">

      {/* ── Current Plan Card ── */}
      {subscription ? (
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-5 text-white">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-0.5">Current Plan</p>
                <h2 className="text-2xl font-bold">{subscription.planName}</h2>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[subscription.status] || 'bg-white/20 text-white'}`}>
                {subscription.status}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold">
                {currentPlanDisplayPrice != null ? formatPrice(currentPlanDisplayPrice) : formatPrice(subscription.planPrice)}
              </span>
              <span className="text-blue-200 text-sm">/ {subscriptionBilling === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-blue-100 text-xs mt-1">Billed {subscriptionBilling === 'monthly' ? 'monthly' : 'yearly'} via App Store</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 bg-white border-b border-gray-100">
            <div className="flex flex-col items-center py-3 gap-0.5">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">{subscription.maxUsers}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Users</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <HardDrive className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-800">{subscription.storageGB}GB</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Storage</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-800">
                {subscription.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'MMM d') : 'N/A'}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Next Bill</span>
            </div>
          </div>

          {/* Features */}
          {subscription.features && subscription.features.length > 0 && (
            <div className="bg-white px-5 py-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Included Features</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subscription.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trial / Cancellation banners */}
          {subscription.status === 'TRIAL' && subscription.trialEndsAt && (
            <div className="mx-4 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Free Trial Active</p>
                <p className="text-xs text-blue-700">Ends {format(new Date(subscription.trialEndsAt), 'MMMM d, yyyy')}</p>
              </div>
            </div>
          )}
          {subscription.cancelAtPeriodEnd && (
            <div className="mx-4 mb-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-900">Cancellation Scheduled</p>
                <p className="text-xs text-orange-700">
                  Access until {subscription.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Manage button */}
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
            <Button variant="outline" onClick={handleManageSubscription} className="w-full rounded-xl h-11">
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription in App Store
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Cancel or change renewal from App Store Settings
            </p>
          </div>
        </div>
      ) : (
        /* No subscription state */
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <Smartphone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">No Active Subscription</h3>
          <p className="text-sm text-gray-500">Choose a plan below to get started</p>
        </div>
      )}

      {/* ── Available Plans ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {subscription ? 'Switch Plan' : 'Choose a Plan'}
          </h3>

          {/* Billing toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
                billingPeriod === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Yearly
              {savingsPercent && (
                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                  -{savingsPercent}%
                </span>
              )}
            </button>
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" />
            <span className="text-gray-500 text-sm">Loading plans...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {paidPlans.map((plan) => {
              const productId = getProductId(plan.name, billingPeriod);
              // Current plan = same plan AND same billing period as subscription
              const isCurrentPlan =
                subscription?.planId === plan.id &&
                subscriptionBilling === billingPeriod;
              // Same plan but user is viewing the other billing period tab
              const isSamePlanOtherBilling =
                subscription?.planId === plan.id &&
                subscriptionBilling !== billingPeriod;
              const isPurchasingThis = isPurchasing === productId;
              const upgrade = isUpgrade(plan);
              const price = getPlanPrice(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-green-400 bg-green-50'
                      : isSamePlanOtherBilling
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  {/* Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}
                  {isSamePlanOtherBilling && !isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Your Plan
                      </span>
                    </div>
                  )}
                  {plan.isPopular && !isCurrentPlan && !isSamePlanOtherBilling && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{plan.name}</h4>
                        {plan.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xl font-bold text-gray-900">
                          {price != null ? formatPrice(price) : 'Free'}
                        </p>
                        <p className="text-xs text-gray-500">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</p>
                      </div>
                    </div>

                    {/* Key stats */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>{(plan.maxUsers || 1) === 999 ? 'Unlimited' : plan.maxUsers || 1} {(plan.maxUsers || 1) === 1 ? 'user' : 'users'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <HardDrive className="w-3.5 h-3.5 text-purple-500" />
                        <span>{plan.storageGB || 5}GB storage</span>
                      </div>
                    </div>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="grid grid-cols-1 gap-1.5 mb-4">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isCurrentPlan ? 'text-green-500' : 'text-green-400'}`} />
                            <span className="text-xs text-gray-600">{f}</span>
                          </div>
                        ))}
                        {plan.features.length > 4 && (
                          <p className="text-xs text-gray-400 pl-5">+{plan.features.length - 4} more features</p>
                        )}
                      </div>
                    )}

                    <Separator className="mb-4" />

                    {/* Action button */}
                    {isCurrentPlan ? (
                      <Button disabled variant="outline" className="w-full rounded-xl h-10 border-green-300 text-green-700 bg-green-50">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : isSamePlanOtherBilling ? (
                      <Button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={!!isPurchasing}
                        variant="outline"
                        className="w-full rounded-xl h-10"
                      >
                        {isPurchasingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Switch to {billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePlanSelect(plan)}
                        disabled={!!isPurchasing}
                        variant={upgrade ? 'default' : 'outline'}
                        className={`w-full rounded-xl h-10 ${upgrade ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                      >
                        {isPurchasingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : subscription ? (
                          <>
                            {upgrade
                              ? <ArrowUp className="w-4 h-4 mr-2" />
                              : <ArrowDown className="w-4 h-4 mr-2" />}
                            {upgrade ? 'Upgrade' : 'Downgrade'} to {plan.name}
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 mr-2" />
                            Subscribe via App Store
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
          Subscriptions are processed securely through Apple and auto-renew unless cancelled at least 24 hours before the end of the current period.
        </p>
      </div>

      {/* ── Confirmation Dialog ── */}
      <AlertDialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingPlan && isUpgrade(pendingPlan) ? 'Upgrade' : 'Change'} to {pendingPlan?.name}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {pendingPlan && (
                  <>
                    <p>
                      You're switching to <strong>{pendingPlan.name}</strong> at{' '}
                      <strong>{getDisplayPrice(pendingPlan)}/{billingPeriod === 'monthly' ? 'month' : 'year'}</strong>.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                      <p className="font-medium text-blue-900 text-xs">What happens next:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Apple will process your payment securely</li>
                        <li>• Your plan activates immediately</li>
                        <li>• Subscription renews automatically</li>
                        <li>• Cancel anytime from device Settings</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPlan(null)} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchase} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Smartphone className="w-4 h-4 mr-2" />
              Confirm with Apple
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
