import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar,
  CalendarPlus,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Settings,
  Globe,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Plus,
  Trash2,
  ExternalLink,
  LogOut,
  Menu,
  Home,
  Package,
  Bot,
  MapPin,
  CreditCard,
  Shield,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import TeamManagement from './TeamManagement';
import AIFeatures from './AIFeatures';
import GoogleBusinessSetup from './GoogleBusinessSetup';
import ServicesManagement from '../components/dashboard/ServicesManagement';
import DomainConfig from '../components/dashboard/DomainConfig';
import StripeConfiguration from '../components/dashboard/StripeConfiguration';
import SubscriptionManagement from '../components/dashboard/SubscriptionManagement';
import SMTPConfiguration from '../components/dashboard/SMTPConfiguration';
import SendCalendarInviteDialog from '../components/dashboard/SendCalendarInviteDialog';
import GlossGeniusExport from '../components/dashboard/GlossGeniusExport';

interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessAddress: string;
  industry: string;
  status: string;
  planId: string;
}

interface ClientService {
  id: string;
  clientId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes: string;
  estimatedValue: number;
  convertedToAppointment: boolean;
  createdAt: string;
}

interface DashboardMetrics {
  totalAppointments: number;
  thisMonthAppointments: number;
  thisMonthRevenue: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  conversionRate: number;
}

interface TeamMemberContext {
  teamMemberId: string;
  permissions: string[];
  activeSection?: string;
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<Client | null>(null);
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teamContext, setTeamContext] = useState<TeamMemberContext | null>(null);

  // Check if team member has permission for a specific action
  const hasPermission = (permission: string) => {
    if (!teamContext?.permissions) {
      console.log(`Business owner access: granting permission for ${permission}`);
      return true; // Full access for business owners
    }
    const hasAccess = teamContext.permissions.includes(permission) || teamContext.permissions.includes('*');
    console.log(`Team member permission check for ${permission}: ${hasAccess}`, teamContext.permissions);
    return hasAccess;
  };

  // Check if user is a team member (not the business owner)
  const isTeamMember = () => !!teamContext;
  
  // Modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [selectedCalendarAppointment, setSelectedCalendarAppointment] = useState<Appointment | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  // Edit states
  const [editingService, setEditingService] = useState<ClientService | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Form states
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    durationMinutes: '',
    category: '',
    isActive: true
  });
  
  const [appointmentForm, setAppointmentForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    serviceId: '',
    appointmentDate: '',
    startTime: '',
    status: 'PENDING'
  });
  
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'NEW',
    notes: '',
    estimatedValue: ''
  });

  // Filter states for leads
  const [leadFilters, setLeadFilters] = useState({
    searchText: '',
    source: 'all',
    status: 'all'
  });
  
  const [websiteSettings, setWebsiteSettings] = useState({
    title: '',
    description: '',
    primaryColor: '#3B82F6',
    showServices: true,
    showBooking: true,
    contactEmail: '',
    contactPhone: ''
  });
  
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30
  });

  useEffect(() => {
    // Load client data from localStorage (set during onboarding)
    const storedClient = localStorage.getItem('clientData');
    const storedUser = localStorage.getItem('clientUser');
    
    if (!storedClient || !storedUser) {
      setLocation('/client-login');
      return;
    }
    
    const userData = JSON.parse(storedUser);
    const clientData = JSON.parse(storedClient);
    
    // Check if this is a team member login vs business owner login
    const teamContextData = localStorage.getItem("teamMemberContext");
    const teamSession = localStorage.getItem("teamMemberSession");
    
    // Business owners should never have team member context - they have full access
    if (userData.role === 'CLIENT' || userData.role === 'BUSINESS_OWNER' || userData.userType === 'BUSINESS_OWNER') {
      // Clear any team member context for business owners - they should have full client admin access
      localStorage.removeItem("teamMemberContext");
      localStorage.removeItem("teamMemberSession");
      setTeamContext(null);
      console.log("Business owner/client detected, ensuring full access (no team restrictions)");
    } else if (teamContextData && (userData.role === 'TEAM_MEMBER' || userData.userType === 'TEAM_MEMBER')) {
      // This is a team member - set team context
      try {
        const context = JSON.parse(teamContextData);
        setTeamContext(context);
        
        // Set active view to the team member's assigned section
        if (context.activeSection) {
          setActiveView(context.activeSection);
        }
        console.log("Team member context loaded:", context);
      } catch (error) {
        console.error("Error parsing team context:", error);
      }
    }
    
    setClientData(clientData);
  }, [setLocation]);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: [`/api/client/${clientData?.id}/dashboard`],
    enabled: !!clientData?.id
  });

  const { data: services = [] } = useQuery<ClientService[]>({
    queryKey: [`/api/client/${clientData?.id}/services`],
    enabled: !!clientData?.id
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: [`/api/client/${clientData?.id}/appointments`],
    enabled: !!clientData?.id
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: [`/api/client/${clientData?.id}/leads`],
    enabled: !!clientData?.id
  });

  // Filtered leads based on search and filter criteria - must be after leads is defined
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = leadFilters.searchText === '' || 
      lead.name.toLowerCase().includes(leadFilters.searchText.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadFilters.searchText.toLowerCase()) ||
      lead.phone.includes(leadFilters.searchText);
    
    const matchesSource = leadFilters.source === 'all' || lead.source === leadFilters.source;
    const matchesStatus = leadFilters.status === 'all' || lead.status === leadFilters.status;
    
    return matchesSearch && matchesSource && matchesStatus;
  });
  
  const { data: appointmentSlots = [] } = useQuery<any[]>({
    queryKey: [`/api/client/${clientData?.id}/appointment-slots`],
    enabled: !!clientData?.id
  });

  // Mutations for Services
  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/client/${clientData?.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/services`] });
      setIsServiceModalOpen(false);
      setServiceForm({ name: '', description: '', price: '', durationMinutes: '', category: '', isActive: true });
      toast({ title: 'Service created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create service', variant: 'destructive' });
    }
  });
  
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/client/${clientData?.id}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, price: parseFloat(data.price), durationMinutes: parseInt(data.durationMinutes) })
      });
      if (!response.ok) throw new Error('Failed to update service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/services`] });
      setIsServiceModalOpen(false);
      setEditingService(null);
      toast({ title: 'Service updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update service', variant: 'destructive' });
    }
  });
  
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client/${clientData?.id}/services/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/services`] });
      toast({ title: 'Service deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete service', variant: 'destructive' });
    }
  });
  
  // Mutations for Appointments
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get service details to calculate price and duration
      const selectedService = services.find(service => service.id === data.serviceId);
      const serviceDuration = selectedService?.durationMinutes || 60;
      const servicePrice = selectedService?.price ? parseFloat(selectedService.price.toString().replace(/[^\d.]/g, '')) : 0;
      
      // Calculate end time based on start time + duration
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + serviceDuration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      // Prepare complete appointment data with all required schema fields
      const appointmentData = {
        ...data,
        endTime,
        totalPrice: servicePrice,
        paymentMethod: 'CASH', // Default payment method
        paymentStatus: 'PENDING', // Default payment status
        paymentIntentId: null,
        emailConfirmation: false,
        smsConfirmation: false
      };
      
      const response = await apiRequest(
        `/api/client/${clientData?.id}/appointments`,
        'POST',
        appointmentData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      setIsAppointmentModalOpen(false);
      setAppointmentForm({ customerName: '', customerEmail: '', customerPhone: '', serviceId: '', appointmentDate: '', startTime: '', status: 'PENDING' });
      toast({ title: 'Appointment created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create appointment', variant: 'destructive' });
    }
  });
  
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest(
        `/api/client/${clientData?.id}/appointments/${id}`,
        'PUT',
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      toast({ title: 'Appointment status updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update appointment status', variant: 'destructive' });
    }
  });
  
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  };
  
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(
        `/api/client/${clientData?.id}/appointments/${id}`,
        'PUT',
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      setIsAppointmentModalOpen(false);
      setEditingAppointment(null);
      toast({ title: 'Appointment updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update appointment', variant: 'destructive' });
    }
  });
  
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(
        `/api/client/${clientData?.id}/appointments/${id}`,
        'DELETE'
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      toast({ title: 'Appointment deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete appointment', variant: 'destructive' });
    }
  });
  
  // Mutations for Leads
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/client/${clientData?.id}/leads`, 'POST', { ...data, estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : 0 });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      setIsLeadModalOpen(false);
      setLeadForm({ name: '', email: '', phone: '', source: '', status: 'NEW', notes: '', estimatedValue: '' });
      toast({ title: 'Lead created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create lead', variant: 'destructive' });
    }
  });
  
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/client/${clientData?.id}/leads/${id}`, 'PUT', { ...data, estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : 0 });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      setIsLeadModalOpen(false);
      setEditingLead(null);
      toast({ title: 'Lead updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update lead', variant: 'destructive' });
    }
  });
  
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/client/${clientData?.id}/leads/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/dashboard`] });
      toast({ title: 'Lead deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete lead', variant: 'destructive' });
    }
  });
  
  // Website update mutation
  const updateWebsiteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/client/${clientData?.id}/website`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update website');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Website updated successfully' });
      setIsWebsiteModalOpen(false);
    },
    onError: () => {
      toast({ title: 'Failed to update website', variant: 'destructive' });
    }
  });
  
  // Slot management mutations
  const createSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/client/${clientData?.id}/appointment-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create slot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointment-slots`] });
      toast({ title: 'Time slot added successfully' });
      setSlotForm({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 30 });
    }
  });
  
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await fetch(`/api/client/${clientData?.id}/appointment-slots/${slotId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete slot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientData?.id}/appointment-slots`] });
      toast({ title: 'Time slot deleted successfully' });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('clientData');
    localStorage.removeItem('clientUser');
    setLocation('/');
  };
  
  // Helper functions
  const openServiceModal = (service?: ClientService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        durationMinutes: service.durationMinutes.toString(),
        category: service.category,
        isActive: service.isActive
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', description: '', price: '', durationMinutes: '', category: '', isActive: true });
    }
    setIsServiceModalOpen(true);
  };
  
  const openAppointmentModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setAppointmentForm({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        serviceId: appointment.serviceId,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        status: appointment.status
      });
    } else {
      setEditingAppointment(null);
      setAppointmentForm({ customerName: '', customerEmail: '', customerPhone: '', serviceId: '', appointmentDate: '', startTime: '', status: 'PENDING' });
    }
    setIsAppointmentModalOpen(true);
  };
  
  const openLeadModal = (lead?: Lead) => {
    if (lead) {
      setEditingLead(lead);
      setLeadForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        estimatedValue: lead.estimatedValue?.toString() || ''
      });
    } else {
      setEditingLead(null);
      setLeadForm({ name: '', email: '', phone: '', source: '', status: 'NEW', notes: '', estimatedValue: '' });
    }
    setIsLeadModalOpen(true);
  };
  
  const handleServiceSubmit = () => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceForm });
    } else {
      const serviceData = {
        ...serviceForm,
        clientId: clientData?.id,
        price: parseFloat(serviceForm.price),
        durationMinutes: parseInt(serviceForm.durationMinutes),
        isActive: true
      };
      createServiceMutation.mutate(serviceData);
    }
  };
  
  const handleAppointmentSubmit = () => {
    if (editingAppointment) {
      updateAppointmentMutation.mutate({ id: editingAppointment.id, data: appointmentForm });
    } else {
      createAppointmentMutation.mutate(appointmentForm);
    }
  };
  
  const handleLeadSubmit = () => {
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data: leadForm });
    } else {
      createLeadMutation.mutate(leadForm);
    }
  };
  
  const openWebsitePreview = () => {
    window.open(`/client-website/${clientData?.id}`, '_blank');
  };
  
  const handleCreateSlot = () => {
    if (!slotForm.dayOfWeek && slotForm.dayOfWeek !== 0 || !slotForm.startTime || !slotForm.endTime || !slotForm.slotDuration) {
      toast({ title: 'Please fill in all slot fields', variant: 'destructive' });
      return;
    }
    
    const slotData = {
      ...slotForm,
      clientId: clientData?.id,
      isActive: true
    };
    
    createSlotMutation.mutate(slotData);
  };
  
  // Fetch available time slots when date changes
  useEffect(() => {
    if (appointmentForm.appointmentDate && clientData?.id) {
      fetch(`/api/public/client/${clientData.id}/available-slots?date=${appointmentForm.appointmentDate}`)
        .then(res => res.json())
        .then(slots => setAvailableTimeSlots(slots))
        .catch(err => console.error('Failed to fetch time slots:', err));
    }
  }, [appointmentForm.appointmentDate, clientData?.id]);

  if (!clientData) {
    return <div>Loading...</div>;
  }

  const metrics: DashboardMetrics = (dashboardData as any)?.metrics || {
    totalAppointments: 0,
    thisMonthAppointments: 0,
    thisMonthRevenue: 0,
    totalLeads: 0,
    newLeadsThisMonth: 0,
    conversionRate: 0
  };

  const allMenuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "services", label: "Services", icon: Package },
    { id: "leads", label: "Leads", icon: UserPlus },
    { id: "team", label: "Team", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "email", label: "Email", icon: Mail },
    { id: "ai", label: "AI Features", icon: Bot },
    { id: "google", label: "Google Business", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "website", label: "Website", icon: Globe },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Filter menu items based on team member permissions
  const getFilteredMenuItems = () => {
    if (!isTeamMember()) return allMenuItems; // Full access for business owners
    
    return allMenuItems.filter(item => {
      switch (item.id) {
        case 'overview':
          return hasPermission('overview.view');
        case 'appointments':
          return hasPermission('appointments.view') || hasPermission('appointments.create') || hasPermission('appointments.edit');
        case 'services':
          return hasPermission('services.view') || hasPermission('services.edit');
        case 'leads':
          return hasPermission('leads.view') || hasPermission('leads.create') || hasPermission('leads.edit');
        case 'team':
          return hasPermission('team.view');
        case 'payments':
          return hasPermission('payments.view') || hasPermission('payments.manage');
        case 'email':
          return hasPermission('settings.view') || hasPermission('settings.manage');
        case 'ai':
          return hasPermission('ai_features.view') || hasPermission('ai_features.edit');
        case 'google':
          return hasPermission('google_business.view') || hasPermission('google_business.edit');
        case 'analytics':
          return hasPermission('analytics.view');
        case 'website':
          return hasPermission('website.view') || hasPermission('website.edit');
        case 'settings':
          return hasPermission('settings.view') || hasPermission('settings.edit');
        default:
          return false;
      }
    });
  };

  const menuItems = getFilteredMenuItems();

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`bg-white shadow-lg transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-16 lg:w-16'
      } flex flex-col fixed lg:relative h-full z-50 lg:z-auto ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            {isSidebarOpen && (
              <h2 className="font-bold text-lg text-gray-900">{clientData.businessName}</h2>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Button
                    variant={activeView === item.id ? "default" : "ghost"}
                    className={`w-full justify-start ${!isSidebarOpen ? 'px-2' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
                    {isSidebarOpen && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                    {isTeamMember() && isSidebarOpen && (
                      <Shield className="w-3 h-3 text-blue-500 ml-1" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
          
          {/* Team Member Access Notice */}
          {isTeamMember() && isSidebarOpen && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-xs font-medium">Limited Access Mode</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Access restricted to assigned permissions
              </p>
            </div>
          )}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="outline"
            className={`w-full justify-start ${!isSidebarOpen ? 'px-2' : ''}`}
            onClick={handleLogout}
          >
            <LogOut className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} />
            {isSidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-16">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{clientData.businessName}</h1>
                  <p className="text-sm text-gray-600">
                    {isTeamMember() ? 'Team Member Dashboard' : 'Business Dashboard'}
                    {teamContext && (
                      <span className="ml-2 text-blue-600">• Limited Access</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="capitalize">
                  {clientData.status}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">

            {activeView === "overview" && (
              <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${metrics.thisMonthRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.thisMonthAppointments} appointments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalAppointments}</div>
                  <p className="text-xs text-muted-foreground">
                    All time bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.newLeadsThisMonth}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Leads to appointments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.slice(0, 5).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No appointments yet</p>
                  ) : (
                    <div className="space-y-4">
                      {appointments.slice(0, 5).map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{appointment.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                            </p>
                          </div>
                          <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leads.slice(0, 5).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No leads yet</p>
                  ) : (
                    <div className="space-y-4">
                      {leads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-gray-600">
                              {lead.source} • {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={lead.status === 'CONVERTED' ? 'default' : 'secondary'}>
                            {lead.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
              </div>
            )}

            {activeView === "appointments" && (
              <div className="space-y-6">
            {/* Appointment Slot Management Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Appointment Availability Management</CardTitle>
                  <Dialog open={isSlotModalOpen} onOpenChange={setIsSlotModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Clock className="h-4 w-4 mr-2" />
                        Manage Availability
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Appointment Availability</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Day</Label>
                          <Select value={slotForm.dayOfWeek?.toString()} onValueChange={(value) => setSlotForm(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            step="300"
                            value={slotForm.startTime}
                            onChange={(e) => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            step="300"
                            value={slotForm.endTime}
                            onChange={(e) => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Duration (min)</Label>
                          <Input
                            type="number"
                            step="5"
                            min="5"
                            max="480"
                            value={slotForm.slotDuration}
                            onChange={(e) => setSlotForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) || 30 }))}
                            placeholder="30"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateSlot} className="w-full">
                        Add Time Slot
                      </Button>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <h4 className="font-medium">Current Availability:</h4>
                        {appointmentSlots.length === 0 ? (
                          <p className="text-sm text-gray-500">No availability slots configured</p>
                        ) : (
                          appointmentSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.dayOfWeek]} {slot.startTime}-{slot.endTime} ({slot.slotDuration}min)
                              </span>
                              <Button size="sm" variant="outline" onClick={() => deleteSlotMutation.mutate(slot.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Configure your available appointment times by day of the week. Click "Manage Availability" to set up time slots.</p>
              </CardContent>
            </Card>

            {/* Appointment Booking Section */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Booked Appointments</h2>
              <div className="flex gap-2">
                <GlossGeniusExport clientId={clientData?.id || "1"} />
                <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openAppointmentModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                    <DialogTitle>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={appointmentForm.customerName}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Customer Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={appointmentForm.customerEmail}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Customer Phone</Label>
                      <Input
                        id="customerPhone"
                        value={appointmentForm.customerPhone}
                        onChange={(e) => setAppointmentForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceSelect">Service *</Label>
                      <Select value={appointmentForm.serviceId} onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, serviceId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.price} ({service.durationMinutes}min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appointmentDate">Date *</Label>
                        <Input
                          id="appointmentDate"
                          type="date"
                          value={appointmentForm.appointmentDate}
                          onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime">Time *</Label>
                        <Select value={appointmentForm.startTime} onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, startTime: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimeSlots.length > 0 ? (
                              availableTimeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-slots-available" disabled>No available slots - Configure availability first</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="appointmentStatus">Status</Label>
                      <Select value={appointmentForm.status} onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAppointmentModalOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleAppointmentSubmit}
                        disabled={!appointmentForm.customerName || !appointmentForm.customerEmail || !appointmentForm.serviceId || !appointmentForm.appointmentDate || !appointmentForm.startTime}
                      >
                        {editingAppointment ? 'Update' : 'Create'} Appointment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No appointments scheduled</p>
                    <Button onClick={() => openAppointmentModal()}>Schedule Your First Appointment</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{appointment.customerName}</p>
                          <p className="text-sm text-gray-600">{appointment.customerEmail}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} • {appointment.startTime} - {appointment.endTime}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {getServiceName(appointment.serviceId)} - ${appointment.totalPrice}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : appointment.status === 'PENDING' ? 'secondary' : 'destructive'}>
                            {appointment.status}
                          </Badge>
                          <div className="flex gap-1 ml-2">
                            {appointment.status === 'PENDING' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => updateAppointmentStatusMutation.mutate({ id: appointment.id, status: 'CONFIRMED' })}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => updateAppointmentStatusMutation.mutate({ id: appointment.id, status: 'REJECTED' })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" onClick={() => openAppointmentModal(appointment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCalendarAppointment(appointment);
                                setIsCalendarDialogOpen(true);
                              }}
                              data-testid="button-send-calendar"
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this appointment with {appointment.customerName}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteAppointmentMutation.mutate(appointment.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}

            {activeView === "services" && (
              <ServicesManagement 
                hasPermission={hasPermission}
                clientId={clientData?.id || "client_1"}
              />
            )}

            {activeView === "leads" && (
              <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Leads</h2>
              <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openLeadModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="leadName">Name *</Label>
                      <Input
                        id="leadName"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadEmail">Email *</Label>
                      <Input
                        id="leadEmail"
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadPhone">Phone</Label>
                      <Input
                        id="leadPhone"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadSource">Source</Label>
                      <Select value={leadForm.source} onValueChange={(value) => setLeadForm(prev => ({ ...prev, source: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="social-media">Social Media</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="leadStatus">Status</Label>
                      <Select value={leadForm.status} onValueChange={(value) => setLeadForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="leadNotes">Notes</Label>
                      <Textarea
                        id="leadNotes"
                        value={leadForm.notes}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Lead notes and details..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="leadValue">Estimated Value ($)</Label>
                      <Input
                        id="leadValue"
                        type="number"
                        value={leadForm.estimatedValue}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, estimatedValue: e.target.value }))}
                        placeholder="500.00"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsLeadModalOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleLeadSubmit}
                        disabled={!leadForm.name || !leadForm.email}
                      >
                        {editingLead ? 'Update' : 'Create'} Lead
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Filtering Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search leads by name, email, or phone..."
                  value={leadFilters.searchText}
                  onChange={(e) => setLeadFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={leadFilters.source} onValueChange={(value) => setLeadFilters(prev => ({ ...prev, source: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social-media">Social Media</SelectItem>
                    <SelectItem value="google-search">Google Search</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leadFilters.status} onValueChange={(value) => setLeadFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredLeads.length === 0 ? (leads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No leads captured yet</p>
                    <Button onClick={() => openLeadModal()}>Add Your First Lead</Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No leads match your current filters</p>
                    <Button onClick={() => setLeadFilters({ searchText: '', source: 'all', status: 'all' })}>Clear Filters</Button>
                  </div>
                )) : (
                  <div className="space-y-4">
                    {filteredLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-gray-600">{lead.email} • {lead.phone}</p>
                          <p className="text-sm text-gray-600">
                            Source: {lead.source} • {new Date(lead.createdAt).toLocaleDateString()}
                          </p>
                          {lead.notes && (
                            <p className="text-sm text-gray-500 mt-1">{lead.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={lead.status === 'CONVERTED' ? 'default' : 'secondary'}>
                            {lead.status}
                          </Badge>
                          {lead.estimatedValue > 0 && (
                            <span className="text-sm">${lead.estimatedValue}</span>
                          )}
                          <div className="flex gap-1 ml-2">
                            <Button variant="outline" size="sm" onClick={() => openLeadModal(lead)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the lead for {lead.name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteLeadMutation.mutate(lead.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}

            {activeView === "analytics" && (
              <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Revenue charts coming soon</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Lead source analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
              </div>
            )}

            {activeView === "website" && (
              <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Business Website</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={openWebsitePreview}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Website
                </Button>
                <Dialog open={isWebsiteModalOpen} onOpenChange={setIsWebsiteModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Website Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Website Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="websiteTitle">Website Title</Label>
                        <Input
                          id="websiteTitle"
                          value={websiteSettings.title}
                          onChange={(e) => setWebsiteSettings(prev => ({ ...prev, title: e.target.value }))}
                          placeholder={clientData?.businessName || 'Your Business'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="websiteDescription">Description</Label>
                        <Textarea
                          id="websiteDescription"
                          value={websiteSettings.description}
                          onChange={(e) => setWebsiteSettings(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Welcome to our business..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={websiteSettings.primaryColor}
                          onChange={(e) => setWebsiteSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={websiteSettings.contactEmail}
                            onChange={(e) => setWebsiteSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder={clientData?.email}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPhone">Contact Phone</Label>
                          <Input
                            id="contactPhone"
                            value={websiteSettings.contactPhone}
                            onChange={(e) => setWebsiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                            placeholder={clientData?.phone}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showServices"
                            checked={websiteSettings.showServices}
                            onChange={(e) => setWebsiteSettings(prev => ({ ...prev, showServices: e.target.checked }))}
                          />
                          <Label htmlFor="showServices">Show services on website</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="showBooking"
                            checked={websiteSettings.showBooking}
                            onChange={(e) => setWebsiteSettings(prev => ({ ...prev, showBooking: e.target.checked }))}
                          />
                          <Label htmlFor="showBooking">Enable online booking</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsWebsiteModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => updateWebsiteMutation.mutate(websiteSettings)}>
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Website Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{websiteSettings.title || clientData?.businessName}</h3>
                      <p className="text-sm text-gray-600">{websiteSettings.description || 'Professional services for all your needs'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">✓ Contact Information</p>
                      {websiteSettings.showServices && <p className="text-xs text-gray-500">✓ Service Listings</p>}
                      {websiteSettings.showBooking && <p className="text-xs text-gray-500">✓ Online Booking</p>}
                    </div>
                  </div>
                  <div className="mt-4 text-center space-y-2">
                    <Button variant="outline" onClick={openWebsitePreview}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Website
                    </Button>
                    <br />
                    <Button 
                      variant="default" 
                      onClick={() => setLocation(`/website-builder?clientId=${clientData?.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced Website Builder
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Website Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Public Landing Page</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service Showcase</span>
                      <Badge variant={websiteSettings.showServices ? "default" : "secondary"}>
                        {websiteSettings.showServices ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Online Booking</span>
                      <Badge variant={websiteSettings.showBooking ? "default" : "secondary"}>
                        {websiteSettings.showBooking ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mobile Responsive</span>
                      <Badge variant="default">Yes</Badge>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Website URL:</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      /client-website/{clientData?.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
              </div>
            )}

            {activeView === "settings" && (
              <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" value={clientData?.businessName || ''} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input id="contactPerson" value={clientData?.contactPerson || ''} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={clientData?.email || ''} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={clientData?.phone || ''} readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={clientData?.businessAddress || ''} readOnly />
                  </div>
                </div>
                <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">Edit Information</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Business Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="editBusinessName">Business Name</Label>
                          <Input id="editBusinessName" defaultValue={clientData?.businessName} />
                        </div>
                        <div>
                          <Label htmlFor="editContactPerson">Contact Person</Label>
                          <Input id="editContactPerson" defaultValue={clientData?.contactPerson} />
                        </div>
                        <div>
                          <Label htmlFor="editEmail">Email</Label>
                          <Input id="editEmail" defaultValue={clientData?.email} />
                        </div>
                        <div>
                          <Label htmlFor="editPhone">Phone</Label>
                          <Input id="editPhone" defaultValue={clientData?.phone} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="editAddress">Address</Label>
                          <Input id="editAddress" defaultValue={clientData?.businessAddress} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                          toast({ title: 'Business information updated successfully' });
                          setIsSettingsModalOpen(false);
                        }}>Save Changes</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="w-20 font-medium">{day}</span>
                      <div className="flex items-center gap-2">
                        <Input type="time" defaultValue="09:00" className="w-24" />
                        <span>to</span>
                        <Input type="time" defaultValue="17:00" className="w-24" />
                        <input type="checkbox" defaultChecked={day !== 'Sunday'} className="ml-2" />
                        <span className="text-sm text-gray-600">Open</span>
                      </div>
                    </div>
                  ))}
                  <Button className="mt-4">Save Operating Hours</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Domains</CardTitle>
                <CardDescription>
                  Configure custom domains for your admin panel and client websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainConfig clientId={clientData?.id || ''} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plan Status</p>
                      <p className="text-sm text-gray-600">Current: {clientData?.status}</p>
                    </div>
                    <Badge variant="outline">{clientData?.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Subscription</p>
                      <p className="text-sm text-gray-600">Manage your billing and plan</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      data-testid="button-manage-plan"
                    >
                      Manage Plan
                    </Button>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {activeView === "email" && (
              hasPermission('settings.view') || hasPermission('settings.manage') ? (
                <SMTPConfiguration 
                  clientId={clientData?.id || ''}
                  hasPermission={hasPermission}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-600">You don't have permission to view email settings.</p>
                </div>
              )
            )}

            {activeView === "team" && (
              hasPermission('team.view') ? (
                <TeamManagement hasPermission={hasPermission} />
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-600">You don't have permission to view team management.</p>
                </div>
              )
            )}

            {activeView === "ai" && <AIFeatures />}

            {activeView === "google" && <GoogleBusinessSetup />}

            {activeView === "payments" && (
              <StripeConfiguration 
                clientId={clientData?.id || "client_1"}
                hasPermission={hasPermission}
              />
            )}

          </div>
        </main>
      </div>

      {/* Subscription Management Modal */}
      <SubscriptionManagement
        clientId={clientData?.id || "client_1"}
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Send Calendar Invite Dialog */}
      {selectedCalendarAppointment && (
        <SendCalendarInviteDialog
          isOpen={isCalendarDialogOpen}
          onClose={() => {
            setIsCalendarDialogOpen(false);
            setSelectedCalendarAppointment(null);
          }}
          appointment={{
            id: String(selectedCalendarAppointment.id),
            customerName: selectedCalendarAppointment.customerName,
            customerEmail: selectedCalendarAppointment.customerEmail,
            appointmentDate: selectedCalendarAppointment.appointmentDate,
            startTime: selectedCalendarAppointment.startTime,
            serviceName: getServiceName(selectedCalendarAppointment.serviceId),
          }}
        />
      )}
    </div>
  );
}