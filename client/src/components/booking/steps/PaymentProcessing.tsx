import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Lock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ClientService, type Stylist, type BookingData } from "@shared/schema";

// Initialize Stripe using the correct environment variable name
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_...");

interface PaymentProcessingProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  selectedService?: ClientService;
  selectedStylist?: Stylist;
  clientId?: string;
}

interface PaymentFormProps extends PaymentProcessingProps {
  clientSecret: string;
  amount: number;
}

function PaymentForm({ 
  bookingData, 
  updateBookingData, 
  selectedService, 
  selectedStylist,
  clientSecret,
  amount 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      return apiRequest("/api/bookings/confirm", "POST", {
        paymentIntentId,
        customerName: bookingData.clientName,
        customerEmail: bookingData.clientEmail,
        customerPhone: bookingData.clientPhone,
        appointmentDate: bookingData.appointmentDate?.toISOString(),
        startTime: bookingData.timeSlot,
        endTime: calculateEndTime(bookingData.timeSlot!, selectedService?.durationMinutes || 60),
        notes: bookingData.specialRequests,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      updateBookingData({
        paymentStatus: "COMPLETED",
        appointmentId: data.appointment.id,
        confirmationNumber: data.appointment.id,
      });
      
      toast({
        title: "Payment Successful!",
        description: "Your appointment has been confirmed and booked.",
      });
    },
    onError: (error) => {
      updateBookingData({ paymentStatus: "FAILED" });
      toast({
        title: "Payment Confirmation Failed",
        description: "Payment processed but booking confirmation failed. Please contact us.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    updateBookingData({ paymentStatus: "PROCESSING" });

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      return;
    }

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: bookingData.clientName,
          email: bookingData.clientEmail,
          phone: bookingData.clientPhone,
        },
      },
    });

    if (error) {
      updateBookingData({ paymentStatus: "FAILED" });
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentIntent.status === "succeeded") {
      updateBookingData({ 
        paymentStatus: "COMPLETED",
        paymentIntentId: paymentIntent.id 
      });
      
      // Confirm the booking
      confirmPaymentMutation.mutate(paymentIntent.id);
      setIsProcessing(false);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [time, period] = startTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    
    let totalMinutes = (hours % 12) * 60 + minutes;
    if (period === "PM" && hours !== 12) totalMinutes += 12 * 60;
    if (period === "AM" && hours === 12) totalMinutes = minutes;
    
    totalMinutes += durationMinutes;
    
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    const endPeriod = endHours >= 12 ? "PM" : "AM";
    const displayHours = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
    
    return `${displayHours}:${endMins.toString().padStart(2, "0")} ${endPeriod}`;
  };

  if (bookingData.paymentStatus === "COMPLETED") {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-700">Your appointment has been confirmed and booked.</p>
      </div>
    );
  }

  if (bookingData.paymentStatus === "FAILED") {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-800 mb-2">Payment Failed</h3>
        <p className="text-red-700 mb-4">There was an issue processing your payment.</p>
        <Button 
          onClick={() => updateBookingData({ paymentStatus: null })}
          variant="outline"
          data-testid="button-retry-payment"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{selectedService?.name}</span>
            <span className="font-medium">${amount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-green-600">${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Element */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#374151",
                "::placeholder": {
                  color: "#9CA3AF",
                },
              },
            },
          }}
          className="p-3 border border-gray-300 rounded-md"
        />
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-blue-800">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Secure Payment</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Your payment information is encrypted and secure. We never store your card details.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-lg"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Confirm Payment (${amount.toFixed(2)})
          </>
        )}
      </Button>
    </form>
  );
}

export default function PaymentProcessing({ 
  bookingData, 
  updateBookingData, 
  selectedService, 
  selectedStylist,
  clientId = 'client_1'
}: PaymentProcessingProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const { toast } = useToast();

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      const servicePrice = selectedService?.price || 0;

      return apiRequest("/api/bookings/payment-intent", "POST", {
        clientId: clientId,
        serviceId: bookingData.serviceId,
        tipPercentage: 0, // Could be added as a feature
        customerEmail: bookingData.clientEmail,
        customerName: bookingData.clientName,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setAmount(data.amount);
      updateBookingData({ paymentIntentId: data.paymentIntentId });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (bookingData.paymentMethod === "ONLINE" && !clientSecret) {
      createPaymentIntentMutation.mutate();
    }
  }, [bookingData.paymentMethod, clientSecret]);

  if (createPaymentIntentMutation.isPending) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing Payment</h2>
          <p className="text-gray-600 mb-8">Setting up secure payment processing...</p>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (createPaymentIntentMutation.isError) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup Failed</h2>
          <p className="text-gray-600 mb-6">There was an error setting up payment processing.</p>
          <Button 
            onClick={() => createPaymentIntentMutation.mutate()}
            data-testid="button-retry-payment-setup"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600">Enter your payment information to confirm your booking</p>
      </div>

      {/* Appointment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
        <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
        <div className="space-y-1 text-sm text-blue-800">
          <p><strong>{selectedService?.name}</strong></p>
          <p>{bookingData.appointmentDate?.toLocaleDateString()} at {bookingData.timeSlot}</p>
          <p>{bookingData.clientName}</p>
          {selectedStylist && selectedStylist.name !== "any" && (
            <p>with {selectedStylist.name}</p>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {clientSecret && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              selectedService={selectedService}
              selectedStylist={selectedStylist}
              clientSecret={clientSecret}
              amount={amount}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}