import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Appointment } from "@shared/schema";

export default function WeeklySchedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  
  // Get appointments for the current week
  // In a real application, you would fetch appointments for the entire week
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/week", startDate.toISOString()],
    queryFn: async () => {
      // Mock data for demonstration
      // In a real app, you would fetch from your backend
      return [
        {
          id: 1,
          serviceId: 1,
          stylistId: 1,
          clientName: "Jane Smith",
          clientEmail: "jane@example.com",
          clientPhone: "555-123-4567",
          date: new Date(new Date().setHours(10, 0, 0, 0)),
          notes: "Regular trim",
          confirmed: true,
          emailConfirmation: true,
          smsConfirmation: false
        },
        {
          id: 2,
          serviceId: 2,
          stylistId: 1,
          clientName: "John Doe",
          clientEmail: "john@example.com",
          clientPhone: "555-987-6543",
          date: new Date(new Date().setHours(14, 0, 0, 0)),
          notes: "New style consultation",
          confirmed: true,
          emailConfirmation: true,
          smsConfirmation: true
        },
        {
          id: 3,
          serviceId: 3,
          stylistId: 1,
          clientName: "Lisa Johnson",
          clientEmail: "lisa@example.com",
          clientPhone: "555-456-7890",
          date: new Date(addDays(new Date(), 1).setHours(11, 0, 0, 0)),
          notes: "Color treatment",
          confirmed: false,
          emailConfirmation: true,
          smsConfirmation: false
        }
      ];
    }
  });

  // Generate the days of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(startDate, i);
    return {
      date: day,
      dayName: format(day, 'EEEE'),
      dayNumber: format(day, 'd'),
      month: format(day, 'MMM')
    };
  });

  // All 24 hours with half-hour increments
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    const hourDisplay = hour === 0 || hour === 12 ? 12 : hour % 12;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${hourDisplay}:${minutes === 0 ? '00' : minutes} ${period}`;
  });

  // Function to find appointments for a specific day and time slot
  const getAppointmentsForTimeSlot = (day: Date, timeSlot: string) => {
    if (!appointments) return [];
    
    const [hourStr, minuteStr] = timeSlot.split(':');
    let hour = parseInt(hourStr);
    const isPM = timeSlot.includes('PM');
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const minutes = parseInt(minuteStr.split(' ')[0]);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isSameDay(appointmentDate, day) && 
             appointmentDate.getHours() === hour && 
             appointmentDate.getMinutes() === minutes;
    });
  };

  const handlePrevWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Weekly Schedule</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>Previous Week</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>Next Week</Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-10">Loading schedule...</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[100px_repeat(7,_1fr)] border rounded-md">
              {/* Header row with days */}
              <div className="border-b p-2 font-medium"></div>
              {weekDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`border-b p-2 text-center font-medium ${
                    isSameDay(day.date, new Date()) ? 'bg-primary/10' : ''
                  }`}
                >
                  <div>{day.dayName}</div>
                  <div className="text-xl">{day.dayNumber}</div>
                  <div className="text-xs text-muted-foreground">{day.month}</div>
                </div>
              ))}
              
              {/* Time slots */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <>
                  <div key={`time-${timeIndex}`} className="border-b p-2 flex items-center text-sm">
                    {timeSlot}
                  </div>
                  
                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForTimeSlot(day.date, timeSlot);
                    return (
                      <div 
                        key={`slot-${dayIndex}-${timeIndex}`} 
                        className={`border-b p-1 min-h-[50px] ${
                          isSameDay(day.date, new Date()) ? 'bg-primary/5' : ''
                        }`}
                      >
                        {slotAppointments.map(appointment => (
                          <div 
                            key={appointment.id}
                            className="bg-primary/20 text-primary-foreground p-1 mb-1 rounded text-xs overflow-hidden"
                          >
                            <div className="font-medium">{appointment.clientName}</div>
                            <div className="flex justify-between items-center">
                              <span className="truncate">{appointment.notes}</span>
                              <Badge variant={appointment.confirmed ? "success" : "outline"} className="text-[10px] h-4">
                                {appointment.confirmed ? "Confirmed" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}