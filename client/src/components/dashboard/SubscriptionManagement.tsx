import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Loader2,
  Shield,
  Star,
  Users,
  HardDrive,
  Zap,
  MoreVertical,
  Trash2,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import SecurePaymentMethodSetup from '../payment/SecurePaymentMethodSetup';

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
  stripeSubscriptionId?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  description: string;
  invoiceUrl?: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  billing: 'MONTHLY' | 'YEARLY';
  description: string;
  features: string[];
  maxUsers: number;
  storageGB: number;
  isPopular?: boolean;
  stripePriceId?: string;
}

interface SubscriptionManagementProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Plans are fetched from super admin configuration

export default function SubscriptionManagement({ clientId, isOpen, onClose }: SubscriptionManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpdatePaymentDialog, setShowUpdatePaymentDialog] = useState(false);
  const [showPlanUpgradeConfirm, setShowPlanUpgradeConfirm] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<string | null>(null);
  const [processingPaymentMethodId, setProcessingPaymentMethodId] = useState<string | null>(null);

  // Fetch subscription details
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionDetails>({
    queryKey: [`/api/client/${clientId}/subscription`],
    enabled: !!clientId && isOpen
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery<PaymentMethod[]>({
    queryKey: [`/api/client/${clientId}/payment-methods`],
    enabled: !!clientId && isOpen
  });

  // Fetch billing history
  const { data: billingHistory = [], isLoading: billingHistoryLoading } = useQuery<BillingHistory[]>({
    queryKey: [`/api/client/${clientId}/billing-history`],
    enabled: !!clientId && isOpen
  });

  // Fetch available plans from super admin configuration
  const { data: availablePlans = [], isLoading: plansLoading } = useQuery<PlanOption[]>({
    queryKey: ['/api/public/plans'],
    enabled: isOpen,
    select: (data) => data.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      price: plan.monthlyPrice || 0,
      billing: 'MONTHLY' as const,
      description: plan.description || '',
      features: plan.features || [],
      maxUsers: plan.maxUsers || 1,
      storageGB: plan.storageGB || 5,
      isPopular: plan.isPopular || false,
      stripePriceId: plan.monthlyStripePriceId
    }))
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const response = await apiRequest(`/api/client/${clientId}/subscription/update-plan`, 'POST', { planId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/subscription`] });
      setIsChangingPlan(false);
      setSelectedPlan(null);
      toast({ 
        title: 'Plan Updated Successfully', 
        description: 'Your subscription plan has been updated.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Plan Update Failed', 
        description: error.message || 'Failed to update subscription plan.',
        variant: 'destructive' 
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/client/${clientId}/subscription/cancel`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/subscription`] });
      setShowCancelDialog(false);
      toast({ 
        title: 'Subscription Cancelled', 
        description: 'Your subscription will be cancelled at the end of the current billing period.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Cancellation Failed', 
        description: error.message || 'Failed to cancel subscription.',
        variant: 'destructive' 
      });
    }
  });

  // Set payment method as default mutation
  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId: string }) => {
      const response = await apiRequest(`/api/client/${clientId}/payment-methods/${paymentMethodId}/set-default`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/payment-methods`] });
      setProcessingPaymentMethodId(null);
      toast({ 
        title: 'Default Payment Method Updated', 
        description: 'Your default payment method has been updated successfully.' 
      });
    },
    onError: (error: any) => {
      setProcessingPaymentMethodId(null);
      toast({ 
        title: 'Update Failed', 
        description: error.message || 'Failed to update default payment method.',
        variant: 'destructive' 
      });
    }
  });

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async ({ paymentMethodId }: { paymentMethodId: string }) => {
      const response = await apiRequest(`/api/client/${clientId}/payment-methods/${paymentMethodId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/payment-methods`] });
      setProcessingPaymentMethodId(null);
      toast({ 
        title: 'Payment Method Removed', 
        description: 'Your payment method has been removed successfully.' 
      });
    },
    onError: (error: any) => {
      setProcessingPaymentMethodId(null);
      toast({ 
        title: 'Removal Failed', 
        description: error.message || 'Failed to remove payment method.',
        variant: 'destructive' 
      });
    }
  });

  const handleSetDefaultPaymentMethod = (paymentMethodId: string) => {
    setProcessingPaymentMethodId(paymentMethodId);
    setDefaultPaymentMethodMutation.mutate({ paymentMethodId });
  };

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    setProcessingPaymentMethodId(paymentMethodId);
    deletePaymentMethodMutation.mutate({ paymentMethodId });
  };

  const handlePaymentMethodSuccess = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/payment-methods`] });
    setShowUpdatePaymentDialog(false);
    toast({
      title: 'Payment Method Added',
      description: 'Your payment method has been securely saved.',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'TRIAL': return 'secondary';
      case 'CANCELLED': return 'destructive';
      case 'PAST_DUE': return 'destructive';
      default: return 'outline';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handlePlanChange = (planId: string) => {
    // Show confirmation dialog before upgrading
    setPendingPlanChange(planId);
    setShowPlanUpgradeConfirm(true);
  };

  const confirmPlanChange = () => {
    if (pendingPlanChange) {
      setSelectedPlan(pendingPlanChange);
      changePlanMutation.mutate({ planId: pendingPlanChange });
      setShowPlanUpgradeConfirm(false);
      setPendingPlanChange(null);
    }
  };

  const currentPlan = availablePlans.find(plan => plan.id === subscription?.planId);

  if (subscriptionLoading || plansLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[600px] flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading subscription details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const pendingPlan = availablePlans.find(plan => plan.id === pendingPlanChange);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Subscription Management</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plans">Change Plan</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
          </TabsList>

          <div className="max-h-[500px] overflow-y-auto">
            <TabsContent value="overview" className="space-y-6">
              {/* Current Subscription Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Current Plan: {subscription?.planName}
                        {currentPlan?.isPopular && <Star className="w-4 h-4 text-yellow-500" />}
                      </CardTitle>
                      <CardDescription>
                        {currentPlan?.description}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(subscription?.status || 'ACTIVE')}>
                      {subscription?.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">{formatPrice(subscription?.planPrice || 0)}</p>
                        <p className="text-xs text-gray-600">per month</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{subscription?.maxUsers} users</p>
                        <p className="text-xs text-gray-600">maximum</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium">{subscription?.storageGB}GB</p>
                        <p className="text-xs text-gray-600">storage</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium">
                          {subscription?.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'MMM dd') : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600">next billing</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subscription?.features?.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {subscription?.status === 'TRIAL' && subscription?.trialEndsAt && (
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

                  {subscription?.cancelAtPeriodEnd && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Cancellation Scheduled</span>
                      </div>
                      <p className="text-sm text-orange-700 mt-1">
                        Your subscription will end on {subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('plans')}
                      data-testid="button-change-plan"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Change Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('payment')}
                      data-testid="button-update-payment"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Update Payment Method
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('history')}
                      data-testid="button-view-history"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Billing History
                    </Button>
                    {!subscription?.cancelAtPeriodEnd && (
                      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" data-testid="button-cancel-subscription">
                            <X className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your subscription? You'll continue to have access until {subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMMM dd, yyyy') : 'the end of your billing period'}, but your account will not renew.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => cancelSubscriptionMutation.mutate()}
                              disabled={cancelSubscriptionMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                              data-testid="button-confirm-cancel"
                            >
                              {cancelSubscriptionMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                'Yes, Cancel Subscription'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Available Plans</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the plan that best fits your business needs. Changes take effect immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg' : ''} ${subscription?.planId === plan.id ? 'bg-green-50 border-green-500' : ''}`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                      </div>
                    )}
                    {subscription?.planId === plan.id && (
                      <div className="absolute -top-3 right-3">
                        <Badge className="bg-green-600 text-white">Current Plan</Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        {plan.isPopular && <Star className="w-4 h-4 text-yellow-500" />}
                      </CardTitle>
                      <div className="text-2xl font-bold">
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-gray-600">/month</span>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 6 && (
                          <p className="text-xs text-gray-600">+ {plan.features.length - 6} more features</p>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Users: {plan.maxUsers === 999 ? 'Unlimited' : plan.maxUsers}</span>
                        <span>Storage: {plan.storageGB}GB</span>
                      </div>
                      
                      {subscription?.planId === plan.id ? (
                        <Button disabled className="w-full" data-testid={`button-current-plan-${plan.id}`}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={changePlanMutation.isPending}
                          className="w-full"
                          variant={plan.isPopular ? 'default' : 'outline'}
                          data-testid={`button-select-plan-${plan.id}`}
                        >
                          {changePlanMutation.isPending && selectedPlan === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            `Switch to ${plan.name}`
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Payment Methods</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Manage your payment methods and billing information.
                </p>
              </div>

              {paymentMethodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading payment methods...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <Card key={method.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-8 h-8 text-gray-600" />
                            <div>
                              <p className="font-medium">
                                {method.brand.toUpperCase()} ****{method.last4}
                              </p>
                              <p className="text-sm text-gray-600">
                                Expires {method.expiryMonth}/{method.expiryYear}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {method.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={processingPaymentMethodId === method.id}
                                  data-testid={`button-payment-actions-${method.id}`}
                                >
                                  {processingPaymentMethodId === method.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!method.isDefault && (
                                  <DropdownMenuItem
                                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                    disabled={processingPaymentMethodId === method.id}
                                    data-testid={`action-set-default-${method.id}`}
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Set as Default
                                  </DropdownMenuItem>
                                )}
                                {paymentMethods.length > 1 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeletePaymentMethod(method.id)}
                                      disabled={processingPaymentMethodId === method.id}
                                      className="text-red-600 focus:text-red-600"
                                      data-testid={`action-delete-${method.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Remove Payment Method
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    onClick={() => setShowUpdatePaymentDialog(true)}
                    variant="outline" 
                    className="w-full"
                    data-testid="button-add-payment-method"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Add New Payment Method
                  </Button>
                </div>
              )}

              {/* PCI-COMPLIANT: Secure Payment Method Setup Dialog */}
              <Dialog open={showUpdatePaymentDialog} onOpenChange={setShowUpdatePaymentDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                  </DialogHeader>
                  <SecurePaymentMethodSetup
                    clientId={clientId}
                    onSuccess={handlePaymentMethodSuccess}
                    onCancel={() => setShowUpdatePaymentDialog(false)}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Billing History</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and download your past invoices and payments.
                </p>
              </div>

              {billingHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading billing history...</span>
                </div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No billing history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        billingHistory.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell>
                              {format(new Date(bill.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{bill.description}</TableCell>
                            <TableCell>{formatPrice(bill.amount)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  bill.status === 'PAID' ? 'default' : 
                                  bill.status === 'PENDING' ? 'secondary' : 
                                  'destructive'
                                }
                              >
                                {bill.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {bill.invoiceUrl && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(bill.invoiceUrl, '_blank')}
                                  data-testid={`button-download-invoice-${bill.id}`}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Plan Upgrade Confirmation Dialog */}
        <AlertDialog open={showPlanUpgradeConfirm} onOpenChange={setShowPlanUpgradeConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Plan Upgrade</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingPlan && (
                  <div className="space-y-3">
                    <p>
                      You are about to upgrade to the <strong>{pendingPlan.name}</strong> plan at {formatPrice(pendingPlan.price)}/month.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your plan will be upgraded immediately</li>
                        <li>• You'll be charged a prorated amount for the upgrade</li>
                        <li>• Payment will be processed using the super admin's secure Stripe account</li>
                        <li>• Your next billing date will remain the same</li>
                      </ul>
                    </div>
                    <p className="text-sm text-gray-600">
                      The payment will be securely processed through our platform's payment system.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setShowPlanUpgradeConfirm(false);
                  setPendingPlanChange(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmPlanChange}
                disabled={changePlanMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-confirm-upgrade"
              >
                {changePlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm Upgrade to ${pendingPlan?.name}`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}