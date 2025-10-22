import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PaymentManagement from "./PaymentManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Plus,
  Eye,
  Edit,
  Trash2,
  LogOut,
  MoreHorizontal,
  AlertCircle,
  Menu,
  BarChart3,
  Settings,
  UserPlus,
  CreditCard,
  Home,
  Globe,
  Star,
  ExternalLink,
  Link,
  Wand2,
  Mail
} from "lucide-react";

interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  status: string;
  plan: string;
  planId?: string;
  monthlyRevenue: number;
  createdAt: string;
  lastLogin: string | null;
}

interface Plan {
  id: string;
  name: string;
  // Support both old and new schema formats
  price?: number; // Old format
  billing?: string; // Old format
  monthlyPrice?: number; // New format
  yearlyPrice?: number; // New format
  monthlyEnabled?: boolean; // New format
  yearlyEnabled?: boolean; // New format
  monthlyDiscount?: number; // New format
  yearlyDiscount?: number; // New format
  features: string[];
  maxUsers: number;
  storageGB: number;
  isActive?: boolean;
  isFreeTrial?: boolean;
  trialDays?: number;
  stripePriceId?: string;
  stripeProductId?: string;
  monthlyStripePriceId?: string;
  yearlyStripePriceId?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string | null;
  status: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalMRR: number;
  totalClients: number;
  activeClients: number;
  churnRate: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    clients: number;
  }>;
}

export default function SuperAdminDashboard() {
  const [activeView, setActiveView] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [clientForm, setClientForm] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessAddress: '',
    industry: '',
    planId: '',
    status: 'TRIAL'
  });
  const [planForm, setPlanForm] = useState({
    name: '',
    // Monthly pricing
    monthlyPrice: 0,
    monthlyDiscount: 0,
    monthlyEnabled: true,
    // Yearly pricing
    yearlyPrice: 0, 
    yearlyDiscount: 0,
    yearlyEnabled: true,
    features: [] as string[],
    maxUsers: 1,
    storageGB: 10,
    stripeIntegration: 'none' as 'none' | 'link_existing' | 'generate_new',
    monthlyStripePriceId: '',
    yearlyStripePriceId: '',
    stripeProductId: ''
  });
  const [newFeature, setNewFeature] = useState('');
  
  // Review platforms state
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  const [showAddPlatformForm, setShowAddPlatformForm] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    name: '',
    displayName: '',
    rating: 5.0,
    maxRating: 5,
    reviewCount: 0,
    logoUrl: '',
    isActive: true,
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  // Helper functions for backwards compatibility
  const getDisplayPrice = (plan: Plan, period: 'monthly' | 'yearly' = 'monthly') => {
    // Handle new schema format
    if (plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined) {
      const basePrice = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      const discount = period === 'monthly' ? plan.monthlyDiscount : plan.yearlyDiscount;
      const enabled = period === 'monthly' ? plan.monthlyEnabled : plan.yearlyEnabled;
      
      if (!enabled || basePrice === undefined) return null;
      
      let price = basePrice;
      if (discount && discount > 0) {
        price = basePrice * (1 - discount / 100);
      }
      return price;
    }
    
    // Handle old schema format (backwards compatibility)
    if (plan.price !== undefined) {
      return plan.price;
    }
    
    return null;
  };

  const getBillingPeriodText = (plan: Plan, period: 'monthly' | 'yearly' = 'monthly') => {
    // Handle new schema format
    if (plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined) {
      return period === 'monthly' ? 'month' : 'year';
    }
    
    // Handle old schema format
    if (plan.billing) {
      return plan.billing.toLowerCase().replace('ly', '');
    }
    
    return 'month';
  };

  const formatPlanPrice = (plan: Plan) => {
    // Free plans
    const monthlyPrice = getDisplayPrice(plan, 'monthly');
    if (monthlyPrice === 0) {
      return plan.isFreeTrial ? 'FREE' : '$0';
    }

    // Check if both monthly and yearly are available
    const yearlyPrice = getDisplayPrice(plan, 'yearly');
    const hasMonthly = plan.monthlyEnabled !== false && monthlyPrice !== null;
    const hasYearly = plan.yearlyEnabled !== false && yearlyPrice !== null;

    if (hasMonthly && hasYearly) {
      return `$${monthlyPrice}/mo • $${yearlyPrice}/yr`;
    } else if (hasYearly) {
      return `$${yearlyPrice}/yr`;
    } else if (hasMonthly) {
      return `$${monthlyPrice}/mo`;
    } else {
      return '$0';
    }
  };

  // Check authentication
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id || user.role !== 'SUPER_ADMIN') {
    window.location.href = '/admin';
    return null;
  }

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients']
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans']
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics/revenue']
  });

  const { data: onboardingSessions = [] } = useQuery<any[]>({
    queryKey: ['/api/onboarding/sessions']
  });

  // Contact messages query
  const { data: contactMessages = [], isLoading: contactMessagesLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact-messages']
  });

  // Review platforms query
  const { data: reviewPlatforms = [], isLoading: reviewPlatformsLoading } = useQuery({
    queryKey: ['/api/review-platforms'],
    queryFn: async () => {
      const response = await fetch('/api/review-platforms');
      if (!response.ok) throw new Error('Failed to fetch review platforms');
      return response.json();
    }
  });

  // Mutations for client management
  const createClientMutation = useMutation({
    mutationFn: async (clientData: typeof clientForm) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/revenue'] });
      setIsAddingClient(false);
      setClientForm({
        businessName: '',
        contactPerson: '',
        email: '',
        phone: '',
        businessAddress: '',
        industry: '',
        planId: '',
        status: 'TRIAL'
      });
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof clientForm> }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/revenue'] });
      setSelectedClient(null);
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/revenue'] });
    }
  });

  // Mutations for plan management
  const createPlanMutation = useMutation({
    mutationFn: async (planData: typeof planForm) => {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      if (!response.ok) throw new Error('Failed to create plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setIsAddingPlan(false);
      setPlanForm({
        name: '',
        monthlyPrice: 0,
        monthlyDiscount: 0,
        monthlyEnabled: true,
        yearlyPrice: 0, 
        yearlyDiscount: 0,
        yearlyEnabled: true,
        features: [],
        maxUsers: 1,
        storageGB: 10,
        stripeIntegration: 'none',
        monthlyStripePriceId: '',
        yearlyStripePriceId: '',
        stripeProductId: ''
      });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<typeof planForm> }) => {
      const response = await fetch(`/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setSelectedPlan(null);
    }
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/plans/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
    }
  });

  // Stripe product generation mutation
  const generateStripeProductMutation = useMutation({
    mutationFn: async (planData: typeof planForm) => {
      const response = await fetch('/api/admin/generate-stripe-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planData.name,
          monthlyPrice: planData.monthlyPrice,
          yearlyPrice: planData.yearlyPrice,
          features: planData.features
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate Stripe product');
      }
      
      return response.json();
    },
    onError: (error: any) => {
      alert(`❌ Error generating Stripe product: ${error.message}`);
    }
  });

  // Stripe subscription management mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ clientId, planId, customerEmail }: { clientId: string; planId: string; customerEmail: string }) => {
      const response = await fetch('/api/admin/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, planId, customerEmail }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      alert(`✅ Subscription created successfully!\n\nPayment link has been sent to the client's email. They need to complete payment to activate their subscription.\n\nSubscription ID: ${data.subscriptionId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setSelectedClient(null); // Close the sheet
    },
    onError: (error: any) => {
      alert(`❌ Error creating subscription: ${error.message}`);
    }
  });

  // Review platform mutations
  const createPlatformMutation = useMutation({
    mutationFn: async (platformData: typeof platformForm) => {
      const response = await fetch('/api/review-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformData)
      });
      if (!response.ok) throw new Error('Failed to create platform');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
      setShowAddPlatformForm(false);
      resetPlatformForm();
    }
  });

  const updatePlatformMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof platformForm }) => {
      const response = await fetch(`/api/review-platforms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update platform');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
      setEditingPlatform(null);
      resetPlatformForm();
    }
  });

  const deletePlatformMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/review-platforms/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete platform');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/admin';
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      if (selectedPlan) {
        setSelectedPlan({
          ...selectedPlan,
          features: [...selectedPlan.features, newFeature.trim()]
        });
      } else {
        setPlanForm({
          ...planForm,
          features: [...planForm.features, newFeature.trim()]
        });
      }
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (selectedPlan) {
      const updatedFeatures = selectedPlan.features.filter((_, i) => i !== index);
      setSelectedPlan({
        ...selectedPlan,
        features: updatedFeatures
      });
    } else {
      const updatedFeatures = planForm.features.filter((_, i) => i !== index);
      setPlanForm({
        ...planForm,
        features: updatedFeatures
      });
    }
  };

  // Review platform helper functions
  const resetPlatformForm = () => {
    setPlatformForm({
      name: '',
      displayName: '',
      rating: 5.0,
      maxRating: 5,
      reviewCount: 0,
      logoUrl: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handlePlatformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlatform) {
      updatePlatformMutation.mutate({ id: editingPlatform.id, data: platformForm });
    } else {
      createPlatformMutation.mutate(platformForm);
    }
  };

  const startEditPlatform = (platform: any) => {
    setEditingPlatform(platform);
    setPlatformForm({
      name: platform.name,
      displayName: platform.displayName,
      rating: platform.rating,
      maxRating: platform.maxRating,
      reviewCount: platform.reviewCount || 0,
      logoUrl: platform.logoUrl || '',
      isActive: platform.isActive,
      sortOrder: platform.sortOrder
    });
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      TRIAL: "bg-yellow-100 text-yellow-800", 
      INACTIVE: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "plans", label: "Plans", icon: CreditCard },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "onboarding", label: "Onboarding", icon: UserPlus },
    { id: "leads", label: "Leads", icon: Mail },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

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
              <h2 className="font-bold text-lg text-gray-900">Admin Panel</h2>
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
                    {isSidebarOpen && item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
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
                  <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                  <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{/* Content goes here */}

            {activeView === "overview" && (
              <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${analyticsLoading ? '...' : analytics?.totalMRR?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly recurring revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clientsLoading ? '...' : clients.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active businesses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clientsLoading ? '...' : clients.filter(c => c.status === 'ACTIVE').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Paying customers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? '...' : analytics?.churnRate?.toFixed(1) || '0.0'}%
                  </div>
                  <p className="text-xs text-muted-foreground">Monthly churn</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Clients</CardTitle>
                  <CardDescription>Latest business signups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clients.slice(0, 5).map((client) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{client.businessName}</p>
                          <p className="text-sm text-gray-600">{client.contactPerson}</p>
                        </div>
                        <Badge className={getStatusBadge(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Monthly revenue by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {plans.map((plan) => {
                      const planClients = clients.filter(c => c.plan === plan.name && c.status === 'ACTIVE');
                      const monthlyPrice = getDisplayPrice(plan, 'monthly') || 0;
                      const planRevenue = planClients.length * monthlyPrice;
                      return (
                        <div key={plan.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-sm text-gray-600">{planClients.length} clients</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${planRevenue.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">monthly</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
              </div>
            )}

            {activeView === "clients" && (
              <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Client Management</h2>
              <Sheet open={isAddingClient} onOpenChange={setIsAddingClient}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Add New Client</SheetTitle>
                    <SheetDescription>
                      Create a new client account and assign them to a plan
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          value={clientForm.businessName}
                          onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                          placeholder="Business Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactPerson">Contact Person *</Label>
                        <Input
                          id="contactPerson"
                          value={clientForm.contactPerson}
                          onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                          placeholder="Full Name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientForm.email}
                        onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                        placeholder="business@example.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <select
                          id="industry"
                          className="w-full p-2 border rounded-md"
                          value={clientForm.industry}
                          onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })}
                        >
                          <option value="">Select Industry</option>
                          <option value="Technology">Technology</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Retail">Retail</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Education">Education</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input
                        id="businessAddress"
                        value={clientForm.businessAddress}
                        onChange={(e) => setClientForm({ ...clientForm, businessAddress: e.target.value })}
                        placeholder="123 Main St, City, State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planId">Plan *</Label>
                        <select
                          id="planId"
                          className="w-full p-2 border rounded-md"
                          value={clientForm.planId}
                          onChange={(e) => setClientForm({ ...clientForm, planId: e.target.value })}
                        >
                          <option value="">Select Plan</option>
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - {formatPlanPrice(plan)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          className="w-full p-2 border rounded-md"
                          value={clientForm.status}
                          onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                        >
                          <option value="TRIAL">Trial</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => createClientMutation.mutate(clientForm)}
                      disabled={createClientMutation.isPending || !clientForm.businessName || !clientForm.contactPerson || !clientForm.email || !clientForm.planId}
                    >
                      {createClientMutation.isPending ? "Creating..." : "Create Client"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingClient(false)}>
                      Cancel
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Business
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clients.map((client) => (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.businessName}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.contactPerson}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {client.plan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadge(client.status)}>
                              {client.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${client.monthlyRevenue.toFixed(2)}/mo
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                                  <SheetHeader>
                                    <SheetTitle>Client Details</SheetTitle>
                                    <SheetDescription>
                                      View and manage client information
                                    </SheetDescription>
                                  </SheetHeader>
                                  {selectedClient && (
                                    <div className="space-y-4 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Business Name</Label>
                                          <p className="font-medium">{selectedClient.businessName}</p>
                                        </div>
                                        <div>
                                          <Label>Contact Person</Label>
                                          <p className="font-medium">{selectedClient.contactPerson}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Email</Label>
                                        <p className="font-medium">{selectedClient.email}</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Plan</Label>
                                          <p className="font-medium">{selectedClient.plan}</p>
                                        </div>
                                        <div>
                                          <Label>Status</Label>
                                          <Badge className={getStatusBadge(selectedClient.status)}>
                                            {selectedClient.status}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Monthly Revenue</Label>
                                        <p className="font-medium">${selectedClient.monthlyRevenue.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <Label>Created</Label>
                                        <p className="font-medium">{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      <div>
                                        <Label>Last Login</Label>
                                        <p className="font-medium">
                                          {selectedClient.lastLogin 
                                            ? new Date(selectedClient.lastLogin).toLocaleDateString()
                                            : 'Never'
                                          }
                                        </p>
                                      </div>
                                      
                                      {/* Stripe Subscription Management */}
                                      <div className="border-t pt-4 mt-4">
                                        <h4 className="font-semibold mb-3 flex items-center">
                                          <CreditCard className="w-4 h-4 mr-2" />
                                          Billing & Subscription
                                        </h4>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center">
                                            <Label>Subscription Status</Label>
                                            <Badge className={selectedClient.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                              {selectedClient.status === 'ACTIVE' ? 'Subscribed' : 'Trial/Inactive'}
                                            </Badge>
                                          </div>
                                          
                                          <div className="flex justify-between items-center">
                                            <Label>Current Plan</Label>
                                            <span className="font-medium">{selectedClient.plan}</span>
                                          </div>
                                          
                                          <div className="flex space-x-2 mt-4">
                                            <Button 
                                              size="sm" 
                                              onClick={() => {
                                                const plan = plans.find(p => p.id === selectedClient.planId);
                                                if (plan && plan.stripePriceId) {
                                                  createSubscriptionMutation.mutate({
                                                    clientId: selectedClient.id,
                                                    planId: selectedClient.planId!,
                                                    customerEmail: selectedClient.email
                                                  });
                                                } else {
                                                  alert('This plan does not have Stripe pricing configured');
                                                }
                                              }}
                                              disabled={createSubscriptionMutation.isPending || selectedClient.status === 'ACTIVE'}
                                              data-testid={`button-charge-client-${selectedClient.id}`}
                                            >
                                              {createSubscriptionMutation.isPending ? 'Creating...' : 'Start Subscription'}
                                            </Button>
                                            
                                            {selectedClient.status === 'ACTIVE' && (
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                  if (confirm(`Cancel subscription for ${selectedClient.businessName}?`)) {
                                                    // TODO: Implement subscription cancellation
                                                    alert('Subscription cancellation feature coming soon');
                                                  }
                                                }}
                                              >
                                                Cancel Subscription
                                              </Button>
                                            )}
                                          </div>
                                          
                                          <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                              Starting a subscription will send a payment link to the client's email.
                                              They must complete payment to activate their subscription.
                                            </AlertDescription>
                                          </Alert>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </SheetContent>
                              </Sheet>
                              
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setSelectedClient(client);
                                    setClientForm({
                                      businessName: client.businessName,
                                      contactPerson: client.contactPerson,
                                      email: client.email,
                                      phone: '',
                                      businessAddress: '',
                                      industry: '',
                                      planId: client.planId || '',
                                      status: client.status
                                    });
                                  }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                                  <SheetHeader>
                                    <SheetTitle>Edit Client</SheetTitle>
                                    <SheetDescription>
                                      Update client information and settings
                                    </SheetDescription>
                                  </SheetHeader>
                                  {selectedClient && (
                                    <div className="space-y-4 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-businessName">Business Name *</Label>
                                          <Input
                                            id="edit-businessName"
                                            value={clientForm.businessName}
                                            onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                                          <Input
                                            id="edit-contactPerson"
                                            value={clientForm.contactPerson}
                                            onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-email">Email *</Label>
                                        <Input
                                          id="edit-email"
                                          type="email"
                                          value={clientForm.email}
                                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="edit-planId">Plan *</Label>
                                          <select
                                            id="edit-planId"
                                            className="w-full p-2 border rounded-md"
                                            value={clientForm.planId}
                                            onChange={(e) => setClientForm({ ...clientForm, planId: e.target.value })}
                                          >
                                            {plans.map((plan) => (
                                              <option key={plan.id} value={plan.id}>
                                                {plan.name} - {formatPlanPrice(plan)}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <Label htmlFor="edit-status">Status</Label>
                                          <select
                                            id="edit-status"
                                            className="w-full p-2 border rounded-md"
                                            value={clientForm.status}
                                            onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                                          >
                                            <option value="TRIAL">Trial</option>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="CANCELLED">Cancelled</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          onClick={() => updateClientMutation.mutate({
                                            id: selectedClient.id,
                                            updates: clientForm
                                          })}
                                          disabled={updateClientMutation.isPending}
                                        >
                                          {updateClientMutation.isPending ? "Updating..." : "Update Client"}
                                        </Button>
                                        <Button variant="outline" onClick={() => setSelectedClient(null)}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </SheetContent>
                              </Sheet>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${client.businessName}?`)) {
                                    deleteClientMutation.mutate(client.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {activeView === "plans" && (
              <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Plan Management</h2>
              <Sheet open={isAddingPlan} onOpenChange={setIsAddingPlan}>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Create New Plan</SheetTitle>
                    <SheetDescription>
                      Design a new subscription plan for your platform
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planName">Plan Name *</Label>
                        <Input
                          id="planName"
                          value={planForm.name}
                          onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                          placeholder="e.g., Starter, Pro, Enterprise"
                        />
                      </div>
                      <div>
                        <Label>Pricing Structure</Label>
                        <p className="text-sm text-gray-500 mb-2">Configure monthly and/or yearly pricing</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxUsers">Max Users *</Label>
                        <Input
                          id="maxUsers"
                          type="number"
                          min="1"
                          value={planForm.maxUsers}
                          onChange={(e) => setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="storageGB">Storage (GB) *</Label>
                        <Input
                          id="storageGB"
                          type="number"
                          min="1"
                          value={planForm.storageGB}
                          onChange={(e) => setPlanForm({ ...planForm, storageGB: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>
                    {/* Monthly Pricing Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Monthly Billing</h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={planForm.monthlyEnabled}
                            onChange={(e) => setPlanForm({ ...planForm, monthlyEnabled: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Enable Monthly</span>
                        </label>
                      </div>
                      {planForm.monthlyEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="monthlyPrice">Monthly Price *</Label>
                            <Input
                              id="monthlyPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              value={planForm.monthlyPrice}
                              onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })}
                              placeholder="29.99"
                            />
                          </div>
                          <div>
                            <Label htmlFor="monthlyDiscount">Discount %</Label>
                            <Input
                              id="monthlyDiscount"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={planForm.monthlyDiscount}
                              onChange={(e) => setPlanForm({ ...planForm, monthlyDiscount: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Yearly Pricing Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Yearly Billing</h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={planForm.yearlyEnabled}
                            onChange={(e) => setPlanForm({ ...planForm, yearlyEnabled: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Enable Yearly</span>
                        </label>
                      </div>
                      {planForm.yearlyEnabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="yearlyPrice">Yearly Price *</Label>
                            <Input
                              id="yearlyPrice"
                              type="number"
                              min="0"
                              step="0.01"
                              value={planForm.yearlyPrice}
                              onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })}
                              placeholder="299.99"
                            />
                          </div>
                          <div>
                            <Label htmlFor="yearlyDiscount">Discount %</Label>
                            <Input
                              id="yearlyDiscount"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={planForm.yearlyDiscount}
                              onChange={(e) => setPlanForm({ ...planForm, yearlyDiscount: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Preview */}
                    {(planForm.monthlyEnabled || planForm.yearlyEnabled) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h5 className="font-semibold text-sm mb-2 text-blue-800">Price Preview</h5>
                        {planForm.monthlyEnabled && (
                          <p className="text-sm text-blue-700">
                            Monthly: ${planForm.monthlyPrice} 
                            {planForm.monthlyDiscount > 0 && (
                              <span> (${(planForm.monthlyPrice * (1 - planForm.monthlyDiscount / 100)).toFixed(2)} after {planForm.monthlyDiscount}% discount)</span>
                            )}
                          </p>
                        )}
                        {planForm.yearlyEnabled && (
                          <p className="text-sm text-blue-700">
                            Yearly: ${planForm.yearlyPrice}
                            {planForm.yearlyDiscount > 0 && (
                              <span> (${(planForm.yearlyPrice * (1 - planForm.yearlyDiscount / 100)).toFixed(2)} after {planForm.yearlyDiscount}% discount)</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <Label>Features</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add a feature..."
                            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                          />
                          <Button type="button" onClick={handleAddFeature} size="sm">
                            Add
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {planForm.features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{feature}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFeature(index)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stripe Integration Section */}
                    <div className="border-t pt-4">
                      <Label>Stripe Integration</Label>
                      <div className="space-y-3 mt-2">
                        <div className="grid grid-cols-1 gap-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="stripeIntegration"
                              value="none"
                              checked={planForm.stripeIntegration === 'none'}
                              onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">No Stripe Integration</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="stripeIntegration"
                              value="link_existing"
                              checked={planForm.stripeIntegration === 'link_existing'}
                              onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                              className="w-4 h-4"
                            />
                            <Link className="w-4 h-4" />
                            <span className="text-sm">Link Existing Stripe Product</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="stripeIntegration"
                              value="generate_new"
                              checked={planForm.stripeIntegration === 'generate_new'}
                              onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                              className="w-4 h-4"
                            />
                            <Wand2 className="w-4 h-4" />
                            <span className="text-sm">Generate New Stripe Product</span>
                          </label>
                        </div>

                        {planForm.stripeIntegration === 'link_existing' && (
                          <div className="space-y-3 pl-6 border-l-2 border-blue-200 bg-blue-50/50 p-3 rounded">
                            <div>
                              <Label htmlFor="stripePriceId">Stripe Price ID *</Label>
                              <Input
                                id="stripePriceId"
                                value={planForm.monthlyStripePriceId}
                                onChange={(e) => setPlanForm({ ...planForm, monthlyStripePriceId: e.target.value })}
                                placeholder="price_1234..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stripeProductId">Stripe Product ID *</Label>
                              <Input
                                id="stripeProductId"
                                value={planForm.stripeProductId}
                                onChange={(e) => setPlanForm({ ...planForm, stripeProductId: e.target.value })}
                                placeholder="prod_1234..."
                                className="mt-1"
                              />
                            </div>
                            <p className="text-xs text-blue-600">
                              Enter the Stripe Price ID and Product ID from your Stripe dashboard
                            </p>
                          </div>
                        )}

                        {planForm.stripeIntegration === 'generate_new' && (
                          <div className="pl-6 border-l-2 border-green-200 bg-green-50/50 p-3 rounded">
                            <div className="flex items-center space-x-2 text-green-700">
                              <Wand2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Auto-Generate Stripe Product</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              A new Stripe product and price will be automatically created based on your plan details
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        if (planForm.stripeIntegration === 'generate_new') {
                          try {
                            const stripeProduct = await generateStripeProductMutation.mutateAsync(planForm);
                            const planWithStripe = {
                              ...planForm,
                              monthlyStripePriceId: stripeProduct.monthlyPriceId || '',
                              yearlyStripePriceId: stripeProduct.yearlyPriceId || '',
                              stripeProductId: stripeProduct.productId
                            };
                            createPlanMutation.mutate(planWithStripe);
                          } catch (error) {
                            // Error already handled in mutation
                          }
                        } else {
                          createPlanMutation.mutate(planForm);
                        }
                      }}
                      disabled={createPlanMutation.isPending || generateStripeProductMutation.isPending || !planForm.name || (planForm.monthlyPrice <= 0 && planForm.yearlyPrice <= 0)}
                    >
                      {generateStripeProductMutation.isPending ? "Generating..." : 
                       createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingPlan(false)}>
                      Cancel
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {plan.name}
                      <Badge className={plan.isFreeTrial ? "bg-green-100 text-green-800" : ""}>{formatPlanPrice(plan)}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {plan.maxUsers} users • {plan.storageGB}GB storage
                      {plan.isFreeTrial && plan.trialDays && (
                        <span className="text-green-600"> • {plan.trialDays} days trial</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="text-sm">• {feature}</div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <span className="text-sm text-gray-600">
                        {clients.filter(c => c.plan === plan.name).length} clients
                      </span>
                      <div className="flex space-x-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedPlan(plan);
                              setPlanForm({
                                name: plan.name,
                                monthlyPrice: plan.monthlyPrice || 0,
                                monthlyDiscount: plan.monthlyDiscount || 0,
                                monthlyEnabled: plan.monthlyEnabled !== false,
                                yearlyPrice: plan.yearlyPrice || 0,
                                yearlyDiscount: plan.yearlyDiscount || 0,
                                yearlyEnabled: plan.yearlyEnabled !== false,
                                features: [...plan.features],
                                maxUsers: plan.maxUsers,
                                storageGB: plan.storageGB,
                                stripeIntegration: (plan.monthlyStripePriceId || plan.yearlyStripePriceId) ? 'link_existing' : 'none',
                                monthlyStripePriceId: plan.monthlyStripePriceId || '',
                                yearlyStripePriceId: plan.yearlyStripePriceId || '',
                                stripeProductId: plan.stripeProductId || ''
                              });
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="w-[400px] sm:w-[540px] max-h-[80vh] overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle>Edit Plan</SheetTitle>
                              <SheetDescription>
                                Update plan details and features
                              </SheetDescription>
                            </SheetHeader>
                            {selectedPlan && (
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="editPlanName">Plan Name *</Label>
                                    <Input
                                      id="editPlanName"
                                      value={planForm.name}
                                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Pricing Structure</Label>
                                    <p className="text-sm text-gray-500">Configure monthly and/or yearly pricing</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="editMaxUsers">Max Users *</Label>
                                    <Input
                                      id="editMaxUsers"
                                      type="number"
                                      min="1"
                                      value={planForm.maxUsers}
                                      onChange={(e) => setPlanForm({ ...planForm, maxUsers: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="editStorageGB">Storage (GB) *</Label>
                                    <Input
                                      id="editStorageGB"
                                      type="number"
                                      min="1"
                                      value={planForm.storageGB}
                                      onChange={(e) => setPlanForm({ ...planForm, storageGB: parseInt(e.target.value) || 1 })}
                                    />
                                  </div>
                                </div>
                                {/* Monthly Pricing Section - Edit */}
                                <div className="border rounded-lg p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm">Monthly Billing</h4>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={planForm.monthlyEnabled}
                                        onChange={(e) => setPlanForm({ ...planForm, monthlyEnabled: e.target.checked })}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">Enable Monthly</span>
                                    </label>
                                  </div>
                                  {planForm.monthlyEnabled && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label htmlFor="editMonthlyPrice">Monthly Price *</Label>
                                        <Input
                                          id="editMonthlyPrice"
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={planForm.monthlyPrice}
                                          onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: parseFloat(e.target.value) || 0 })}
                                          placeholder="29.99"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editMonthlyDiscount">Discount %</Label>
                                        <Input
                                          id="editMonthlyDiscount"
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="1"
                                          value={planForm.monthlyDiscount}
                                          onChange={(e) => setPlanForm({ ...planForm, monthlyDiscount: parseFloat(e.target.value) || 0 })}
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Yearly Pricing Section - Edit */}
                                <div className="border rounded-lg p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm">Yearly Billing</h4>
                                    <label className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={planForm.yearlyEnabled}
                                        onChange={(e) => setPlanForm({ ...planForm, yearlyEnabled: e.target.checked })}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm">Enable Yearly</span>
                                    </label>
                                  </div>
                                  {planForm.yearlyEnabled && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label htmlFor="editYearlyPrice">Yearly Price *</Label>
                                        <Input
                                          id="editYearlyPrice"
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={planForm.yearlyPrice}
                                          onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: parseFloat(e.target.value) || 0 })}
                                          placeholder="299.99"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="editYearlyDiscount">Discount %</Label>
                                        <Input
                                          id="editYearlyDiscount"
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="1"
                                          value={planForm.yearlyDiscount}
                                          onChange={(e) => setPlanForm({ ...planForm, yearlyDiscount: parseFloat(e.target.value) || 0 })}
                                          placeholder="0"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Price Preview - Edit */}
                                {(planForm.monthlyEnabled || planForm.yearlyEnabled) && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <h5 className="font-semibold text-sm mb-2 text-blue-800">Price Preview</h5>
                                    {planForm.monthlyEnabled && (
                                      <p className="text-sm text-blue-700">
                                        Monthly: ${planForm.monthlyPrice} 
                                        {planForm.monthlyDiscount > 0 && (
                                          <span> (${(planForm.monthlyPrice * (1 - planForm.monthlyDiscount / 100)).toFixed(2)} after {planForm.monthlyDiscount}% discount)</span>
                                        )}
                                      </p>
                                    )}
                                    {planForm.yearlyEnabled && (
                                      <p className="text-sm text-blue-700">
                                        Yearly: ${planForm.yearlyPrice}
                                        {planForm.yearlyDiscount > 0 && (
                                          <span> (${(planForm.yearlyPrice * (1 - planForm.yearlyDiscount / 100)).toFixed(2)} after {planForm.yearlyDiscount}% discount)</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <Label>Features</Label>
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add a feature..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                                      />
                                      <Button type="button" onClick={handleAddFeature} size="sm">
                                        Add
                                      </Button>
                                    </div>
                                    <div className="space-y-1">
                                      {planForm.features.map((feature, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                          <span className="text-sm">{feature}</span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveFeature(index)}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Stripe Integration Section - Edit */}
                                <div className="border-t pt-4">
                                  <Label>Stripe Integration</Label>
                                  <div className="space-y-3 mt-2">
                                    <div className="grid grid-cols-1 gap-2">
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          name="editStripeIntegration"
                                          value="none"
                                          checked={planForm.stripeIntegration === 'none'}
                                          onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm">No Stripe Integration</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          name="editStripeIntegration"
                                          value="link_existing"
                                          checked={planForm.stripeIntegration === 'link_existing'}
                                          onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                                          className="w-4 h-4"
                                        />
                                        <Link className="w-4 h-4" />
                                        <span className="text-sm">Link Existing Stripe Product</span>
                                      </label>
                                      <label className="flex items-center space-x-2">
                                        <input
                                          type="radio"
                                          name="editStripeIntegration"
                                          value="generate_new"
                                          checked={planForm.stripeIntegration === 'generate_new'}
                                          onChange={(e) => setPlanForm({ ...planForm, stripeIntegration: e.target.value as any })}
                                          className="w-4 h-4"
                                        />
                                        <Wand2 className="w-4 h-4" />
                                        <span className="text-sm">Generate New Stripe Product</span>
                                      </label>
                                    </div>

                                    {planForm.stripeIntegration === 'link_existing' && (
                                      <div className="space-y-3 pl-6 border-l-2 border-blue-200 bg-blue-50/50 p-3 rounded">
                                        <div>
                                          <Label htmlFor="editStripePriceId">Stripe Price ID *</Label>
                                          <Input
                                            id="editStripePriceId"
                                            value={planForm.monthlyStripePriceId}
                                            onChange={(e) => setPlanForm({ ...planForm, monthlyStripePriceId: e.target.value })}
                                            placeholder="price_1234..."
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="editStripeProductId">Stripe Product ID *</Label>
                                          <Input
                                            id="editStripeProductId"
                                            value={planForm.stripeProductId}
                                            onChange={(e) => setPlanForm({ ...planForm, stripeProductId: e.target.value })}
                                            placeholder="prod_1234..."
                                            className="mt-1"
                                          />
                                        </div>
                                        <p className="text-xs text-blue-600">
                                          Enter the Stripe Price ID and Product ID from your Stripe dashboard
                                        </p>
                                      </div>
                                    )}

                                    {planForm.stripeIntegration === 'generate_new' && (
                                      <div className="pl-6 border-l-2 border-green-200 bg-green-50/50 p-3 rounded">
                                        <div className="flex items-center space-x-2 text-green-700">
                                          <Wand2 className="w-4 h-4" />
                                          <span className="text-sm font-medium">Auto-Generate Stripe Product</span>
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">
                                          A new Stripe product and price will be automatically created based on your plan details
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={async () => {
                                      if (planForm.stripeIntegration === 'generate_new') {
                                        try {
                                          const stripeProduct = await generateStripeProductMutation.mutateAsync(planForm);
                                          const planWithStripe = {
                                            ...planForm,
                                            monthlyStripePriceId: stripeProduct.monthlyPriceId || '',
                              yearlyStripePriceId: stripeProduct.yearlyPriceId || '',
                                            stripeProductId: stripeProduct.productId
                                          };
                                          updatePlanMutation.mutate({
                                            id: selectedPlan.id,
                                            updates: planWithStripe
                                          });
                                        } catch (error) {
                                          // Error already handled in mutation
                                        }
                                      } else {
                                        updatePlanMutation.mutate({
                                          id: selectedPlan.id,
                                          updates: planForm
                                        });
                                      }
                                    }}
                                    disabled={updatePlanMutation.isPending || generateStripeProductMutation.isPending}
                                  >
                                    {generateStripeProductMutation.isPending ? "Generating..." : 
                                     updatePlanMutation.isPending ? "Updating..." : "Update Plan"}
                                  </Button>
                                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the ${plan.name} plan?`)) {
                              deletePlanMutation.mutate(plan.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
              </div>
            )}

            {activeView === "onboarding" && (
              <div className="space-y-6">
            <h2 className="text-2xl font-bold">Onboarding Analytics</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Array.isArray(onboardingSessions) ? onboardingSessions.length : 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Array.isArray(onboardingSessions) ? onboardingSessions.filter((s: any) => s.isCompleted).length : 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Array.isArray(onboardingSessions) && onboardingSessions.length > 0 
                      ? Math.round((onboardingSessions.filter((s: any) => s.isCompleted).length / onboardingSessions.length) * 100)
                      : 0
                    }%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Onboarding Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(onboardingSessions) ? onboardingSessions.slice(0, 10).map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <p className="font-medium">{session.planName}</p>
                        <p className="text-sm text-gray-600">Step {session.currentStep || 1} of 6</p>
                      </div>
                      <div className="text-right">
                        <Badge className={session.isCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {session.isCompleted ? "Completed" : "In Progress"}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : []}
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {activeView === "payments" && <PaymentManagement />}

            {activeView === "client-login" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Client Portal Access</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Client Login Portal</CardTitle>
                    <CardDescription>
                      Direct your existing clients to access their business dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Client Login URL</span>
                      </div>
                      <code className="text-sm bg-white px-2 py-1 rounded border">
                        {window.location.origin}/client-login
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/client-login`);
                        }}
                      >
                        Copy URL
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Demo Client Accounts:</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">ABC Consulting</div>
                          <div className="text-sm text-gray-600">
                            Email: john@abcconsulting.com<br />
                            Password: demo123
                          </div>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.open('/client-login', '_blank')}
                          >
                            Test Login
                          </Button>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">Tech Startup Inc</div>
                          <div className="text-sm text-gray-600">
                            Email: jane@techstartup.com<br />
                            Password: demo123
                          </div>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.open('/client-login', '_blank')}
                          >
                            Test Login
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>New Client Onboarding</CardTitle>
                    <CardDescription>
                      Direct new prospects to start their free trial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Onboarding URL</span>
                      </div>
                      <code className="text-sm bg-white px-2 py-1 rounded border">
                        {window.location.origin}/onboarding
                      </code>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/onboarding`);
                        }}
                      >
                        Copy URL
                      </Button>
                      <Button 
                        size="sm" 
                        className="ml-2"
                        onClick={() => window.open('/onboarding', '_blank')}
                      >
                        Test Onboarding
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "leads" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Website Leads</h2>
                    <p className="text-gray-600">Contact form submissions from your marketing website</p>
                  </div>
                </div>

                {contactMessagesLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-gray-600">Loading leads...</p>
                  </div>
                ) : contactMessages.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                      <p className="text-gray-600">Contact form submissions will appear here when users fill out your website contact form.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {contactMessages.map((message) => (
                      <Card key={message.id} data-testid={`lead-card-${message.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900" data-testid={`lead-name-${message.id}`}>
                                  {message.name}
                                </h3>
                                <Badge 
                                  variant={message.status === 'NEW' ? 'default' : message.status === 'CONTACTED' ? 'secondary' : 'outline'}
                                  data-testid={`lead-status-${message.id}`}
                                >
                                  {message.status || 'NEW'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="space-y-1 mb-3">
                                <p className="text-sm text-gray-600" data-testid={`lead-email-${message.id}`}>
                                  <strong>Email:</strong> {message.email}
                                </p>
                                <p className="text-sm text-gray-600" data-testid={`lead-subject-${message.id}`}>
                                  <strong>Subject:</strong> {message.subject}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Source:</strong> {message.source || 'Website'}
                                </p>
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded-md mb-3">
                                <p className="text-sm text-gray-700" data-testid={`lead-message-${message.id}`}>
                                  {message.message}
                                </p>
                              </div>
                              
                              {message.notes && (
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <p className="text-sm text-blue-700">
                                    <strong>Notes:</strong> {message.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`, '_blank')}
                                data-testid={`lead-email-button-${message.id}`}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeView === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Review Platforms Management</h2>
                    <p className="text-gray-600">Manage Google Reviews, Yelp, Trust Pilot and other review platforms for the landing page</p>
                  </div>
                  <Button 
                    onClick={() => setShowAddPlatformForm(true)} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Platform
                  </Button>
                </div>

                {/* Add/Edit Form */}
                {(showAddPlatformForm || editingPlatform) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingPlatform ? 'Edit Platform' : 'Add New Platform'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePlatformSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Platform Key</Label>
                            <Input
                              id="name"
                              value={platformForm.name}
                              onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                              placeholder="e.g., google, yelp, trustpilot"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                              id="displayName"
                              value={platformForm.displayName}
                              onChange={(e) => setPlatformForm({ ...platformForm, displayName: e.target.value })}
                              placeholder="e.g., Google Reviews"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="rating">Current Rating</Label>
                            <Input
                              id="rating"
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={platformForm.rating}
                              onChange={(e) => setPlatformForm({ ...platformForm, rating: parseFloat(e.target.value) })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxRating">Max Rating</Label>
                            <Input
                              id="maxRating"
                              type="number"
                              min="1"
                              max="10"
                              value={platformForm.maxRating}
                              onChange={(e) => setPlatformForm({ ...platformForm, maxRating: parseInt(e.target.value) })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="reviewCount">Review Count</Label>
                            <Input
                              id="reviewCount"
                              type="number"
                              min="0"
                              value={platformForm.reviewCount}
                              onChange={(e) => setPlatformForm({ ...platformForm, reviewCount: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                            <Input
                              id="logoUrl"
                              value={platformForm.logoUrl}
                              onChange={(e) => setPlatformForm({ ...platformForm, logoUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                            />
                          </div>
                          <div>
                            <Label htmlFor="sortOrder">Sort Order</Label>
                            <Input
                              id="sortOrder"
                              type="number"
                              min="0"
                              value={platformForm.sortOrder}
                              onChange={(e) => setPlatformForm({ ...platformForm, sortOrder: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Label>
                            <Input
                              type="checkbox"
                              checked={platformForm.isActive}
                              onChange={(e) => setPlatformForm({ ...platformForm, isActive: e.target.checked })}
                              className="mr-2"
                            />
                            Active (Show on landing page)
                          </Label>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" disabled={createPlatformMutation.isPending || updatePlatformMutation.isPending}>
                            {editingPlatform ? 'Update' : 'Create'} Platform
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setShowAddPlatformForm(false);
                              setEditingPlatform(null);
                              resetPlatformForm();
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Platforms List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Platforms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewPlatformsLoading ? (
                      <div className="text-center py-8">Loading platforms...</div>
                    ) : reviewPlatforms.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600">No review platforms configured yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviewPlatforms.map((platform: any) => (
                          <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              {platform.logoUrl && (
                                <img src={platform.logoUrl} alt={platform.displayName} className="w-8 h-8 rounded" />
                              )}
                              <div>
                                <h3 className="font-semibold">{platform.displayName}</h3>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <div className="flex text-yellow-400">
                                    {[...Array(Math.floor(platform.rating))].map((_, i) => (
                                      <Star key={i} className="w-3 h-3 fill-current" />
                                    ))}
                                    {platform.rating % 1 !== 0 && (
                                      <Star className="w-3 h-3 fill-current opacity-50" />
                                    )}
                                  </div>
                                  <span>{platform.rating} / {platform.maxRating}</span>
                                  {platform.reviewCount && <span>• {platform.reviewCount} reviews</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={platform.isActive ? "default" : "secondary"}>
                                {platform.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditPlatform(platform)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deletePlatformMutation.mutate(platform.id)}
                                disabled={deletePlatformMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Google Business
                        </a>
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <a href="https://business.yelp.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Yelp Business
                        </a>
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <a href="https://business.trustpilot.com" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Trustpilot Business
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}