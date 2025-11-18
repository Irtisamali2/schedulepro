import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Calculate days from the previous month to fill the first week
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const prevMonthDays = firstDayOfMonth > 0 ? Array(firstDayOfMonth).fill(null) : [];
  
  // Calculate days needed from the next month to complete the grid
  const totalDaysDisplayed = Math.ceil((daysInMonth.length + prevMonthDays.length) / 7) * 7;
  const nextMonthDays = Array(totalDaysDisplayed - daysInMonth.length - prevMonthDays.length).fill(null);
  
  const handleDateClick = (date: Date) => {
    onSelectDate(date);
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-display font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Previous month"
          >
            <ChevronLeftIcon />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-200 transition"
            aria-label="Next month"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-gray-500 text-sm font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Previous month days */}
        {prevMonthDays.map((_, index) => (
          <div key={`prev-${index}`} className="text-center py-2 text-gray-400 pointer-events-none">
            {format(subMonths(currentMonth, 1), "t").startsWith("Feb") && index >= 28 
              ? "" 
              : format(new Date(subMonths(currentMonth, 1).getFullYear(), subMonths(currentMonth, 1).getMonth(), endOfMonth(subMonths(currentMonth, 1)).getDate() - (prevMonthDays.length - index - 1)), "d")}
          </div>
        ))}
        
        {/* Current month days */}
        {daysInMonth.map((date) => {
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isTodayDate = isToday(date);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`calendar-day ${
                isSelected ? "selected" : ""
              } ${isTodayDate && !isSelected ? "border-2 border-primary" : ""}`}
            >
              {format(date, "d")}
            </button>
          );
        })}
        
        {/* Next month days */}
        {nextMonthDays.map((_, index) => (
          <div key={`next-${index}`} className="text-center py-2 text-gray-400 pointer-events-none">
            {format(new Date(addMonths(currentMonth, 1).getFullYear(), addMonths(currentMonth, 1).getMonth(), index + 1), "d")}
          </div>
        ))}
      </div>
    </div>
  );
}
