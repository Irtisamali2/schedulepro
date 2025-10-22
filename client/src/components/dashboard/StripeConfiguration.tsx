import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Settings, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const stripeConfigSchema = z.object({
  stripePublicKey: z.string().min(1, "Public key is required").startsWith("pk_", "Public key must start with pk_"),
  stripeSecretKey: z.string().min(1, "Secret key is required").startsWith("sk_", "Secret key must start with sk_"),
});

type StripeConfigFormData = z.infer<typeof stripeConfigSchema>;

interface StripeConfigurationProps {
  clientId: string;
  hasPermission?: (permission: string) => boolean;
}

export default function StripeConfiguration({ clientId, hasPermission }: StripeConfigurationProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Permission helper - defaults to full access if no permission function provided
  const canPerform = (permission: string) => {
    return hasPermission ? hasPermission(permission) : true;
  };

  const { data: stripeConfig, isLoading } = useQuery({
    queryKey: [`/api/client/${clientId}/stripe-config`],
    enabled: !!clientId
  });

  const form = useForm<StripeConfigFormData>({
    resolver: zodResolver(stripeConfigSchema),
    defaultValues: {
      stripePublicKey: "",
      stripeSecretKey: ""
    }
  });

  // Set form values when config data loads
  useState(() => {
    if (stripeConfig) {
      form.setValue("stripePublicKey", stripeConfig.stripePublicKey || "");
      form.setValue("stripeSecretKey", stripeConfig.stripeSecretKey || "");
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: StripeConfigFormData) => 
      apiRequest(`/api/client/${clientId}/stripe-config`, "PUT", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/stripe-config`] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Stripe Configuration Updated",
        description: "Your Stripe settings have been saved successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Stripe configuration",
        variant: "destructive"
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/client/${clientId}/stripe-test`, "POST").then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: `Connected to Stripe account: ${data.accountName || 'Account verified'}`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Unable to connect to Stripe with provided credentials",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: StripeConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const handleTestConnection = () => {
    if (!stripeConfig?.stripePublicKey || !stripeConfig?.stripeSecretKey) {
      toast({
        title: "Configuration Required",
        description: "Please save your Stripe keys before testing the connection",
        variant: "destructive"
      });
      return;
    }
    setIsTestingConnection(true);
    testConnectionMutation.mutate();
    setTimeout(() => setIsTestingConnection(false), 2000);
  };

  const getStatusBadge = () => {
    if (!stripeConfig?.stripePublicKey || !stripeConfig?.stripeSecretKey) {
      return <Badge variant="secondary" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Not Configured</Badge>;
    }
    if (stripeConfig.isConnected) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Connected</Badge>;
    }
    return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Connection Error</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stripe Configuration</h2>
          <p className="text-muted-foreground">
            Configure your Stripe account to accept online payments from customers
          </p>
        </div>
        {canPerform('payments.manage') && (
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-configure-stripe">
                <Settings className="h-4 w-4 mr-2" />
                Configure Stripe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Stripe Configuration</DialogTitle>
                <DialogDescription>
                  Enter your Stripe API keys to enable online payments. You can find these in your Stripe dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stripePublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Public Key</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="pk_test_..." 
                            data-testid="input-stripe-public-key"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stripeSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Secret Key</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showSecretKey ? "text" : "password"}
                              placeholder="sk_test_..." 
                              data-testid="input-stripe-secret-key"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowSecretKey(!showSecretKey)}
                              data-testid="button-toggle-secret-visibility"
                            >
                              {showSecretKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Security Note:</strong> Your secret key is encrypted and stored securely. 
                      Use test keys for development and live keys only for production.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsConfigDialogOpen(false)}
                      data-testid="button-cancel-stripe-config"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateConfigMutation.isPending}
                      data-testid="button-save-stripe-config"
                    >
                      {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Account Status
            </CardTitle>
            <CardDescription>
              Current status of your Stripe integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Connection Status</span>
              {getStatusBadge()}
            </div>
            
            {stripeConfig?.stripePublicKey && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Public Key</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {stripeConfig.stripePublicKey.substring(0, 12)}...
                </span>
              </div>
            )}

            {stripeConfig?.stripeSecretKey && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Secret Key</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {stripeConfig.stripeSecretKey.substring(0, 8)}••••••••
                </span>
              </div>
            )}

            {stripeConfig?.stripePublicKey && stripeConfig?.stripeSecretKey && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || testConnectionMutation.isPending}
                  variant="outline"
                  className="w-full"
                  data-testid="button-test-stripe-connection"
                >
                  {isTestingConnection || testConnectionMutation.isPending ? "Testing Connection..." : "Test Connection"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              What is Stripe For?
            </CardTitle>
            <CardDescription>
              Stripe handles online payments, invoicing, and financial transactions for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Key Features:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Accept Payments:</strong> Process credit cards, debit cards, and digital wallets securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Automated Invoicing:</strong> Send professional invoices and track payment status</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Recurring Billing:</strong> Set up subscriptions and automatic payment collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Payment Links:</strong> Share payment links with customers via email or text</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Financial Reporting:</strong> Track revenue, payouts, and transaction history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Fraud Protection:</strong> Advanced security features to prevent fraudulent transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Global Support:</strong> Accept payments in 135+ currencies from customers worldwide</span>
                </li>
              </ul>
            </div>
            
            <Alert className="bg-white border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Once configured, Stripe will handle all payment processing for appointments, 
                services, and invoices. Standard Stripe fees apply (typically 2.9% + $0.30 per transaction).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {!stripeConfig?.stripePublicKey && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Stripe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To start accepting online payments, you'll need to:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com</a></li>
                  <li>Get your API keys from the Stripe dashboard</li>
                  <li>Enter your keys in the configuration above</li>
                  <li>Test the connection to verify everything works</li>
                </ol>
              </div>
              {canPerform('payments.manage') && (
                <Button 
                  onClick={() => setIsConfigDialogOpen(true)}
                  className="w-full"
                  data-testid="button-setup-stripe"
                >
                  Set Up Stripe Now
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}