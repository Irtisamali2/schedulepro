import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Filter,
  MoreHorizontal,
  ArrowRightLeft,
  CalendarPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AppointmentTransferDialog from './AppointmentTransferDialog';
import SendCalendarInviteDialog from './SendCalendarInviteDialog';

interface Appointment {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  serviceId: number;
  stylistId: number;
  notes?: string;
  status: 'pending' | 'approved' | 'declined';
  isDirectBooking: boolean;
  businessId?: number;
  declineReason?: string;
  professionalNotes?: string;
}

export default function AppointmentApproval() {
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [declineReason, setDeclineReason] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'decline' | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTransferAppointment, setSelectedTransferAppointment] = useState<Appointment | null>(null);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedCalendarAppointment, setSelectedCalendarAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get clientId from session storage or use default
  // In production, this should come from authenticated user context
  const clientId = (() => {
    try {
      const sessionData = localStorage.getItem("teamMemberSession");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed.clientId || "client_1";
      }
    } catch (e) {
      console.error("Failed to parse session data:", e);
    }
    return "client_1"; // Fallback for development
  })();

  // Fetch appointments by status
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments/status', filterStatus],
    enabled: !!filterStatus,
  });

  // Fetch services and staff for display
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['/api/stylists'],
  });

  // Single appointment approval
  const approveAppointmentMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await fetch(`/api/appointments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorNotes: notes }),
      });
      if (!response.ok) throw new Error('Failed to approve appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/status'] });
      toast({
        title: "Appointment Approved",
        description: "The appointment has been approved and the client will be notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Single appointment decline
  const declineAppointmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(`/api/appointments/${id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to decline appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/status'] });
      toast({
        title: "Appointment Declined",
        description: "The appointment has been declined and the client will be notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Decline Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ appointmentIds, action, reason, notes }: {
      appointmentIds: number[];
      action: 'approve' | 'decline';
      reason?: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/appointments/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentIds, action, reason, operatorNotes: notes }),
      });
      if (!response.ok) throw new Error('Bulk action failed');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/status'] });
      setSelectedAppointments([]);
      setDialogOpen(false);
      toast({
        title: "Bulk Action Completed",
        description: `${result.successCount} appointments processed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getServiceName = (serviceId: number) => {
    const service = (services as any[]).find((s: any) => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const getStaffName = (stylistId: number) => {
    const stylist = (staff as any[]).find((s: any) => s.id === stylistId);
    return stylist?.name || 'Unknown Staff';
  };

  const handleSingleApprove = (appointment: Appointment) => {
    approveAppointmentMutation.mutate({ 
      id: appointment.id, 
      notes: operatorNotes || undefined 
    });
  };

  const handleSingleDecline = (appointment: Appointment, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining this appointment.",
        variant: "destructive",
      });
      return;
    }
    declineAppointmentMutation.mutate({ id: appointment.id, reason });
  };

  const handleBulkAction = () => {
    if (selectedAppointments.length === 0) {
      toast({
        title: "No Appointments Selected",
        description: "Please select appointments to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }

    if (bulkAction === 'decline' && !declineReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for declining appointments.",
        variant: "destructive",
      });
      return;
    }

    bulkActionMutation.mutate({
      appointmentIds: selectedAppointments,
      action: bulkAction!,
      reason: bulkAction === 'decline' ? declineReason : undefined,
      notes: bulkAction === 'approve' ? operatorNotes : undefined,
    });
  };

  const toggleAppointmentSelection = (id: number) => {
    setSelectedAppointments(prev => 
      prev.includes(id) 
        ? prev.filter(appointmentId => appointmentId !== id)
        : [...prev, id]
    );
  };

  const selectAllAppointments = () => {
    if (selectedAppointments.length === (appointments as any[]).length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments((appointments as any[]).map((a: Appointment) => a.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>;
      case 'declined':
        return <Badge variant="outline" className="text-red-600 border-red-300">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-40 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-40 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointment Requests</h2>
          <p className="text-gray-600">Review and manage appointment booking requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAppointments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                {selectedAppointments.length} appointment{selectedAppointments.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBulkAction('approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Selected
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setBulkAction('decline')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline Selected
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {bulkAction === 'approve' ? 'Approve' : 'Decline'} Selected Appointments
                      </DialogTitle>
                      <DialogDescription>
                        You are about to {bulkAction} {selectedAppointments.length} appointment{selectedAppointments.length !== 1 ? 's' : ''}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {bulkAction === 'approve' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Operator Notes (Optional)
                          </label>
                          <Textarea
                            value={operatorNotes}
                            onChange={(e) => setOperatorNotes(e.target.value)}
                            placeholder="Add any notes for these appointments..."
                            rows={3}
                          />
                        </div>
                      )}
                      
                      {bulkAction === 'decline' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Decline Reason *
                          </label>
                          <Textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="Please provide a reason for declining these appointments..."
                            rows={3}
                            required
                          />
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleBulkAction}
                          disabled={bulkActionMutation.isPending}
                          variant={bulkAction === 'approve' ? 'default' : 'destructive'}
                        >
                          {bulkActionMutation.isPending ? 'Processing...' : 
                           `${bulkAction === 'approve' ? 'Approve' : 'Decline'} ${selectedAppointments.length} Appointment${selectedAppointments.length !== 1 ? 's' : ''}`}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {(appointments as any[]).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {filterStatus} appointments
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'pending' 
                ? "No pending appointment requests to review."
                : `No ${filterStatus} appointments found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All Checkbox */}
          {filterStatus === 'pending' && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={selectedAppointments.length === (appointments as any[]).length}
                onCheckedChange={selectAllAppointments}
              />
              <span className="text-sm text-gray-700">
                Select all ({(appointments as any[]).length})
              </span>
            </div>
          )}
          
          {(appointments as any[]).map((appointment: Appointment) => (
            <Card key={appointment.id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Selection checkbox for pending appointments */}
                  {filterStatus === 'pending' && (
                    <Checkbox
                      checked={selectedAppointments.includes(appointment.id)}
                      onCheckedChange={() => toggleAppointmentSelection(appointment.id)}
                      className="mt-1"
                    />
                  )}
                  
                  <div className="flex-1 grid md:grid-cols-3 gap-6">
                    {/* Client Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {appointment.clientName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {appointment.clientEmail}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {appointment.clientPhone}
                        </div>
                      </div>
                      {appointment.isDirectBooking && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Direct Booking
                        </Badge>
                      )}
                    </div>

                    {/* Appointment Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(appointment.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div>
                          <strong>Service:</strong> {getServiceName(appointment.serviceId)}
                        </div>
                        <div>
                          <strong>Staff:</strong> {getStaffName(appointment.stylistId)}
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MessageSquare className="h-3 w-3" />
                            Client Notes
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Status</h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      {appointment.status === 'pending' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSingleApprove(appointment)}
                              disabled={approveAppointmentMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                disabled={declineAppointmentMutation.isPending}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Decline Appointment</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for declining this appointment. 
                                  The client will be notified.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Reason for declining (e.g., scheduling conflict, fully booked, etc.)"
                                  value={declineReason}
                                  onChange={(e) => setDeclineReason(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setDeclineReason('')}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => {
                                      handleSingleDecline(appointment, declineReason);
                                      setDeclineReason('');
                                    }}
                                    disabled={!declineReason.trim()}
                                  >
                                    Decline Appointment
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                      
                      {appointment.status === 'approved' && (
                        <div className="space-y-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSelectedTransferAppointment(appointment);
                              setTransferDialogOpen(true);
                            }}
                            data-testid="button-transfer-appointment"
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Transfer Appointment
                          </Button>
                        </div>
                      )}
                      
                      {/* Send to Calendar Button - Available for all appointments */}
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            setSelectedCalendarAppointment(appointment);
                            setCalendarDialogOpen(true);
                          }}
                          data-testid="button-send-calendar"
                        >
                          <CalendarPlus className="h-3 w-3 mr-1" />
                          Send to Calendar
                        </Button>
                      </div>
                      
                      {appointment.status === 'declined' && appointment.declineReason && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">Decline Reason</div>
                          <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                            {appointment.declineReason}
                          </p>
                        </div>
                      )}
                      
                      {appointment.professionalNotes && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 mb-1">Operator Notes</div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {appointment.professionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Appointment Transfer Dialog */}
      {selectedTransferAppointment && (
        <AppointmentTransferDialog
          isOpen={transferDialogOpen}
          onClose={() => {
            setTransferDialogOpen(false);
            setSelectedTransferAppointment(null);
          }}
          appointment={{
            id: String(selectedTransferAppointment.id),
            customerName: selectedTransferAppointment.clientName,
            appointmentDate: selectedTransferAppointment.date,
            startTime: new Date(selectedTransferAppointment.date).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            assignedTo: String(selectedTransferAppointment.stylistId),
          }}
          clientId={clientId}
        />
      )}
      
      {/* Send Calendar Invite Dialog */}
      {selectedCalendarAppointment && (
        <SendCalendarInviteDialog
          isOpen={calendarDialogOpen}
          onClose={() => {
            setCalendarDialogOpen(false);
            setSelectedCalendarAppointment(null);
          }}
          appointment={{
            id: String(selectedCalendarAppointment.id),
            customerName: selectedCalendarAppointment.clientName,
            customerEmail: selectedCalendarAppointment.clientEmail,
            appointmentDate: selectedCalendarAppointment.date,
            startTime: new Date(selectedCalendarAppointment.date).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            serviceName: getServiceName(selectedCalendarAppointment.serviceId),
            notes: selectedCalendarAppointment.notes,
          }}
        />
      )}
    </div>
  );
}