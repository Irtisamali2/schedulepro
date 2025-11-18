import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import PaymentOptions from "@/components/dashboard/PaymentOptions";
import { useToast } from "@/hooks/use-toast";
import { type Appointment, type Service, type Stylist } from "@shared/schema";

interface AppointmentDetailsProps {
  appointment: Appointment;
  service?: Service;
  stylist?: Stylist;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetails({ 
  appointment, 
  service, 
  stylist,
  isOpen, 
  onClose 
}: AppointmentDetailsProps) {
  const [selectedTab, setSelectedTab] = useState("details");
  const { toast } = useToast();
  
  const handleConfirmAppointment = () => {
    // In a real app, send API request to confirm the appointment
    toast({
      title: "Appointment Confirmed",
      description: `${appointment.clientName}'s appointment has been confirmed.`
    });
  };
  
  const handleCancelAppointment = () => {
    // In a real app, send API request to cancel the appointment
    toast({
      title: "Appointment Cancelled",
      description: `${appointment.clientName}'s appointment has been cancelled.`,
      variant: "destructive"
    });
  };
  
  const handleReschedule = () => {
    // In a real app, this would open a reschedule form
    toast({
      title: "Reschedule",
      description: "Reschedule functionality would open here."
    });
  };
  
  const handleSendReminder = () => {
    // In a real app, send API request to send reminder
    toast({
      title: "Reminder Sent",
      description: `A reminder has been sent to ${appointment.clientName}.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Appointment Details
            <Badge variant={appointment.confirmed ? "success" : "outline"}>
              {appointment.confirmed ? "Confirmed" : "Pending"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Appointment #{appointment.id} with {appointment.clientName}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Date & Time</h3>
                  <p>{format(new Date(appointment.date), 'MMMM d, yyyy')}</p>
                  <p>{format(new Date(appointment.date), 'h:mm a')}</p>
                  
                  <h3 className="font-semibold mt-4 mb-2">Service</h3>
                  <p>{service?.name || 'Unknown Service'}</p>
                  <p>{service?.durationMinutes} minutes</p>
                  <p className="font-medium">{service?.price}</p>
                  
                  <h3 className="font-semibold mt-4 mb-2">Stylist</h3>
                  <p>{stylist?.name || 'Unknown Stylist'}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Client Information</h3>
                  <p>{appointment.clientName}</p>
                  <p>{appointment.clientEmail}</p>
                  <p>{appointment.clientPhone}</p>
                  
                  <h3 className="font-semibold mt-4 mb-2">Notes</h3>
                  <p className="text-muted-foreground">{appointment.notes || 'No notes'}</p>
                  
                  <h3 className="font-semibold mt-4 mb-2">Notifications</h3>
                  <p>
                    Email Notifications: {appointment.emailConfirmation ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    SMS Notifications: {appointment.smsConfirmation ? 'Enabled' : 'Disabled'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between pt-2">
              <div className="space-x-2">
                <Button variant="outline" onClick={handleSendReminder}>
                  Send Reminder
                </Button>
                <Button variant="outline" onClick={handleReschedule}>
                  Reschedule
                </Button>
              </div>
              
              <div className="space-x-2">
                {!appointment.confirmed && (
                  <Button onClick={handleConfirmAppointment}>
                    Confirm Appointment
                  </Button>
                )}
                <Button variant="destructive" onClick={handleCancelAppointment}>
                  Cancel Appointment
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payment">
            <div className="py-4">
              <PaymentOptions 
                appointmentId={appointment.id} 
                clientName={appointment.clientName} 
                amount={service?.price ? parseFloat(service.price.replace('$', '')) : 0} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}