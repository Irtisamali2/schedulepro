import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign } from "lucide-react";

// Load Stripe outside of component to avoid recreation
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface InvoiceData {
  id: number;
  appointmentId: number;
  clientName: string;
  amount: number;
  serviceName: string;
  dueDate: string;
  businessName: string;
}

export default function PayInvoice() {
  const [, setLocation] = useLocation();
  const { invoiceId, paymentId } = useParams();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const { toast } = useToast();

  useEffect(() => {
    // Record view when invoice is opened
    const recordView = async () => {
      try {
        await apiRequest("POST", `/api/invoice-views/${invoiceId}/${paymentId}`, {
          viewedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error recording invoice view:", error);
      }
    };

    // Fetch invoice data
    const fetchInvoice = async () => {
      try {
        const response = await apiRequest("GET", `/api/invoices/${invoiceId}/${paymentId}`);
        const data = await response.json();
        setInvoice(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: "Could not load invoice details. Please try again later.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    recordView();
    fetchInvoice();
  }, [invoiceId, paymentId, toast]);

  const handleCardPayment = async () => {
    if (!invoice) return;
    
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: invoice.amount,
        invoiceId,
        paymentId
      });
      
      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      toast({
        title: "Processing Payment",
        description: "Please complete the payment form.",
      });
    } catch (error) {
      console.error("Error setting up payment:", error);
      toast({
        title: "Error",
        description: "Could not set up payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAlternativePayment = (method: string) => {
    toast({
      title: `Pay with ${method}`,
      description: `Please send payment to the business using ${method}. The business owner will be notified.`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Invoice Not Found</h1>
        <p className="mt-4">The invoice you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => setLocation("/")} className="mt-6">
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Invoice from {invoice.businessName}</CardTitle>
          <CardDescription>
            Invoice #{invoiceId} for {invoice.clientName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Service Details</h3>
              <div className="mt-2 p-4 border rounded">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{invoice.serviceName}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Amount Due:</span>
                  <span className="font-medium text-xl">${invoice.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Due Date:</span>
                  <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
              
              <Tabs defaultValue="card" onValueChange={setPaymentMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="card">Credit Card</TabsTrigger>
                  <TabsTrigger value="alternative">Alternative Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="mt-4">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <div className="p-4 border rounded">
                        {/* Payment elements will be implemented */}
                        <div className="bg-neutral-100 p-4 text-center rounded">
                          Stripe Payment Form
                          <p className="text-sm text-gray-500 mt-2">
                            This would contain the actual Stripe payment elements
                          </p>
                        </div>
                      </div>
                    </Elements>
                  ) : (
                    <Button 
                      onClick={handleCardPayment} 
                      className="w-full"
                      size="lg"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay with Credit Card
                    </Button>
                  )}
                </TabsContent>
                
                <TabsContent value="alternative" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline" 
                      className="p-6 h-auto flex flex-col items-center text-center"
                      onClick={() => handleAlternativePayment("Venmo")}
                    >
                      <div className="text-[#3D95CE] text-2xl font-bold mb-2">V</div>
                      <span className="font-medium">Pay with Venmo</span>
                      <span className="text-xs mt-1">@business-venmo</span>
                    </Button>
                    
                    <Button
                      variant="outline" 
                      className="p-6 h-auto flex flex-col items-center text-center"
                      onClick={() => handleAlternativePayment("Zelle")}
                    >
                      <div className="text-[#6D1ED4] text-2xl font-bold mb-2">Z</div>
                      <span className="font-medium">Pay with Zelle</span>
                      <span className="text-xs mt-1">payments@business.com</span>
                    </Button>
                    
                    <Button
                      variant="outline" 
                      className="p-6 h-auto flex flex-col items-center text-center"
                      onClick={() => handleAlternativePayment("PayPal")}
                    >
                      <div className="text-[#003087] text-2xl font-bold mb-2">P</div>
                      <span className="font-medium">Pay with PayPal</span>
                      <span className="text-xs mt-1">payments@business.com</span>
                    </Button>
                    
                    <Button
                      variant="outline" 
                      className="p-6 h-auto flex flex-col items-center text-center"
                      onClick={() => handleAlternativePayment("Cash")}
                    >
                      <DollarSign className="h-8 w-8 mb-2" />
                      <span className="font-medium">Pay with Cash</span>
                      <span className="text-xs mt-1">At your next appointment</span>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500">
          <p>
            Questions about this invoice? Contact {invoice.businessName} directly.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}