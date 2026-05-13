import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  LogOut, 
  Calendar, 
  Briefcase, 
  UserPlus, 
  Settings,
  BarChart3,
  Globe,
  Bot,
  MapPin,
  Home
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  clientId: string;
}

interface Client {
  id: string;
  businessName: string;
  businessType: string;
  email: string;
}

interface TeamSession {
  teamMember: TeamMember;
  client: Client;
  loginTime: string;
}

const permissionIcons = {
  'overview': Home,
  'appointments': Calendar,
  'services': Briefcase,
  'leads': UserPlus,
  'team': Users,
  'ai_features': Bot,
  'google_business': MapPin,
  'analytics': BarChart3,
  'website': Globe,
  'settings': Settings
};

const permissionLabels = {
  'overview': 'Overview',
  'appointments': 'Appointments',
  'services': 'Services',
  'leads': 'Leads',
  'team': 'Team Management',
  'ai_features': 'AI Features',
  'google_business': 'Google Business',
  'analytics': 'Analytics',
  'website': 'Website',
  'settings': 'Settings'
};

export default function TeamDashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<TeamSession | null>(null);
  const { toast } = useToast();

  // Check if team member has permission for a specific action
  const hasPermission = (permission: string) => {
    if (!session?.teamMember?.permissions) return false;
    return session.teamMember.permissions.includes(permission);
  };

  // Check if team member can access a specific section
  const canAccessSection = (section: string) => {
    const viewPermission = `${section}.view`;
    const editPermission = `${section}.edit`;
    const createPermission = `${section}.create`;
    
    return hasPermission(viewPermission) || hasPermission(editPermission) || hasPermission(createPermission);
  };

  useEffect(() => {
    const sessionData = localStorage.getItem("teamMemberSession");
    if (!sessionData) {
      setLocation("/team-login");
      return;
    }

    try {
      const parsedSession = JSON.parse(sessionData);
      setSession(parsedSession);

      // Create team member context immediately for API calls
      if (parsedSession.teamMember && parsedSession.client) {
        const teamContext = {
          teamMemberId: parsedSession.teamMember.id,
          permissions: parsedSession.teamMember.permissions,
          clientId: parsedSession.client.id,
          activeSection: 'overview'
        };
        localStorage.setItem("teamMemberContext", JSON.stringify(teamContext));
      }
    } catch (error) {
      console.error("Error parsing session data:", error);
      setLocation("/team-login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("teamMemberSession");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setLocation("/team-login");
  };

  const getAccessibleSections = () => {
    return Object.keys(permissionLabels).filter(section => canAccessSection(section));
  };

  const navigateToSection = (section: string) => {
    // Navigate to client dashboard with team member context
    localStorage.setItem("teamMemberContext", JSON.stringify({
      teamMemberId: session?.teamMember.id,
      permissions: session?.teamMember.permissions,
      clientId: session?.client.id,
      activeSection: section
    }));

    // Store client data and a clientUser entry so ClientDashboard's auth check passes
    localStorage.setItem('clientData', JSON.stringify(session?.client));
    localStorage.setItem('currentClientId', session?.client.id ?? '');
    localStorage.setItem('clientUser', JSON.stringify({
      id: session?.teamMember.id,
      email: session?.teamMember.email,
      name: session?.teamMember.name,
      role: 'TEAM_MEMBER',
      userType: 'TEAM_MEMBER',
      clientId: session?.client.id,
    }));

    setLocation("/client-dashboard");
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const { teamMember, client } = session;
  const accessibleSections = getAccessibleSections();

  return (
    <div className="bg-gray-50 flex flex-col" style={{ position: 'fixed', inset: 0 }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {teamMember.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{teamMember.name}</h1>
                <p className="text-sm text-gray-600">{client.businessName} • {teamMember.role}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {teamMember.name}!</CardTitle>
              <CardDescription>
                You have access to {accessibleSections.length} dashboard sections based on your role and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{teamMember.role}</Badge>
                <Badge variant="outline">{accessibleSections.length} sections available</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accessible Sections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Dashboard Sections</h2>
          
          {accessibleSections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accessibleSections.map((section) => {
                const Icon = permissionIcons[section as keyof typeof permissionIcons];
                const label = permissionLabels[section as keyof typeof permissionLabels];
                
                const operations = session.teamMember.permissions
                  .filter(p => p.startsWith(`${section}.`))
                  .map(p => p.split('.')[1]);

                return (
                  <Card key={section} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6" onClick={() => navigateToSection(section)}>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{label}</h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {operations.map((op) => (
                          <Badge key={op} variant="outline" className="text-xs">
                            {op}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Permissions</h3>
                <p className="text-gray-600">
                  You don't have access to any dashboard sections yet. Please contact your manager to assign permissions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Permissions Details */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Permissions</CardTitle>
              <CardDescription>
                Detailed view of your access permissions for each dashboard section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMember.permissions.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    teamMember.permissions.reduce((acc, permission) => {
                      const [section, operation] = permission.split('.');
                      if (!acc[section]) acc[section] = [];
                      acc[section].push(operation);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([section, operations]) => (
                    <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {permissionIcons[section as keyof typeof permissionIcons] && (
                          <div className="h-8 w-8 bg-blue-100 rounded-md flex items-center justify-center">
                            {(() => {
                              const Icon = permissionIcons[section as keyof typeof permissionIcons];
                              return <Icon className="h-4 w-4 text-blue-600" />;
                            })()}
                          </div>
                        )}
                        <span className="font-medium">{permissionLabels[section as keyof typeof permissionLabels] || section}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {operations.map((operation) => (
                          <Badge key={operation} variant="secondary" className="text-xs">
                            {operation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No permissions assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </div>
  );
}