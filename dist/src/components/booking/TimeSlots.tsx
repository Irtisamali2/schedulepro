import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotsProps {
  selectedDate: Date | null;
  selectedStylistId: number | null;
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (timeSlot: string) => void;
}

export default function TimeSlots({ 
  selectedDate, 
  selectedStylistId, 
  selectedTimeSlot, 
  onSelectTimeSlot 
}: TimeSlotsProps) {
  const { data: timeSlots, isLoading } = useQuery<TimeSlot[]>({
    queryKey: [
      `/api/timeslots`, 
      selectedDate ? { 
        date: selectedDate.toISOString(), 
        stylistId: selectedStylistId || 0 
      } : null
    ],
    enabled: !!selectedDate,
  });

  if (!selectedDate) {
    return null;
  }

  const formattedDate = format(selectedDate, "MMM d, yyyy");

  return (
    <div className="mt-6">
      <h4 className="font-medium mb-3">
        Available Times for {formattedDate}
      </h4>
      
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !timeSlots || timeSlots.length === 0 ? (
        <p className="text-center py-4 text-gray-500">
          No available time slots for this date.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {timeSlots.map((slot) => {
            const time = new Date(slot.time);
            const formattedTime = format(time, "h:mm a");
            const isSelected = selectedTimeSlot === slot.time;
            
            return (
              <button
                key={slot.time}
                onClick={() => slot.available && onSelectTimeSlot(slot.time)}
                className={`time-slot ${
                  isSelected ? "selected" : slot.available ? "available" : "unavailable"
                }`}
                disabled={!slot.available}
              >
                {formattedTime}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
