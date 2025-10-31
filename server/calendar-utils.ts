/**
 * Utility functions for generating iCalendar (.ics) format
 * Compatible with Google Calendar, Outlook, Apple Calendar, etc.
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeEmail?: string;
  attendeeName?: string;
}

/**
 * Format a date to iCalendar format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate a unique UID for the calendar event
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@scheduled-app`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate .ics file content for a calendar event
 */
export function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const uid = generateUID();
  const dtstamp = formatICalDate(now);
  const dtstart = formatICalDate(event.startTime);
  const dtend = formatICalDate(event.endTime);
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Scheduled App//Appointment Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ];

  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    icsContent.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.organizerEmail) {
    const organizerName = event.organizerName || event.organizerEmail;
    icsContent.push(`ORGANIZER;CN=${escapeICalText(organizerName)}:mailto:${event.organizerEmail}`);
  }

  if (event.attendeeEmail) {
    const attendeeName = event.attendeeName || event.attendeeEmail;
    icsContent.push(`ATTENDEE;CN=${escapeICalText(attendeeName)};RSVP=TRUE:mailto:${event.attendeeEmail}`);
  }

  icsContent.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return icsContent.join('\r\n');
}

/**
 * Convert time string (HH:MM) to hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Create a Date object from date and time string
 */
export function createDateTimeFromStrings(dateString: string | Date, timeString: string): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const { hours, minutes } = parseTimeString(timeString);
  
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  
  return dateTime;
}

/**
 * Calculate end time by adding duration in minutes
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
