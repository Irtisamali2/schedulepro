import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import BookingForm from "@/components/booking/BookingForm";
import Calendar from "@/components/booking/Calendar";
import TimeSlots from "@/components/booking/TimeSlots";
import ConfirmationModal from "@/components/booking/ConfirmationModal";
import { type Service, type Stylist, type Appointment } from "@shared/schema";

export interface SelectedBooking {
  date: Date | null;
  timeSlot: string | null;
  serviceId: number | null;
  stylistId: number | null;
}

export default function Booking() {
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking>({
    date: null,
    timeSlot: null,
    serviceId: null,
    stylistId: null,
  });
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    appointment: Appointment;
    service: Service | undefined;
    stylist: Stylist | undefined;
    confirmations: string[];
  } | null>(null);

  // Fetch services and stylists data
  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });
  
  const { data: stylists } = useQuery<Stylist[]>({
    queryKey: ["/api/stylists"],
  });

  // Get selected service and stylist objects
  const selectedService = services?.find(service => service.id === selectedBooking.serviceId);
  const selectedStylist = stylists?.find(stylist => stylist.id === selectedBooking.stylistId);

  // Handle appointment confirmation
  const handleConfirmation = (data: {
    appointment: Appointment;
    service: Service | undefined;
    stylist: Stylist | undefined;
    confirmations: string[];
  }) => {
    setConfirmationData(data);
    setShowConfirmation(true);
  };

  return (
    <section className="py-16 bg-neutral">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">Book Your Appointment</h2>
        
        <Card className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Left side - Form */}
            <div className="md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-200">
              <BookingForm 
                selectedBooking={selectedBooking}
                setSelectedBooking={setSelectedBooking}
                services={services}
                stylists={stylists}
                onConfirmation={handleConfirmation}
              />
            </div>
            
            {/* Right side - Calendar */}
            <div className="md:w-1/2 p-6 md:p-8 bg-neutral">
              <Calendar 
                selectedDate={selectedBooking.date}
                onSelectDate={(date) => setSelectedBooking({...selectedBooking, date, timeSlot: null})}
              />
              
              <TimeSlots 
                selectedDate={selectedBooking.date}
                selectedStylistId={selectedBooking.stylistId}
                selectedTimeSlot={selectedBooking.timeSlot}
                onSelectTimeSlot={(timeSlot) => setSelectedBooking({...selectedBooking, timeSlot})}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {showConfirmation && confirmationData && (
        <ConfirmationModal 
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          data={confirmationData}
        />
      )}
    </section>
  );
}
