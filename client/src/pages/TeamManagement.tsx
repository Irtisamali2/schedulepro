import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Shield, DollarSign, Home, Calendar, Package, UserPlus, Bot, MapPin, BarChart3, Globe, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TeamMember } from "@shared/schema";

const clientId = "client_1"; // This would come from auth context

const teamMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
  hourlyRate: z.number().min(0).optional(),
  specializations: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  workingHours: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// Define all dashboard tabs with their available permissions
const DASHBOARD_TABS = [
  {
    id: "overview",
    name: "Overview Dashboard",
    icon: Home,
    permissions: [
      { id: "overview.view", name: "View Dashboard", description: "Can view overview and metrics" },
      { id: "overview.export", name: "Export Data", description: "Can export dashboard reports" }
    ]
  },
  {
    id: "appointments",
    name: "Appointments",
    icon: Calendar,
    permissions: [
      { id: "appointments.view", name: "View Appointments", description: "Can view appointment calendar and list" },
      { id: "appointments.create", name: "Create Appointments", description: "Can book new appointments" },
      { id: "appointments.edit", name: "Edit Appointments", description: "Can modify existing appointments" },
      { id: "appointments.delete", name: "Cancel Appointments", description: "Can cancel/delete appointments" },
      { id: "appointments.status", name: "Update Status", description: "Can change appointment status" }
    ]
  },
  {
    id: "services",
    name: "Services & Pricing",
    icon: Package,
    permissions: [
      { id: "services.view", name: "View Services", description: "Can view service catalog and pricing" },
      { id: "services.create", name: "Create Services", description: "Can add new services" },
      { id: "services.edit", name: "Edit Services", description: "Can modify service details and pricing" },
      { id: "services.delete", name: "Delete Services", description: "Can remove services from catalog" }
    ]
  },
  {
    id: "leads",
    name: "Lead Management",
    icon: UserPlus,
    permissions: [
      { id: "leads.view", name: "View Leads", description: "Can view lead pipeline and details" },
      { id: "leads.create", name: "Create Leads", description: "Can add new leads to the system" },
      { id: "leads.edit", name: "Edit Leads", description: "Can update lead information and status" },
      { id: "leads.delete", name: "Delete Leads", description: "Can remove leads from system" },
      { id: "leads.convert", name: "Convert Leads", description: "Can convert leads to appointments" }
    ]
  },
  {
    id: "team",
    name: "Team Management",
    icon: Users,
    permissions: [
      { id: "team.view", name: "View Team", description: "Can view team member list and details" },
      { id: "team.create", name: "Add Team Members", description: "Can invite and add new team members" },
      { id: "team.edit", name: "Edit Team Members", description: "Can modify team member information" },
      { id: "team.delete", name: "Remove Team Members", description: "Can remove team members" },
      { id: "team.permissions", name: "Manage Permissions", description: "Can assign and modify permissions" }
    ]
  },
  {
    id: "ai",
    name: "AI Features",
    icon: Bot,
    permissions: [
      { id: "ai.view", name: "View AI Settings", description: "Can view AI configurations and insights" },
      { id: "ai.configure", name: "Configure AI", description: "Can modify AI voice agent and features" },
      { id: "ai.insights", name: "Access AI Insights", description: "Can view AI-generated business insights" }
    ]
  },
  {
    id: "google",
    name: "Google Business",
    icon: MapPin,
    permissions: [
      { id: "google.view", name: "View Google Profile", description: "Can view Google Business Profile status" },
      { id: "google.manage", name: "Manage Google Profile", description: "Can update Google Business Profile" },
      { id: "google.reviews", name: "Manage Reviews", description: "Can respond to and manage reviews" }
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    icon: BarChart3,
    permissions: [
      { id: "analytics.view", name: "View Analytics", description: "Can view business analytics and reports" },
      { id: "analytics.export", name: "Export Reports", description: "Can export analytical reports" },
      { id: "analytics.advanced", name: "Advanced Analytics", description: "Can access detailed analytics features" }
    ]
  },
  {
    id: "website",
    name: "Website Management",
    icon: Globe,
    permissions: [
      { id: "website.view", name: "View Website", description: "Can preview website and settings" },
      { id: "website.edit", name: "Edit Website", description: "Can modify website content and design" },
      { id: "website.publish", name: "Publish Website", description: "Can publish/unpublish website changes" }
    ]
  },
  {
    id: "settings",
    name: "Business Settings",
    icon: Settings,
    permissions: [
      { id: "settings.view", name: "View Settings", description: "Can view business configuration" },
      { id: "settings.edit", name: "Edit Settings", description: "Can modify business settings" },
      { id: "settings.hours", name: "Manage Hours", description: "Can update operating hours and availability" }
    ]
  }
];

const availableSpecializations = [
  "Hair Cutting", "Hair Coloring", "Manicure", "Pedicure", "Facial", 
  "Massage", "Makeup", "Eyebrow Threading", "Waxing", "Spa Treatments"
];

interface TeamManagementProps {
  hasPermission?: (permission: string) => boolean;
}

export default function TeamManagement({ hasPermission }: TeamManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current team member ID from localStorage to prevent self-deletion
  const getCurrentTeamMemberId = () => {
    try {
      const teamContext = localStorage.getItem("teamMemberContext");
      if (teamContext) {
        const context = JSON.parse(teamContext);
        return context.teamMemberId;
      }
    } catch (error) {
      console.error("Error getting current team member ID:", error);
    }
    return null;
  };

  // Permission helper - defaults to full access if no permission function provided (business owner)
  const canPerform = (permission: string) => {
    return hasPermission ? hasPermission(permission) : true;
  };

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "STAFF",
      hourlyRate: 0,
      specializations: [],
      permissions: [],
      workingHours: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: [`/api/client/${clientId}/team`],
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: Omit<TeamMemberFormData, 'confirmPassword'>) => {
      return apiRequest(`/api/client/${clientId}/team`, "POST", { ...data, clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/team`] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Team member added",
        description: "The team member has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<TeamMemberFormData, 'confirmPassword'> }) => {
      return apiRequest(`/api/client/${clientId}/team/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/team`] });
      setDialogOpen(false);
      setEditingMember(null);
      form.reset();
      toast({
        title: "Team member updated",
        description: "The team member has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/client/${clientId}/team/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/team`] });
      toast({
        title: "Team member removed",
        description: "The team member has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TeamMemberFormData) => {
    // Check if passwords match for new members
    if (!editingMember && data.password !== data.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    // Remove confirmPassword field before submitting
    const { confirmPassword, ...submitData } = data;
    
    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data: submitData });
    } else {
      createMemberMutation.mutate(submitData);
    }
  };

  const handleEdit = (member: TeamMember) => {
    // Check if user has edit permission
    if (!canPerform('team.edit')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit team members.", 
        variant: "destructive"
      });
      return;
    }

    setEditingMember(member);
    form.reset({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role as "ADMIN" | "MANAGER" | "STAFF",
      hourlyRate: member.hourlyRate || 0,
      specializations: member.specializations || [],
      permissions: member.permissions || [],
      workingHours: member.workingHours || "",
      password: "",
      confirmPassword: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Prevent team members from deleting their own accounts
    const currentTeamMemberId = getCurrentTeamMemberId();
    if (currentTeamMemberId === id) {
      toast({
        title: "Access Denied",
        description: "You cannot delete your own account. Please contact your administrator.",
        variant: "destructive"
      });
      return;
    }

    // Check if user has delete permission
    if (!canPerform('team.delete')) {
      toast({
        title: "Access Denied", 
        description: "You don't have permission to delete team members.",
        variant: "destructive"
      });
      return;
    }

    if (confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(id);
    }
  };

  const filteredMembers = (teamMembers as TeamMember[]).filter((member: TeamMember) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Shield className="h-4 w-4" />;
      case "MANAGER": return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-800";
      case "MANAGER": return "bg-blue-100 text-blue-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-600">
            {canPerform('team.edit') || canPerform('team.create') || canPerform('team.delete')
              ? "Manage your team members, roles, and permissions"
              : "View team members and their information"
            }
          </p>
        </div>
        
        {canPerform('team.create') && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingMember(null);
                  form.reset();
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
          
            <DialogContent className="max-w-2xl flex flex-col p-0" style={{ maxHeight: '90dvh' } as React.CSSProperties}>
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </DialogTitle>
              <DialogDescription>
                {editingMember ? "Update team member information and permissions." : "Add a new team member with their role and permissions."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormDescription>
                          This password will be used for team member login
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Hourly Rate (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="25.00"
                              className="pl-10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Used for payroll and commission calculations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel className="text-base font-medium">Specializations</FormLabel>
                  <FormDescription className="mb-3">
                    Select the services this team member specializes in
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSpecializations.map((spec) => (
                      <FormField
                        key={spec}
                        control={form.control}
                        name="specializations"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(spec)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, spec]);
                                  } else {
                                    field.onChange(field.value?.filter((val) => val !== spec));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {spec}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel className="text-base font-medium">Dashboard Permissions</FormLabel>
                  <FormDescription className="mb-4">
                    Select which dashboard tabs and operations this team member can access
                  </FormDescription>
                  <div className="space-y-6">
                    {DASHBOARD_TABS.map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <div key={tab.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium text-gray-900">{tab.name}</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {tab.permissions.map((permission) => (
                              <FormField
                                key={permission.id}
                                control={form.control}
                                name="permissions"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, permission.id]);
                                          } else {
                                            field.onChange(field.value?.filter((val) => val !== permission.id));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1">
                                      <FormLabel className="text-sm font-medium">
                                        {permission.name}
                                      </FormLabel>
                                      <p className="text-xs text-gray-500">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="workingHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Hours (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Monday-Friday: 9:00 AM - 5:00 PM&#10;Saturday: 10:00 AM - 3:00 PM"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe their typical working schedule
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMemberMutation.isPending || updateMemberMutation.isPending}
                  >
                    {createMemberMutation.isPending || updateMemberMutation.isPending ? "Saving..." : editingMember ? "Update" : "Add"} Member
                  </Button>
                </div>
              </form>
            </Form>
            </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-600 text-center mb-6">
              {searchTerm ? "Try adjusting your search criteria" : "Add your first team member to get started"}
            </p>
            {!searchTerm && canPerform('team.create') && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member: TeamMember) => (
            <Card key={member.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge 
                        className={`text-xs ${getRoleBadgeColor(member.role)} mt-1`}
                      >
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  
                  {(canPerform('team.edit') || (canPerform('team.delete') && getCurrentTeamMemberId() !== member.id)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canPerform('team.edit') && (
                        <DropdownMenuItem onClick={() => handleEdit(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canPerform('team.delete') && getCurrentTeamMemberId() !== member.id && (
                        <DropdownMenuItem 
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    {member.phone && (
                      <p className="text-sm text-gray-600">{member.phone}</p>
                    )}
                  </div>

                  {member.hourlyRate && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        ${member.hourlyRate}/hour
                      </span>
                    </div>
                  )}

                  {member.specializations && member.specializations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Specializations:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specializations.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {member.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.specializations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-gray-600">
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.permissions?.length || 0} permissions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}