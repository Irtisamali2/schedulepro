import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, FileSpreadsheet, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GlossGeniusExportProps {
  clientId: string;
}

export default function GlossGeniusExport({ clientId }: GlossGeniusExportProps) {
  const [open, setOpen] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportMode, setExportMode] = useState<"selected" | "all">("selected");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: [`/api/client/${clientId}/appointments`],
    enabled: open,
  });

  const resetForm = () => {
    setSelectedAppointments([]);
    setDateFrom("");
    setDateTo("");
    setExportMode("selected");
  };

  const handleSelectAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map((apt: any) => apt.id));
    }
  };

  const handleToggleAppointment = (appointmentId: string) => {
    if (selectedAppointments.includes(appointmentId)) {
      setSelectedAppointments(selectedAppointments.filter(id => id !== appointmentId));
    } else {
      setSelectedAppointments([...selectedAppointments, appointmentId]);
    }
  };

  const downloadCSV = async () => {
    setIsExporting(true);
    try {
      const endpoint = exportMode === "selected"
        ? `/api/client/${clientId}/export/glossgenius/csv`
        : `/api/client/${clientId}/export/glossgenius/csv/all`;

      const params = new URLSearchParams();
      if (exportMode === "selected") {
        params.append("appointmentIds", selectedAppointments.join(","));
      } else {
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
      }

      const response = await fetch(`${endpoint}?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Get the CSV content
      const csvContent = await response.text();

      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `glossgenius_appointments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV Export Successful!",
        description: `Downloaded ${exportMode === "selected" ? selectedAppointments.length : "all"} appointment(s) as CSV file.`,
      });

      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportMode === "selected" && selectedAppointments.length === 0) {
      toast({
        variant: "destructive",
        title: "No Appointments Selected",
        description: "Please select at least one appointment to export",
      });
      return;
    }

    downloadCSV();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to GlossGenius
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Appointments to GlossGenius (CSV)</DialogTitle>
          <DialogDescription>
            Download your appointments as a CSV file compatible with GlossGenius's import format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Import into GlossGenius</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="font-medium">After downloading the CSV file:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                <li>Email the CSV file to: <span className="font-mono font-semibold">support@glossgenius.com</span></li>
                <li>Or call/text: <span className="font-mono font-semibold">1-888-979-7864</span></li>
                <li>Request their FREE WhiteGlove data transfer service</li>
                <li>GlossGenius team will import your data within 1-2 business days</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Export Mode */}
          <Tabs value={exportMode} onValueChange={(v) => setExportMode(v as "selected" | "all")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selected">Export Selected</TabsTrigger>
              <TabsTrigger value="all">Export All</TabsTrigger>
            </TabsList>

            {/* Selected Mode */}
            <TabsContent value="selected" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Appointments ({selectedAppointments.length} selected)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isExporting || loadingAppointments}
                >
                  {selectedAppointments.length === appointments.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              {loadingAppointments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : appointments.length === 0 ? (
                <Alert>
                  <AlertDescription>No appointments found to export.</AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  <div className="space-y-2">
                    {appointments.map((appointment: any) => (
                      <div
                        key={appointment.id}
                        className="flex items-center space-x-3 p-3 border rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleToggleAppointment(appointment.id)}
                      >
                        <Checkbox
                          checked={selectedAppointments.includes(appointment.id)}
                          onCheckedChange={() => handleToggleAppointment(appointment.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{appointment.customerName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.serviceId ? 'Service' : 'N/A'} • {appointment.appointmentDate} at {appointment.startTime}
                          </div>
                        </div>
                        <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* All Mode */}
            <TabsContent value="all" className="space-y-4">
              <Alert>
                <AlertDescription>
                  Export all appointments. Optionally filter by date range.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date (Optional)</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={isExporting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date (Optional)</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={isExporting}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {loadingAppointments ? (
                  "Loading appointments..."
                ) : (
                  `Total appointments: ${appointments.length}`
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* CSV Format Info */}
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              <p className="font-medium">CSV file will include:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Client Name, Email, Phone</li>
                <li>Service Name, Duration, Price</li>
                <li>Appointment Date, Time, Status</li>
                <li>Notes and additional details</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || (exportMode === "selected" && selectedAppointments.length === 0)}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating CSV...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download CSV ({exportMode === "selected" ? selectedAppointments.length : "All"} Appointment{exportMode === "selected" && selectedAppointments.length !== 1 ? "s" : exportMode === "all" ? "s" : ""})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
