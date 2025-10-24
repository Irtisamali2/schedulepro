import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    customerName: string;
    appointmentDate: Date | string;
    startTime: string;
    assignedTo?: string | null;
  };
  clientId: string;
}

export default function AppointmentTransferDialog({
  isOpen,
  onClose,
  appointment,
  clientId
}: AppointmentTransferDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingStaff } = useQuery<any[]>({
    queryKey: [`/api/client/${clientId}/team-members`],
    enabled: isOpen,
  });

  // Fetch client plan details
  const { data: client } = useQuery<any>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: isOpen,
  });

  const { data: plan } = useQuery<any>({
    queryKey: [`/api/plans/${client?.planId || 'none'}`],
    enabled: isOpen && !!client?.planId,
  });

  // Check if plan supports appointment transfer
  const hasTransferFeature = plan?.features?.includes("Appointment Transfer") ?? false;

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { toStaffId: string; reason?: string }) => {
      const response = await fetch(
        `/api/client/${clientId}/appointments/${appointment.id}/transfer`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/appointments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/status'] });
      toast({
        title: "Appointment Transferred",
        description: "The appointment has been successfully transferred.",
      });
      onClose();
      setSelectedStaffId("");
      setReason("");
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "Failed to transfer appointment";
      const shouldUpgrade = error?.upgrade;
      
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (shouldUpgrade) {
        setTimeout(() => {
          window.location.href = "/#pricing";
        }, 2000);
      }
    },
  });

  const handleTransfer = () => {
    if (!selectedStaffId) {
      toast({
        title: "Missing Information",
        description: "Please select a team member to transfer to.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      toStaffId: selectedStaffId,
      reason: reason.trim() || undefined,
    });
  };

  // Filter out the currently assigned staff member
  const availableStaff = teamMembers.filter(
    (member: any) => member.id !== appointment.assignedTo && member.isActive
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Appointment</DialogTitle>
          <DialogDescription>
            Transfer this appointment to another team member.
          </DialogDescription>
        </DialogHeader>

        {!hasTransferFeature && (
          <Alert className="border-amber-200 bg-amber-50">
            <Users className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Appointment transfers are only available on the Team plan or higher.{" "}
              <a href="/#pricing" className="underline font-medium">
                Upgrade now
              </a>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Appointment Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Customer: {appointment.customerName}</p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
            </p>
          </div>

          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff-select">Transfer to</Label>
            <Select
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
              disabled={!hasTransferFeature || isLoadingStaff || transferMutation.isPending}
            >
              <SelectTrigger id="staff-select" data-testid="select-staff">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingStaff ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading team members...
                  </div>
                ) : availableStaff.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No available team members
                  </div>
                ) : (
                  availableStaff.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.role}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Optional Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason-textarea">Reason (Optional)</Label>
            <Textarea
              id="reason-textarea"
              data-testid="input-reason"
              placeholder="Enter reason for transfer..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={!hasTransferFeature || transferMutation.isPending}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={transferMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!hasTransferFeature || !selectedStaffId || transferMutation.isPending}
              data-testid="button-transfer"
            >
              {transferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer Appointment"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
