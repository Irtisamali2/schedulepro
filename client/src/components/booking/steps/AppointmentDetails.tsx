import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock, User, Mail, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { format, addDays, isToday, isTomorrow, startOfDay, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { type ClientService, type Stylist } from "@shared/schema";
import { type BookingData } from "@shared/schema";

const appointmentDetailsSchema = z.object({
  appointmentDate: z.date({
    required_error: "Please select an appointment date",
  }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Please enter a valid email address"),
  clientPhone: z.string().min(10, "Please enter a valid phone number"),
});

type AppointmentDetailsData = z.infer<typeof appointmentDetailsSchema>;

interface AppointmentDetailsProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  selectedService?: ClientService;
  selectedStylist?: Stylist;
  clientId?: string;
}


export default function AppointmentDetails({ 
  bookingData, 
  updateBookingData, 
  selectedService, 
  selectedStylist,
  clientId: propClientId
}: AppointmentDetailsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [location] = useLocation();
  
  // Get clientId from props, URL, or localStorage
  const getClientId = () => {
    // First priority: clientId passed as prop
    if (propClientId) {
      return propClientId;
    }
    
    // Second: try to extract from URL patterns
    const bookingMatch = location.match(/\/booking\/([^\/]+)/);
    if (bookingMatch) {
      return bookingMatch[1];
    }
    
    const clientWebsiteMatch = location.match(/\/client-website\/([^\/]+)/);
    if (clientWebsiteMatch) {
      return clientWebsiteMatch[1];
    }
    
    // Fallback to localStorage
    const clientData = localStorage.getItem('clientData');
    if (clientData) {
      try {
        return JSON.parse(clientData).id;
      } catch (e) {
        console.warn('Failed to parse clientData from localStorage');
      }
    }
    return localStorage.getItem('currentClientId') || 'client_1';
  };
  
  const clientId = getClientId();

  const form = useForm<AppointmentDetailsData>({
    resolver: zodResolver(appointmentDetailsSchema),
    defaultValues: {
      appointmentDate: bookingData.appointmentDate || undefined,
      timeSlot: bookingData.timeSlot || "",
      clientName: bookingData.clientName || "",
      clientEmail: bookingData.clientEmail || "",
      clientPhone: bookingData.clientPhone || "",
    },
  });

  // Watch form values and update booking data
  const watchedValues = form.watch();
  
  useEffect(() => {
    const { appointmentDate, timeSlot, clientName, clientEmail, clientPhone } = watchedValues;
    updateBookingData({
      appointmentDate,
      timeSlot: timeSlot || null,
      clientName: clientName || "",
      clientEmail: clientEmail || "",
      clientPhone: clientPhone || "",
    });
  }, [watchedValues, updateBookingData]);

  const selectedDate = form.watch("appointmentDate");
  const selectedTimeSlot = form.watch("timeSlot");

  // Fetch available time slots when date is selected
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery<string[]>({
    queryKey: [`/api/public/client/${clientId}/available-slots`, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd'); // Use date-fns format for consistency
      const response = await fetch(`/api/public/client/${clientId}/available-slots?date=${dateStr}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      return response.json();
    },
    enabled: !!selectedDate,
  });

  // Generate available dates (next 30 days, excluding past dates)
  const availableDates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))
    .filter(date => isAfter(date, startOfDay(new Date())));

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return !isAfter(date, today) && !isToday(date);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Details</h2>
        <p className="text-gray-600">Select your preferred date and time, and provide your contact information</p>
      </div>

      {/* Service Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Selected Service</h4>
            <p className="text-blue-800 font-medium">{selectedService?.name}</p>
            <div className="flex items-center gap-4 mt-1 text-sm text-blue-700">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedService?.durationMinutes} minutes
              </span>
              <span>{selectedService?.price}</span>
              {selectedStylist && selectedStylist.name !== "any" && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedStylist.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Date and Time Selection */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>Choose when you'd like your appointment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Date</FormLabel>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="date-picker-trigger"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                formatDateDisplay(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setCalendarOpen(false);
                              // Reset time slot when date changes
                              form.setValue("timeSlot", "");
                            }}
                            disabled={isDateDisabled}
                            initialFocus
                            data-testid="date-picker-calendar"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time Slot Selection */}
                {selectedDate && (
                  <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Times</FormLabel>
                        {slotsLoading ? (
                          <div className="grid grid-cols-3 gap-2">
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                            <p className="text-yellow-800 font-medium">No availability configured</p>
                            <p className="text-yellow-700 text-sm mt-1">
                              The business owner hasn't set up availability for {format(selectedDate, "EEEE, MMM d")}.
                              Please try another date or contact them directly.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {availableSlots.map((time) => {
                              // Convert 24-hour format to 12-hour format for display
                              const [hours, minutes] = time.split(":").map(Number);
                              const period = hours >= 12 ? "PM" : "AM";
                              const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                              const displayTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
                              
                              return (
                                <Button
                                  key={time}
                                  type="button"
                                  variant={field.value === time ? "default" : "outline"}
                                  className="text-sm h-12"
                                  onClick={() => field.onChange(time)}
                                  data-testid={`time-slot-${time.replace(/[^a-zA-Z0-9]/g, '')}`}
                                >
                                  {displayTime}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Your Information
                </CardTitle>
                <CardDescription>We'll use this to confirm your appointment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          data-testid="input-client-name"
                          {...field} 
                        />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="your@email.com" 
                            className="pl-10"
                            data-testid="input-client-email"
                            {...field} 
                          />
                        </div>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="(555) 123-4567" 
                            className="pl-10"
                            data-testid="input-client-phone"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selected appointment summary */}
                {selectedDate && selectedTimeSlot && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Appointment Selected</h4>
                    </div>
                    <p className="text-green-700 text-sm" data-testid="appointment-summary">
                      {formatDateDisplay(selectedDate)} at {selectedTimeSlot}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}