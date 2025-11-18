import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe, type Appearance } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Initialize Stripe outside component render
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

function CheckoutForm({ clientName, appointmentId, amount, onTipChange }: { 
  clientName: string, 
  appointmentId: number,
  amount: number,
  onTipChange: (totalWithTip: number) => void
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tipPercentage, setTipPercentage] = useState<string>("0");
  const [customTip, setCustomTip] = useState<string>("");
  const [tipAmount, setTipAmount] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Stripe has not been properly initialized",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
      } else {
        // Payment succeeded, but we won't get here because of the redirect
        toast({
          title: "Payment Successful",
          description: "Thank you for your payment!",
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </Button>
      
      <Button 
        type="button" 
        variant="outline"
        onClick={() => navigate('/dashboard')}
        className="w-full mt-2"
      >
        Cancel
      </Button>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [totalWithTip, setTotalWithTip] = useState<number>(0);
  const [clientName, setClientName] = useState<string>("");
  const [appointmentId, setAppointmentId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipsEnabled, setTipsEnabled] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Get parameters from URL
    const amountParam = searchParams.get('amount');
    const clientNameParam = searchParams.get('clientName');
    const appointmentIdParam = searchParams.get('appointmentId');
    const tipsParam = searchParams.get('enableTips');
    
    if (!amountParam || !clientNameParam || !appointmentIdParam) {
      setError("Missing required payment information");
      setLoading(false);
      return;
    }
    
    const parsedAmount = parseFloat(amountParam);
    const parsedAppointmentId = parseInt(appointmentIdParam, 10);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedAppointmentId)) {
      setError("Invalid payment information");
      setLoading(false);
      return;
    }
    
    setAmount(parsedAmount);
    setTotalWithTip(parsedAmount); // Initialize total with base amount
    setClientName(clientNameParam);
    setAppointmentId(parsedAppointmentId);
    setTipsEnabled(tipsParam === 'true');
    
    // Create PaymentIntent on the server
    const createPayment = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: parsedAmount,
          appointmentId: parsedAppointmentId,
          clientName: clientNameParam
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Couldn't create payment. Please try again.");
        }
      } catch (err) {
        setError("Server error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    // Only attempt to create payment if Stripe is available
    if (stripePromise) {
      createPayment();
    } else {
      setError("Stripe is not configured. Please set up your API keys.");
      setLoading(false);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>We encountered a problem with your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading || !clientSecret) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p>Preparing payment...</p>
        </div>
      </div>
    );
  }

  // Return early if Stripe is not initialized
  if (!stripePromise) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Not Configured</CardTitle>
            <CardDescription>Payment processing is not available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Stripe API keys haven't been configured. Please contact the administrator.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Payment for {clientName}'s appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-between items-center py-3 px-4 bg-muted rounded-lg">
              <span>Service Amount:</span>
              <span className="font-semibold">${amount.toFixed(2)}</span>
            </div>
            
            {tipsEnabled && (
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Would you like to add a tip?</h3>
                
                <RadioGroup 
                  value={tipPercentage}
                  onValueChange={(value) => {
                    setTipPercentage(value);
                    
                    if (value === "custom") {
                      const customTipAmount = customTip ? parseFloat(customTip) : 0;
                      setTipAmount(customTipAmount);
                      onTipChange(amount + customTipAmount);
                    } else {
                      const percentage = parseInt(value) / 100;
                      const calculatedTip = amount * percentage;
                      setTipAmount(calculatedTip);
                      onTipChange(amount + calculatedTip);
                    }
                  }}
                  className="flex flex-col space-y-1"
                >
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="tip-0" />
                      <Label htmlFor="tip-0">No Tip</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="15" id="tip-15" />
                      <Label htmlFor="tip-15">15%</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="18" id="tip-18" />
                      <Label htmlFor="tip-18">18%</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="20" id="tip-20" />
                      <Label htmlFor="tip-20">20%</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="custom" id="tip-custom" />
                    <Label htmlFor="tip-custom">Custom:</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                      className="w-24 h-8"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(e.target.value);
                        if (tipPercentage === "custom") {
                          const customTipAmount = e.target.value ? parseFloat(e.target.value) : 0;
                          setTipAmount(customTipAmount);
                          onTipChange(amount + customTipAmount);
                        }
                      }}
                      onClick={() => setTipPercentage("custom")}
                    />
                  </div>
                </RadioGroup>
                
                {tipAmount > 0 && (
                  <div className="mt-4 text-sm text-right">
                    <div className="flex justify-between">
                      <span>Tip amount:</span>
                      <span>${tipAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center py-3 px-4 bg-primary/5 rounded-lg font-medium">
              <span>Total Amount:</span>
              <span className="text-lg font-bold">${totalWithTip.toFixed(2)}</span>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <Elements stripe={stripePromise} options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#0f172a',
                colorBackground: '#ffffff',
                colorText: '#1e293b'
              }
            } as Appearance
          }}>
            <CheckoutForm 
              clientName={clientName} 
              appointmentId={appointmentId}
              amount={amount}
              onTipChange={setTotalWithTip}
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}