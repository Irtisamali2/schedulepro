import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { insertAppointmentSchema, type Service, type Stylist } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIndustry } from "@/lib/industryContext";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
const MINUTES = [0, 15, 30, 45];

const formSchema = insertAppointmentSchema.extend({
  clientName: z.string().min(2, "Name must be at least 2 characters"),
  clientEmail: z.string().email("Invalid email address"),
  clientPhone: z.string().min(10, "Phone number must be at least 10 characters"),
  serviceId: z.number().min(1, "Please select a service"),
  stylistId: z.number().min(1, "Please select a provider"),
  date: z.date(),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  durationMinutes: z.number().min(15).max(480).default(60),
  notes: z.string().optional(),
  professionalNotes: z.string().optional(),
});

interface AppointmentFormProps {
  services?: Service[];
  stylists?: Stylist[];
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Partial<z.infer<typeof formSchema>>;
  mode: "create" | "edit";
}

export default function AppointmentForm({
  services = [],
  stylists = [],
  onSuccess,
  onCancel,
  initialValues,
  mode = "create"
}: AppointmentFormProps) {
  const { toast } = useToast();
  const { selectedIndustry } = useIndustry();
  const [activeTab, setActiveTab] = useState<"client" | "schedule" | "notes">("client");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: initialValues?.clientName || "",
      clientEmail: initialValues?.clientEmail || "",
      clientPhone: initialValues?.clientPhone || "",
      serviceId: initialValues?.serviceId || 0,
      stylistId: initialValues?.stylistId || 0,
      date: initialValues?.date || new Date(),
      hour: initialValues?.hour || 9,
      minute: initialValues?.minute || 0,
      durationMinutes: initialValues?.durationMinutes || 60,
      notes: initialValues?.notes || "",
      professionalNotes: initialValues?.professionalNotes || "",
      emailConfirmation: initialValues?.emailConfirmation || true,
      smsConfirmation: initialValues?.smsConfirmation || false,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      // Create a new Date object with the selected date, hour, and minute
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(data.hour, data.minute, 0, 0);
      
      // Prepare the data for the API
      const appointmentData = {
        serviceId: data.serviceId,
        stylistId: data.stylistId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: appointmentDate.toISOString(),
        durationMinutes: Number(data.durationMinutes),
        notes: data.notes || "",
        professionalNotes: data.professionalNotes || "",
        emailConfirmation: data.emailConfirmation === undefined ? true : data.emailConfirmation,
        smsConfirmation: data.smsConfirmation === undefined ? false : data.smsConfirmation
      };
      
      console.log("Submitting appointment data:", appointmentData);
      
      // Send the data to the API
      const endpoint = mode === "create" 
        ? "/api/appointments" 
        : `/api/appointments/${(initialValues as any)?.id}`;
        
      const response = await apiRequest(
        mode === "create" ? "POST" : "PATCH",
        endpoint, 
        appointmentData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || "Failed to create appointment");
      }
      
      toast({
        title: "Success",
        description: mode === "create" 
          ? "Appointment created successfully" 
          : "Appointment updated successfully",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  }
  
  const watchServiceId = form.watch("serviceId");
  const watchStylistId = form.watch("stylistId");
  
  const handleNextTab = () => {
    if (activeTab === "client") {
      // Validate client fields before proceeding
      const clientFields = ["clientName", "clientEmail", "clientPhone"];
      const isValid = clientFields.every(field => {
        const fieldState = form.getFieldState(field as any);
        return !fieldState.invalid;
      });
      
      if (isValid) {
        setActiveTab("schedule");
      } else {
        // Trigger validation to show errors
        form.trigger(["clientName", "clientEmail", "clientPhone"]);
      }
    } else if (activeTab === "schedule") {
      // Validate schedule fields before proceeding
      const scheduleFields = ["serviceId", "stylistId", "date", "hour", "minute"];
      const isValid = scheduleFields.every(field => {
        const fieldState = form.getFieldState(field as any);
        return !fieldState.invalid;
      });
      
      if (isValid) {
        setActiveTab("notes");
      } else {
        // Trigger validation to show errors
        form.trigger(["serviceId", "stylistId", "date", "hour", "minute"]);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New Appointment" : "Edit Appointment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="client">Client Info</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <TabsContent value="client" className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
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
                        <Input placeholder="email@example.com" {...field} />
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
                
                <div className="flex justify-end">
                  <Button type="button" onClick={handleNextTab}>
                    Next: Schedule
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedIndustry.serviceTerm || "Service"}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select a ${selectedIndustry.serviceTerm || "service"}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
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
                        <FormLabel>{selectedIndustry.professionalName || "Provider"}</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select a ${selectedIndustry.professionalName || "provider"}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stylists.map((stylist) => (
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
                </div>
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              // Disable dates in the past
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hour</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOURS.map((hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour === 12 ? `${hour} PM` : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
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
                    name="minute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minute</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Minute" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MINUTES.map((minute) => (
                              <SelectItem key={minute} value={minute.toString()}>
                                {minute === 0 ? "00" : minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1 hour 30 minutes</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                          <SelectItem value="300">5 hours</SelectItem>
                          <SelectItem value="360">6 hours</SelectItem>
                          <SelectItem value="420">7 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("client")}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNextTab}>
                    Next: Notes
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Notes (visible to client)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Special requests, allergies, or preferences..." 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="professionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Notes (private)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes for professional use only - not visible to client" 
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("schedule")}>
                    Back
                  </Button>
                  <Button type="submit" className="bg-primary text-white">
                    {mode === "create" ? "Create Appointment" : "Update Appointment"}
                  </Button>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <p className="text-sm text-muted-foreground">
          {watchServiceId && watchStylistId ? (
            <>
              {services.find(s => s.id === watchServiceId)?.name} with{" "}
              {stylists.find(s => s.id === watchStylistId)?.name}
            </>
          ) : "Select service and provider to continue"}
        </p>
      </CardFooter>
    </Card>
  );
}