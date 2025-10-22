import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Send, 
  Copy, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Users,
  Receipt,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SimplePaymentRequest from './SimplePaymentRequest';

interface PaymentRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  createdAt: Date;
  dueDate: Date;
}

export default function PaymentManagement() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([
    {
      id: '1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@example.com',
      amount: 2500.00,
      description: 'Kitchen Renovation - Final Payment',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      clientName: 'Mike Wilson',
      clientEmail: 'mike@example.com',
      amount: 1200.00,
      description: 'Bathroom Remodel - Deposit',
      status: 'paid',
      paymentMethod: 'Stripe (Visa)',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      clientName: 'Lisa Chen',
      clientEmail: 'lisa@example.com',
      amount: 850.00,
      description: 'Deck Construction - Progress Payment',
      status: 'paid',
      paymentMethod: 'Zelle',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    }
  ]);

  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const sendPaymentLink = (request: PaymentRequest) => {
    const paymentUrl = `/pay-invoice?amount=${request.amount}&description=${encodeURIComponent(request.description)}&client=${encodeURIComponent(request.clientName)}&email=${encodeURIComponent(request.clientEmail)}`;
    
    navigator.clipboard.writeText(`${window.location.origin}${paymentUrl}`);
    
    toast({
      title: "Payment Link Copied",
      description: "Multi-payment link copied to clipboard - supports all payment methods"
    });
  };

  const totalPending = paymentRequests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPaid = paymentRequests
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Simple Payment Request Form */}
      <SimplePaymentRequest />

      {/* Payment Configuration Help */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How to Configure Payment Methods
          </CardTitle>
          <CardDescription>
            Set up Stripe, PayPal, Zelle, and Venmo to accept payments from your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What Payment Management Does:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Multi-Payment Support:</strong> Accept payments via Stripe (cards), PayPal, Zelle, and Venmo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Payment Requests:</strong> Send professional payment links to clients via email or SMS</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Automatic Invoicing:</strong> Generate and send invoices with payment options automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Payment Tracking:</strong> Monitor all transactions, pending payments, and payment history</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Step-by-Step Payment Setup:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm pl-2">
              <li className="pl-2">
                <strong>Configure Stripe (Credit Cards)</strong>
                <ul className="ml-6 mt-1 space-y-1 text-gray-600">
                  <li>• Navigate to the "Payments" or "Stripe Configuration" section in Settings</li>
                  <li>• Click "Configure Payments" and enter your Stripe API keys</li>
                  <li>• Get API keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" className="text-blue-600 underline">Stripe Dashboard</a></li>
                  <li>• Fee: 2.9% + $0.30 per transaction</li>
                </ul>
              </li>
              <li className="pl-2">
                <strong>Set Up PayPal</strong>
                <ul className="ml-6 mt-1 space-y-1 text-gray-600">
                  <li>• Configure PayPal Business account credentials in payment settings</li>
                  <li>• Enable PayPal as a payment option for clients</li>
                  <li>• Fee: 2.9% + $0.30 per transaction</li>
                </ul>
              </li>
              <li className="pl-2">
                <strong>Add Zelle & Venmo (Free Options)</strong>
                <ul className="ml-6 mt-1 space-y-1 text-gray-600">
                  <li>• Add your Zelle email/phone number in payment settings</li>
                  <li>• Add your Venmo username in payment settings</li>
                  <li>• No processing fees - clients send money directly to you</li>
                </ul>
              </li>
              <li className="pl-2">
                <strong>Send Payment Requests</strong>
                <ul className="ml-6 mt-1 space-y-1 text-gray-600">
                  <li>• Use the "Create Payment Request" form above to generate payment links</li>
                  <li>• Clients receive a link showing all available payment methods</li>
                  <li>• Track payment status in the Payment History section below</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Payment Method Comparison:</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="text-sm p-3 bg-white rounded border border-blue-200">
                <div className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Stripe (Credit/Debit Cards)
                </div>
                <div className="text-gray-600 mt-1">
                  <div>Fee: 2.9% + $0.30</div>
                  <div className="text-xs mt-1">✓ Professional • ✓ Instant verification • ✓ Best for high volume</div>
                </div>
              </div>
              <div className="text-sm p-3 bg-white rounded border border-blue-200">
                <div className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  PayPal
                </div>
                <div className="text-gray-600 mt-1">
                  <div>Fee: 2.9% + $0.30</div>
                  <div className="text-xs mt-1">✓ Widely trusted • ✓ Buyer protection • ✓ International payments</div>
                </div>
              </div>
              <div className="text-sm p-3 bg-white rounded border border-green-200">
                <div className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  Zelle
                </div>
                <div className="text-gray-600 mt-1">
                  <div className="text-green-600 font-medium">Free (No fees)</div>
                  <div className="text-xs mt-1">✓ Bank-to-bank • ✓ Instant • ✓ No signup needed</div>
                </div>
              </div>
              <div className="text-sm p-3 bg-white rounded border border-green-200">
                <div className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  Venmo
                </div>
                <div className="text-gray-600 mt-1">
                  <div className="text-green-600 font-medium">Free (No fees)</div>
                  <div className="text-xs mt-1">✓ Social payments • ✓ Popular with millennials • ✓ Easy to use</div>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-white border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              <strong>Pro Tip:</strong> Offer multiple payment methods to increase your collection rate. Clients who 
              prefer free options (Zelle/Venmo) are more likely to pay immediately, while Stripe/PayPal provide 
              professional payment processing with buyer protection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Divider */}
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Payment Overview & History</h2>
        
        {/* Payment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">${totalPending.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid This Month</p>
                  <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Clients</p>
                  <p className="text-2xl font-bold text-purple-600">{paymentRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods Supported */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Supported Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Credit Cards</span>
                <Badge variant="outline" className="text-xs">2.9%</Badge>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="font-medium">PayPal</span>
                <Badge variant="outline" className="text-xs">2.9%</Badge>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium">Zelle</span>
                <Badge variant="outline" className="text-xs bg-green-100">Free</Badge>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium">Venmo</span>
                <Badge variant="outline" className="text-xs bg-green-100">Free</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{request.clientName}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                          {request.paymentMethod && (
                            <Badge variant="outline">
                              {request.paymentMethod}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Amount: </span>
                            <span className="text-lg font-bold text-green-600">${request.amount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Description: </span>
                            {request.description}
                          </div>
                          <div>
                            <span className="font-medium">Due: </span>
                            {new Date(request.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => sendPaymentLink(request)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendPaymentLink(request)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}