import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail } from 'lucide-react';

interface SendCalendarInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    customerName: string;
    customerEmail?: string;
    appointmentDate: string | Date;
    startTime: string;
    endTime?: string;
    serviceName?: string;
    notes?: string;
  };
}

export default function SendCalendarInviteDialog({ isOpen, onClose, appointment }: SendCalendarInviteDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState(appointment.customerEmail || '');
  const { toast } = useToast();

  const sendCalendarInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest(
        `/api/appointments/${appointment.id}/send-calendar-invite`,
        'POST',
        { recipientEmail: email }
      );
    },
    onSuccess: () => {
      toast({
        title: "Calendar Invite Sent",
        description: `Calendar invite has been sent to ${recipientEmail}`,
      });
      onClose();
      setRecipientEmail('');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: error.message || "Failed to send calendar invite",
      });
    },
  });

  const handleSend = () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address",
      });
      return;
    }

    sendCalendarInviteMutation.mutate(recipientEmail);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Calendar Invite
          </DialogTitle>
          <DialogDescription>
            Send appointment details as a calendar invite via email. The recipient can add it to their Google Calendar or any calendar app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-details">Appointment Details</Label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md space-y-1">
              <p><strong>Customer:</strong> {appointment.customerName}</p>
              <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {appointment.startTime}</p>
              {appointment.serviceName && <p><strong>Service:</strong> {appointment.serviceName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email Address</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="Enter email address"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              data-testid="input-recipient-email"
            />
            <p className="text-xs text-gray-500">
              The calendar invite will be sent to this email address
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={sendCalendarInviteMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendCalendarInviteMutation.isPending}
            data-testid="button-send-invite"
          >
            {sendCalendarInviteMutation.isPending ? 'Sending...' : 'Send Calendar Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
