import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  type Service, 
  type Stylist, 
  type Appointment 
} from "@shared/schema";
import AppointmentDetails from "@/components/dashboard/AppointmentDetails";
import AppointmentForm from "@/components/dashboard/AppointmentForm";
import WeeklySchedule from "@/components/dashboard/WeeklySchedule";
import ClientManagement from "@/components/dashboard/ClientManagement";
import PaymentOptions from "@/components/dashboard/PaymentOptions";
import { useIndustry, getTerminology } from "@/lib/industryContext";

export default function StylistDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTab, setSelectedTab] = useState("appointments");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  
  // For data refreshing
  const queryClient = useQueryClient();
  
  // Get industry context
  const { selectedIndustry } = useIndustry();
  const terms = getTerminology(selectedIndustry);
  
  // Format date for API request
  const formattedDate = selectedDate ? selectedDate.toISOString() : new Date().toISOString();
  
  // Get all appointments for the selected date
  const { data: appointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", formattedDate],
    queryFn: async () => {
      const response = await fetch(`/api/appointments?date=${formattedDate}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });
  
  // Get all services
  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  // Get all stylists
  const { data: stylists } = useQuery<Stylist[]>({
    queryKey: ["/api/stylists"],
  });
  
  // Find service by ID
  const getService = (serviceId: number) => {
    return services?.find(service => service.id === serviceId);
  };
  
  // Find stylist by ID
  const getStylist = (stylistId: number) => {
    return stylists?.find(stylist => stylist.id === stylistId);
  };
  
  // Sort appointments by time
  const sortedAppointments = appointments?.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Handle appointment click to show details
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentDetailsOpen(true);
  };
  
  // Calculate today's revenue
  const calculateDailyRevenue = () => {
    if (!appointments || !services) return 0;
    
    return appointments.reduce((total, appointment) => {
      const service = getService(appointment.serviceId);
      if (service) {
        // Remove '$' and convert to number
        const price = parseFloat(service.price.replace('$', ''));
        return total + price;
      }
      return total;
    }, 0);
  };

  // Count today's appointments
  const todayAppointmentsCount = appointments?.length || 0;
  
  // Calculate completion percentage
  const completedAppointments = appointments?.filter(a => a.confirmed) || [];
  const completionPercentage = appointments?.length 
    ? Math.round((completedAppointments.length / appointments.length) * 100) 
    : 0;
  
  return (
    <section className="py-8 bg-neutral">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">
          {selectedIndustry.name} Dashboard
        </h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${calculateDailyRevenue().toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                From {todayAppointmentsCount} {todayAppointmentsCount === 1 ? terms.appointment : terms.appointment + 's'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {terms.appointment.charAt(0).toUpperCase() + terms.appointment.slice(1)}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointmentsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedAppointments.length} completed ({completionPercentage}%)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => setIsAddAppointmentOpen(true)}
              >
                New {terms.appointment.charAt(0).toUpperCase() + terms.appointment.slice(1)}
              </Button>
              <Button size="sm" variant="outline">Request Review</Button>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="appointments" onValueChange={setSelectedTab} className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="appointments">Today's {terms.appointment.charAt(0).toUpperCase() + terms.appointment.slice(1)}s</TabsTrigger>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="clients">{terms.client.charAt(0).toUpperCase() + terms.client.slice(1)} Management</TabsTrigger>
            <TabsTrigger value="payments">Process Payment</TabsTrigger>
          </TabsList>
          
          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                  <CardDescription>View appointments for a specific date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today\'s'} Appointments
                    </CardTitle>
                    <CardDescription>
                      {sortedAppointments?.length || 0} appointments scheduled
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddAppointmentOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Appointment
                  </Button>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="text-center py-8">Loading appointments...</div>
                  ) : sortedAppointments && sortedAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {sortedAppointments.map((appointment) => {
                        const service = getService(appointment.serviceId);
                        return (
                          <Card 
                            key={appointment.id} 
                            className="p-4 relative hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => handleAppointmentClick(appointment)}
                          >
                            <div className="grid md:grid-cols-[2fr_2fr_1fr] gap-4">
                              <div>
                                <h3 className="font-medium text-lg">{appointment.clientName}</h3>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.clientEmail} | {appointment.clientPhone}
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <Badge variant="secondary">{service?.name || "Unknown Service"}</Badge>
                                  <Badge variant="outline">{service?.price || "$0"}</Badge>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm mb-1">
                                  <span className="font-medium">Time:</span> {format(new Date(appointment.date), 'h:mm a')}
                                </p>
                                <p className="text-sm mb-1">
                                  <span className="font-medium">Duration:</span> {service?.durationMinutes || 0} minutes
                                </p>
                                {appointment.notes && (
                                  <p className="text-sm mt-2">
                                    <span className="font-medium">Notes:</span> {appointment.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end justify-start gap-2">
                                <Button size="sm">Process Payment</Button>
                                <div className="flex gap-2">
                                  <Badge variant={appointment.confirmed ? "success" : "outline"}>
                                    {appointment.confirmed ? "Confirmed" : "Pending"}
                                  </Badge>
                                  {appointment.smsConfirmation && (
                                    <Badge variant="secondary">SMS</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No appointments for this date</p>
                      <Button onClick={() => setIsAddAppointmentOpen(true)}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Add New Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <WeeklySchedule />
          </TabsContent>
          
          {/* Clients Tab */}
          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Payment</CardTitle>
                  <CardDescription>Process a payment without an appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentOptions 
                    appointmentId={0} 
                    clientName="Walk-in Client" 
                    amount={50} 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Recent transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">Jane Smith</p>
                        <p className="text-sm text-muted-foreground">Women's Haircut</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$65.00</p>
                        <p className="text-xs text-muted-foreground">Today, 2:30 PM</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">Mike Johnson</p>
                        <p className="text-sm text-muted-foreground">Men's Haircut</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$40.00</p>
                        <p className="text-xs text-muted-foreground">Today, 11:15 AM</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">Sarah Williams</p>
                        <p className="text-sm text-muted-foreground">Color & Style</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$120.00</p>
                        <p className="text-xs text-muted-foreground">Yesterday, 4:00 PM</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">View All Transactions</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails 
          appointment={selectedAppointment}
          service={getService(selectedAppointment.serviceId)}
          stylist={getStylist(selectedAppointment.stylistId)}
          isOpen={isAppointmentDetailsOpen}
          onClose={() => setIsAppointmentDetailsOpen(false)}
        />
      )}
      
      {/* Add New Appointment Dialog */}
      <Dialog open={isAddAppointmentOpen} onOpenChange={setIsAddAppointmentOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogTitle className="sr-only">Add New Appointment</DialogTitle>
          <DialogDescription className="sr-only">Form to add a new client appointment</DialogDescription>
          <AppointmentForm
            services={services || []}
            stylists={stylists || []}
            mode="create"
            onSuccess={() => {
              setIsAddAppointmentOpen(false);
              // Refresh appointments data
              queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
            }}
            onCancel={() => setIsAddAppointmentOpen(false)}
            initialValues={{ 
              date: selectedDate || new Date(),
              hour: 9,
              minute: 0
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}