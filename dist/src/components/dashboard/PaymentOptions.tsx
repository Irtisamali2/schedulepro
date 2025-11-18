import { useState } from "react";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, DollarSign, CreditCard, AlertCircle, CheckCircle } from "lucide-react";

interface PaymentOptionsProps {
  appointmentId: number;
  clientName: string;
  amount: number;
}

export default function PaymentOptions({ appointmentId, clientName, amount }: PaymentOptionsProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [receiptSent, setReceiptSent] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [manualReference, setManualReference] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string>("");
  const [invoiceViews, setInvoiceViews] = useState<{timestamp: string, count: number}[]>([]);
  const [clientEmail, setClientEmail] = useState<string>("");
  const { toast } = useToast();
  
  // Digital payment details - in production this would come from the professional's profile
  const digitalPayments = {
    venmo: "@your-business-venmo",
    zelle: "payments@yourbusiness.com",
    paypal: "payments@yourbusiness.com"
  };

  const handleCardPayment = () => {
    // Redirect to our Stripe checkout page
    const enableTips = ['beauty', 'wellness'].includes(localStorage.getItem('industryId') || '');
    const checkoutUrl = `/checkout?amount=${amount}&appointmentId=${appointmentId}&clientName=${encodeURIComponent(clientName)}&enableTips=${enableTips}`;
    window.location.href = checkoutUrl;
  };

  const handleCashPayment = () => {
    toast({
      title: "Cash Payment Recorded",
      description: `$${amount.toFixed(2)} cash payment from ${clientName} recorded.`,
    });
    setPaymentStatus("completed");
  };

  const handleManualPayment = () => {
    if (!manualReference && paymentMethod !== "cash") {
      toast({
        title: "Reference Required",
        description: "Please add a reference number or description for this payment.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Payment Recorded",
      description: `${paymentMethod.toUpperCase()} payment of $${amount.toFixed(2)} recorded.`,
    });
    setPaymentStatus("completed");
  };

  const handleSendReceipt = () => {
    toast({
      title: "Receipt Sent",
      description: `Receipt has been sent to ${clientName}.`,
    });
    setReceiptSent(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Process Payment</span>
          <Badge variant={
            paymentStatus === "completed" ? "success" : 
            paymentStatus === "failed" ? "destructive" : 
            "outline"
          }>
            {paymentStatus === "completed" ? "Paid" : 
             paymentStatus === "failed" ? "Failed" : 
             "Pending"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Payment for {clientName}'s appointment (#{appointmentId})
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-semibold mb-6">${amount.toFixed(2)}</div>
        
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="alternative">Alternative</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            <div className="grid gap-4 py-4">
              <Button 
                onClick={handleCardPayment}
                disabled={paymentStatus === "completed"}
                className="w-full"
              >
                Process Credit Card
              </Button>
              
              <Button 
                onClick={handleCashPayment}
                disabled={paymentStatus === "completed"}
                variant="outline" 
                className="w-full"
              >
                Record Cash Payment
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="alternative">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-3">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <TooltipProvider>
                      {["venmo", "zelle", "paypal", "cash"].map((method) => (
                        <Tooltip key={method}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant={paymentMethod === method ? "default" : "outline"}
                              onClick={() => setPaymentMethod(method)}
                              disabled={paymentStatus === "completed"}
                              className="flex flex-col items-center gap-1 h-auto py-3"
                            >
                              {method === "venmo" && <div className="text-[#3D95CE] text-lg">V</div>}
                              {method === "zelle" && <div className="text-[#6D1ED4] text-lg">Z</div>}
                              {method === "paypal" && <div className="text-[#003087] text-lg">P</div>}
                              {method === "cash" && <DollarSign className="h-5 w-5" />}
                              <span className="text-xs capitalize">{method}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {method === "venmo" || method === "zelle" || method === "paypal" ? 
                              `Accept ${method} payments to avoid credit card fees` : 
                              "Record cash payments"}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </div>
                
                {paymentMethod !== "cash" && (
                  <>
                    <div className="space-y-2 col-span-3 p-4 border rounded-md bg-neutral">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">
                          Your {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Details:
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(digitalPayments[paymentMethod as keyof typeof digitalPayments]);
                            setCopySuccess(paymentMethod);
                            setTimeout(() => setCopySuccess(null), 2000);
                          }}
                        >
                          {copySuccess === paymentMethod ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span className="text-xs">{copySuccess === paymentMethod ? "Copied!" : "Copy"}</span>
                        </Button>
                      </div>
                      <div className="font-mono mt-1 text-sm p-2 bg-background border rounded">
                        {digitalPayments[paymentMethod as keyof typeof digitalPayments]}
                      </div>
                      
                      <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />
                        <span>
                          Share these details with your client to receive payment directly. You'll save on processing fees!
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 col-span-3 mt-2">
                      <Label htmlFor="reference">Reference/Transaction ID</Label>
                      <Input 
                        id="reference" 
                        value={manualReference}
                        onChange={(e) => setManualReference(e.target.value)}
                        placeholder="Enter confirmation code/ID from the payment"
                        disabled={paymentStatus === "completed"}
                      />
                    </div>
                  </>
                )}
              </div>
              
              <Separator className="my-2" />
              
              <Button 
                onClick={handleManualPayment}
                disabled={paymentStatus === "completed"}
                className="w-full mt-4"
              >
                Record {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="invoice">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client-email">Client Email</Label>
                <Input 
                  id="client-email" 
                  placeholder="Enter client's email address"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={invoiceSent || paymentStatus === "completed"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input 
                  id="due-date" 
                  type="date"
                  defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 
                  disabled={invoiceSent || paymentStatus === "completed"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoice-note">Note (Optional)</Label>
                <Input 
                  id="invoice-note" 
                  placeholder="Additional information for the invoice"
                  disabled={invoiceSent || paymentStatus === "completed"}
                />
              </div>
              
              {invoiceViews.length > 0 && (
                <div className="mt-4 p-4 border rounded-md bg-green-50">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Invoice Views
                  </h3>
                  <div className="text-sm">
                    <p>Client has viewed this invoice {invoiceViews.length} times.</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {invoiceViews.map((view, index) => (
                        <li key={index} className="flex justify-between">
                          <span>Viewed on:</span>
                          <span>
                            {new Date(view.timestamp).toLocaleDateString()} at{' '}
                            {new Date(view.timestamp).toLocaleTimeString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {paymentLink && (
                <div className="p-4 border rounded-md bg-neutral mt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Payment Link:
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentLink);
                        setCopySuccess("link");
                        setTimeout(() => setCopySuccess(null), 2000);
                      }}
                    >
                      {copySuccess === "link" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="text-xs">{copySuccess === "link" ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                  <div className="font-mono mt-1 text-sm p-2 bg-background border rounded break-all">
                    {paymentLink}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => {
                  if (!clientEmail) {
                    toast({
                      title: "Client Email Required",
                      description: "Please enter the client's email address to create an invoice.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Generate a unique payment link
                  const uniqueId = Math.random().toString(36).substring(2, 10);
                  const link = `${window.location.origin}/pay/${appointmentId}/${uniqueId}`;
                  setPaymentLink(link);
                  
                  toast({
                    title: "Invoice Created",
                    description: `Invoice for ${clientName} has been created with a payment link.`,
                  });
                  setInvoiceSent(true);
                  
                  // Simulate view tracking with a demo view
                  setTimeout(() => {
                    setInvoiceViews(prev => [
                      ...prev, 
                      { 
                        timestamp: new Date().toISOString(),
                        count: 1
                      }
                    ]);
                    
                    toast({
                      title: "Invoice Viewed!",
                      description: `${clientName} just viewed the invoice.`,
                    });
                  }, 5000);
                }}
                disabled={invoiceSent || paymentStatus === "completed"}
                className="w-full mt-4"
              >
                {invoiceSent ? "Invoice Created" : "Create Invoice & Payment Link"}
              </Button>
              
              {invoiceSent && (
                <Button 
                  onClick={() => {
                    toast({
                      title: "Invoice Sent",
                      description: `Invoice has been emailed to ${clientName}.`,
                    });
                  }}
                  variant="outline"
                  className="w-full mt-2"
                >
                  Email Invoice to Client
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => window.print()}
          disabled={paymentStatus !== "completed"}
        >
          Print Receipt
        </Button>
        
        <Button
          onClick={handleSendReceipt}
          disabled={paymentStatus !== "completed" || receiptSent}
        >
          {receiptSent ? "Receipt Sent" : "Email Receipt"}
        </Button>
      </CardFooter>
    </Card>
  );
}