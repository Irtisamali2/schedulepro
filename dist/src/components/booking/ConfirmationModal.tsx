import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/assets/icons";
import { type Appointment, type Service, type Stylist } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    appointment: Appointment;
    service: Service | undefined;
    stylist: Stylist | undefined;
    confirmations: string[];
  };
}

export default function ConfirmationModal({ isOpen, onClose, data }: ConfirmationModalProps) {
  const { appointment, service, stylist, confirmations } = data;
  
  const appointmentDate = new Date(appointment.date);
  const formattedDate = format(appointmentDate, "MMMM d, yyyy 'at' h:mm a");
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-primary">Booking Confirmed!</DialogTitle>
          <DialogDescription>Your appointment has been successfully scheduled</DialogDescription>
        </DialogHeader>
        
        <div className="bg-green-50 p-4 rounded-md mb-6 border border-green-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-green-500">
              <CheckIcon />
            </div>
            <div className="ml-3">
              <p className="text-green-800 font-medium">Your appointment has been scheduled.</p>
              <p className="text-green-700 text-sm">
                {confirmations.length > 0 && (
                  <>A confirmation has been sent to your {confirmations.join(" and ")}.</>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Appointment Details:</h4>
          <div className="bg-neutral p-4 rounded-md">
            <p className="mb-2">
              <span className="font-medium">Service:</span>{" "}
              <span>{service?.name || "Selected Service"}</span>
            </p>
            <p className="mb-2">
              <span className="font-medium">Date & Time:</span>{" "}
              <span>{formattedDate}</span>
            </p>
            <p className="mb-2">
              <span className="font-medium">Stylist:</span>{" "}
              <span>{stylist?.name || "Selected Stylist"}</span>
            </p>
            <p className="mb-2">
              <span className="font-medium">Price:</span>{" "}
              <span>{service?.price || "Price varies"}</span>
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Location:</h4>
          <p>StrandStudio Salon</p>
          <p>123 Hair Street, Suite 101</p>
          <p>Styleton, NY 10001</p>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Link href="/">
            <Button 
              className="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded-md transition"
            >
              Return Home
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
