import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Phone, Mail, User, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import StripeCheckout from '@/components/payment/StripeCheckout';

const bookingFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  stylistId: z.number().min(1, "Please select a staff member"),
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email"),
  clientPhone: z.string().min(10, "Please enter a valid phone number"),
  date: z.string().min(1, "Please select a date"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["CASH", "ONLINE"]).default("CASH"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function DirectBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [location] = useLocation();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'checkout'>('details');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get URL parameters for pre-selection
  const urlParams = new URLSearchParams(location?.split('?')[1] || '');
  const preSelectedServiceId = urlParams.get('service');

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
      paymentMethod: 'CASH',
    },
  });

  // Fetch business profile and booking info
  const { data: bookingData, isLoading, error } = useQuery({
    queryKey: ['/api/book', slug],
    enabled: !!slug,
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const response = await fetch(`/api/book/${slug}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: new Date(`${selectedDate}T${selectedTime}`),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book appointment');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setBookingResult(result);
      setBookingSuccess(true);
      toast({
        title: "Booking Submitted!",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pre-select service from URL parameter
  useEffect(() => {
    if (preSelectedServiceId && bookingData?.services) {
      const service = (bookingData.services as any[]).find((s: any) => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(service);
        form.setValue('serviceId', preSelectedServiceId);
      }
    }
  }, [preSelectedServiceId, bookingData, form]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const onSubmit = (data: BookingFormValues) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }
    createAppointmentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Booking Unavailable
            </CardTitle>
            <CardDescription>
              This booking link is not available or the business has disabled online booking.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { business, services, staff, bookingInfo } = bookingData as any;

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2 text-2xl">
              <CheckCircle className="h-8 w-8" />
              {bookingInfo.instantBooking ? "Booking Confirmed!" : "Booking Request Submitted!"}
            </CardTitle>
            <CardDescription className="text-lg">
              {bookingResult?.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {bookingResult?.requiresApproval && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                  <Clock className="h-4 w-4" />
                  Awaiting Approval
                </div>
                <p className="text-amber-700 text-sm">
                  Your appointment request has been sent to {business.businessName}. 
                  They will review and confirm your booking shortly. You'll receive an email confirmation once approved.
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Business Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {business.businessName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {business.email}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Appointment Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {selectedService && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      {selectedService.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Business Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl text-gray-900">{business.businessName}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  Book your appointment online
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {business.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {business.phone}
                  </div>
                )}
                {business.city && business.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {business.city}, {business.state}
                  </div>
                )}
              </div>
            </div>
            
            {!bookingInfo.instantBooking && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Approval Required:</span>
                  <span>This business reviews all booking requests before confirmation.</span>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Booking Form */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Appointment</CardTitle>
                <CardDescription>
                  Fill out the form below to schedule your service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Service Selection */}
                    <FormField
                      control={form.control}
                      name="serviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Service *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const serviceId = parseInt(value);
                              field.onChange(serviceId);
                              const service = services.find((s: any) => s.id === serviceId);
                              setSelectedService(service);
                            }} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(services as any[]).map((service: any) => (
                                <SelectItem key={service.id} value={service.id.toString()}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{service.name}</span>
                                    <span className="ml-2 text-green-600 font-medium">${service.price}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Staff Selection */}
                    <FormField
                      control={form.control}
                      name="stylistId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Staff Member *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a staff member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(staff as any[]).map((member: any) => (
                                <SelectItem key={member.id} value={member.id.toString()}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date and Time Selection */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Date *
                        </label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Time *
                        </label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose time" />
                          </SelectTrigger>
                          <SelectContent>
                            {generateTimeSlots().map((time) => (
                              <SelectItem key={time} value={time}>
                                {new Date(`2024-01-01T${time}`).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Client Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Your Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="Enter your phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Requests (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any special requests or notes for your appointment"
                                className="resize-none"
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={createAppointmentMutation.isPending}
                    >
                      {createAppointmentMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        bookingInfo.instantBooking ? "Book Appointment" : "Submit Booking Request"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedService ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{selectedService.name}</p>
                        <p className="text-sm text-gray-600">{selectedService.durationMinutes} minutes</p>
                      </div>
                      <p className="font-semibold text-green-600">${selectedService.price}</p>
                    </div>
                    
                    {selectedDate && selectedTime && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-medium">
                          {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString()} at{' '}
                          {new Date(`${selectedDate}T${selectedTime}`).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Select a service to see details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}