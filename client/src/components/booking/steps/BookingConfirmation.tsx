import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MapPin, CreditCard, DollarSign, Download, Share2, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ClientService, type Stylist, type BookingData } from "@shared/schema";

interface BookingConfirmationProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  selectedService?: ClientService;
  selectedStylist?: Stylist;
  onNavigateBack?: () => void;
  clientId?: string;
}

export default function BookingConfirmation({ 
  bookingData, 
  updateBookingData, 
  selectedService, 
  selectedStylist,
  onNavigateBack,
  clientId = 'client_1'
}: BookingConfirmationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const createAppointmentMutation = useMutation({
    mutationFn: async () => {
      // For cash payments, create the appointment directly
      // Parse service price properly - handle both number and string formats
      const servicePriceStr = selectedService?.price?.toString() || "0";
      const servicePrice = parseFloat(servicePriceStr.replace(/[^\d.]/g, "")) || 0;

      const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        // Handle both 24-hour format ("09:30") and 12-hour format ("09:30 AM")
        let hours: number, minutes: number;
        
        if (startTime.includes(" ")) {
          // 12-hour format like "09:30 AM"
          const [time, period] = startTime.split(" ");
          [hours, minutes] = time.split(":").map(Number);
          
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
        } else {
          // 24-hour format like "09:30"
          [hours, minutes] = startTime.split(":").map(Number);
        }
        
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMins = totalMinutes % 60;
        
        // Return in 24-hour format to match the API expectation
        return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
      };

      // Use public booking endpoint - no authentication required  
      return apiRequest(`/api/public/client/${clientId}/book`, "POST", {
        serviceId: bookingData.serviceId,
        customerName: bookingData.clientName,
        customerEmail: bookingData.clientEmail,
        customerPhone: bookingData.clientPhone,
        appointmentDate: bookingData.appointmentDate?.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        startTime: bookingData.timeSlot,
        notes: bookingData.specialRequests || "",
        source: "website-booking"
      });
    },
    onSuccess: async (response) => {
      console.log('Booking API Success!');
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      // The API returns { message: "...", appointment: {...} }
      const appointment = responseData.appointment || responseData;
      updateBookingData({
        appointmentId: appointment.id,
        confirmationNumber: appointment.id,
      });
      setBookingInProgress(false);
      setIsBookingComplete(true);
      
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });
    },
    onError: async (error) => {
      console.error("Appointment creation failed:", error);
      setBookingInProgress(false);
      
      // Try to get the error message from the response
      let errorMessage = "There was an error creating your appointment. Please contact us directly.";
      
      try {
        if (error instanceof Response) {
          const errorData = await error.json();
          if (errorData.error === "Time slot is not available") {
            errorMessage = "This time slot is no longer available. Please select a different time.";
            
            // Clear only the selected time slot, keep the date so user doesn't have to reselect
            updateBookingData({
              timeSlot: null
            });
            
            // Invalidate the available slots query to refresh the list with the exact query key shape
            const selectedDate = bookingData.appointmentDate;
            if (selectedDate) {
              const dateStr = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
              queryClient.invalidateQueries({ 
                queryKey: [`/api/public/client/${clientId}/available-slots`, dateStr]
              });
            }
            
            // Navigate back to date/time selection immediately
            if (onNavigateBack) {
              onNavigateBack();
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      
      toast({
        title: "Booking Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    console.log('BookingConfirmation useEffect triggered:', {
      paymentMethod: bookingData.paymentMethod,
      paymentStatus: bookingData.paymentStatus,
      appointmentId: bookingData.appointmentId,
      isPending: createAppointmentMutation.isPending,
      serviceId: bookingData.serviceId,
      timeSlot: bookingData.timeSlot
    });
    
    // Automatically create appointment when confirmation screen loads for cash payments
    if ((bookingData.paymentMethod === "CASH" || bookingData.paymentStatus === "COMPLETED") 
        && !bookingData.appointmentId && !createAppointmentMutation.isPending && !bookingInProgress) {
      console.log('Triggering appointment creation...');
      setBookingInProgress(true);
      createAppointmentMutation.mutate();
    }
  }, [bookingData.paymentMethod, bookingData.paymentStatus, bookingData.appointmentId, bookingInProgress]);

  // Helper to convert 24-hour to 12-hour format for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    
    // If already in 12-hour format, return as-is
    if (timeStr.includes(" ")) return timeStr;
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDateTime = () => {
    if (!bookingData.appointmentDate || !bookingData.timeSlot) return "";
    
    const dateStr = bookingData.appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `${dateStr} at ${formatTime(bookingData.timeSlot)}`;
  };

  const getPaymentStatusBadge = () => {
    if (bookingData.paymentMethod === "ONLINE" && bookingData.paymentStatus === "COMPLETED") {
      return <Badge className="bg-green-100 text-green-800">Paid Online</Badge>;
    }
    if (bookingData.paymentMethod === "CASH") {
      return <Badge variant="outline" className="border-amber-300 text-amber-700">Payment Due at Appointment</Badge>;
    }
    return null;
  };

  const shareAppointment = async () => {
    const shareData = {
      title: 'Appointment Confirmation',
      text: `Appointment confirmed for ${formatDateTime()}\nConfirmation: ${bookingData.confirmationNumber}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copying to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `Appointment Confirmation\n${formatDateTime()}\nConfirmation Number: ${bookingData.confirmationNumber}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Appointment details copied to clipboard",
      });
    });
  };

  // Show different states based on booking progress
  if (bookingInProgress || createAppointmentMutation.isPending) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-4">
              <Clock className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Processing Your Booking...</h2>
          <p className="text-lg text-gray-600">Please wait while we confirm your appointment</p>
        </div>
      </div>
    );
  }

  if (createAppointmentMutation.isError) {
    return (
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <div className="w-12 h-12 text-red-600 flex items-center justify-center text-2xl font-bold">✕</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-red-900 mb-2">Booking Failed</h2>
          <p className="text-lg text-red-600">There was an error creating your appointment. Please try again or contact us directly.</p>
          <Button 
            onClick={() => {
              setBookingInProgress(false);
              createAppointmentMutation.reset();
              createAppointmentMutation.mutate();
            }}
            className="mt-4"
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
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-lg text-gray-600">Your appointment has been successfully scheduled</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Confirmation Number */}
        {bookingData.confirmationNumber && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-green-900 mb-2">Confirmation Number</h3>
              <div className="text-2xl font-bold text-green-700 tracking-wider" data-testid="confirmation-number">
                {bookingData.confirmationNumber}
              </div>
              <p className="text-sm text-green-600 mt-2">
                Save this number for your records
              </p>
            </CardContent>
          </Card>
        )}

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service */}
            <div className="flex items-start justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{selectedService?.name}</p>
                <p className="text-sm text-gray-600">{selectedService?.description}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {selectedService?.durationMinutes} minutes
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {selectedService?.price}
                  </span>
                </div>
              </div>
              {getPaymentStatusBadge()}
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 py-2 border-b border-gray-100">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Date & Time</p>
                <p className="text-gray-600" data-testid="appointment-datetime">
                  {formatDateTime()}
                </p>
              </div>
            </div>

            {/* Stylist */}
            {selectedStylist && (
              <div className="flex items-center gap-3 py-2 border-b border-gray-100">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Stylist</p>
                  <p className="text-gray-600">
                    {bookingData.stylistId === "any" ? "Any available stylist" : selectedStylist.name}
                  </p>
                </div>
              </div>
            )}

            {/* Client Info */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{bookingData.clientName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{bookingData.clientEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{bookingData.clientPhone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Requests */}
        {bookingData.specialRequests && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Special Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{bookingData.specialRequests}</p>
            </CardContent>
          </Card>
        )}

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookingData.emailConfirmation && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Email confirmations enabled</span>
                </div>
              )}
              {bookingData.smsConfirmation && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">SMS reminders enabled</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Info (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">Beauty Salon</p>
              <p className="text-gray-600">123 Main Street</p>
              <p className="text-gray-600">New York, NY 10001</p>
              <p className="text-sm text-blue-600 cursor-pointer hover:underline">
                Get directions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            onClick={shareAppointment}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-share-appointment"
          >
            <Share2 className="w-4 h-4" />
            Share Details
          </Button>
          
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-print-confirmation"
          >
            <Download className="w-4 h-4" />
            Print Confirmation
          </Button>

          <Button
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 sm:ml-auto"
            data-testid="button-back-home"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-3">Important Information</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Please arrive 5-10 minutes before your appointment time</li>
              <li>• Bring a valid ID for verification</li>
              {bookingData.paymentMethod === "CASH" && (
                <li>• Payment is due at the time of service (cash or card accepted)</li>
              )}
              <li>• To reschedule or cancel, please call us at least 24 hours in advance</li>
              <li>• If you have any questions, feel free to contact us</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}