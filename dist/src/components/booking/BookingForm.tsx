import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertAppointmentSchema, type Service, type Stylist, type Appointment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SelectedBooking } from "@/pages/Booking";

const formSchema = insertAppointmentSchema.extend({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(10, "Phone number must be at least 10 characters"),
  serviceId: z.number().min(1, "Please select a service"),
  stylistId: z.number().min(1, "Please select a stylist"),
  date: z.date().refine((date) => date instanceof Date && !isNaN(date.getTime()), {
    message: "Please select a date and time",
  }),
});

interface BookingFormProps {
  selectedBooking: SelectedBooking;
  setSelectedBooking: React.Dispatch<React.SetStateAction<SelectedBooking>>;
  services?: Service[];
  stylists?: Stylist[];
  onConfirmation: (data: {
    appointment: Appointment;
    service: Service | undefined;
    stylist: Stylist | undefined;
    confirmations: string[];
  }) => void;
}

export default function BookingForm({ 
  selectedBooking, 
  setSelectedBooking, 
  services, 
  stylists,
  onConfirmation 
}: BookingFormProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceId: 0,
      stylistId: 0,
      notes: "",
      emailConfirmation: true,
      smsConfirmation: false,
      date: new Date(),
    },
  });

  // Watch service, stylist, and date fields to update the selectedBooking state
  const watchedServiceId = form.watch("serviceId");
  const watchedStylistId = form.watch("stylistId");
  
  // Update the form when selectedBooking changes
  const updateFormFromSelectedBooking = () => {
    if (selectedBooking.serviceId !== null && selectedBooking.serviceId !== watchedServiceId) {
      form.setValue("serviceId", selectedBooking.serviceId);
    }
    
    if (selectedBooking.stylistId !== null && selectedBooking.stylistId !== watchedStylistId) {
      form.setValue("stylistId", selectedBooking.stylistId);
    }
    
    if (selectedBooking.date && selectedBooking.timeSlot) {
      const dateTime = new Date(selectedBooking.timeSlot);
      form.setValue("date", dateTime);
    }
  };
  
  // Update the form when selectedBooking changes
  updateFormFromSelectedBooking();

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: async (response) => {
      const responseData = await response.json();
      
      const selectedService = services?.find(service => service.id === watchedServiceId);
      const selectedStylist = stylists?.find(stylist => stylist.id === watchedStylistId);
      
      onConfirmation({
        appointment: responseData.appointment,
        service: selectedService,
        stylist: selectedStylist,
        confirmations: responseData.confirmations,
      });
      
      // Reset the form
      form.reset();
      setSelectedBooking({
        date: null,
        timeSlot: null,
        serviceId: null,
        stylistId: null,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem booking your appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  const selectedDateTime = selectedBooking.date && selectedBooking.timeSlot
    ? new Date(selectedBooking.timeSlot)
    : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Service</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(Number(value));
                  setSelectedBooking({...selectedBooking, serviceId: Number(value)});
                }}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services?.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - {service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="stylistId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Stylist</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(Number(value));
                  setSelectedBooking({...selectedBooking, stylistId: Number(value), timeSlot: null});
                }}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Any available stylist" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stylists?.map((stylist) => (
                    <SelectItem key={stylist.id} value={stylist.id.toString()}>
                      {stylist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedDateTime && (
          <div className="p-4 bg-neutral rounded-md">
            <p className="font-medium">Selected Appointment:</p>
            <p className="text-primary">
              {selectedDateTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {selectedDateTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="clientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
                <Input placeholder="your@email.com" {...field} />
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
                <Input placeholder="(555) 123-4567" {...field} />
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
                  placeholder="Any special requests or notes for your stylist..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-wrap items-center space-x-6">
          <FormField
            control={form.control}
            name="smsConfirmation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-gray-700">Text confirmation</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="emailConfirmation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-gray-700">Email confirmation</FormLabel>
              </FormItem>
            )}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-md transition"
          disabled={
            mutation.isPending || 
            !selectedBooking.date || 
            !selectedBooking.timeSlot || 
            !selectedBooking.serviceId || 
            !selectedBooking.stylistId
          }
        >
          {mutation.isPending ? "Processing..." : "Complete Booking"}
        </Button>
      </form>
    </Form>
  );
}
