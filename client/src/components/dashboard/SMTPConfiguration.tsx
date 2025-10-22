import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Settings, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Send, TestTube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const smtpConfigSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.number().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535"),
  smtpUsername: z.string().min(1, "Username is required"),
  smtpPassword: z.string().min(1, "Password is required"),
  smtpFromEmail: z.string().email("Valid email address is required"),
  smtpFromName: z.string().min(1, "From name is required"),
  smtpSecure: z.boolean(),
  smtpEnabled: z.boolean()
});

type SMTPConfigFormData = z.infer<typeof smtpConfigSchema>;

interface SMTPConfigResponse {
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  smtpSecure: boolean | null;
  smtpEnabled: boolean | null;
  isConfigured: boolean;
}

interface SMTPConfigurationProps {
  clientId: string;
  hasPermission?: (permission: string) => boolean;
}

export default function SMTPConfiguration({ clientId, hasPermission }: SMTPConfigurationProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Permission helper - defaults to full access if no permission function provided
  const canPerform = (permission: string) => {
    return hasPermission ? hasPermission(permission) : true;
  };

  const { data: smtpConfig, isLoading } = useQuery<SMTPConfigResponse>({
    queryKey: [`/api/client/${clientId}/smtp-config`, refreshKey], // Include refreshKey for forced refetch
    enabled: !!clientId
  });

  const form = useForm<SMTPConfigFormData>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      smtpFromEmail: "",
      smtpFromName: "",
      smtpSecure: true,
      smtpEnabled: false
    }
  });

  // Set form values when config data loads
  useEffect(() => {
    if (smtpConfig) {
      form.setValue("smtpHost", smtpConfig.smtpHost || "");
      form.setValue("smtpPort", smtpConfig.smtpPort || 587);
      form.setValue("smtpUsername", smtpConfig.smtpUsername || "");
      form.setValue("smtpFromEmail", smtpConfig.smtpFromEmail || "");
      form.setValue("smtpFromName", smtpConfig.smtpFromName || "");
      form.setValue("smtpSecure", smtpConfig.smtpSecure ?? true);
      form.setValue("smtpEnabled", smtpConfig.smtpEnabled ?? false);
    }
  }, [smtpConfig, form]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: SMTPConfigFormData) => {
      console.log("📧 SMTP Save: Starting mutation with data:", { 
        enabled: data.smtpEnabled, 
        host: data.smtpHost, 
        port: data.smtpPort 
      });
      return apiRequest(`/api/client/${clientId}/smtp-config`, "PUT", data);
    },
    onSuccess: async (response: any, variables: SMTPConfigFormData) => {
      // Close dialog first
      setIsConfigDialogOpen(false);
      
      // Instead of relying on cache invalidation, manually update the query data
      // Calculate isConfigured based on the saved data
      const isConfigured = !!(variables.smtpHost && variables.smtpPort && variables.smtpUsername && variables.smtpPassword && variables.smtpFromEmail);
      
      // Manually set the query data to force UI update
      queryClient.setQueryData([`/api/client/${clientId}/smtp-config`, refreshKey], {
        smtpHost: variables.smtpHost,
        smtpPort: variables.smtpPort,
        smtpUsername: variables.smtpUsername,
        smtpFromEmail: variables.smtpFromEmail,
        smtpFromName: variables.smtpFromName,
        smtpSecure: variables.smtpSecure,
        smtpEnabled: variables.smtpEnabled,
        isConfigured: isConfigured
      });
      
      // Also trigger a timestamp update to force re-render
      const timestamp = Date.now();
      setRefreshKey(timestamp);
      
      // Set the data for the new timestamp key as well
      queryClient.setQueryData([`/api/client/${clientId}/smtp-config`, timestamp], {
        smtpHost: variables.smtpHost,
        smtpPort: variables.smtpPort,
        smtpUsername: variables.smtpUsername,
        smtpFromEmail: variables.smtpFromEmail,
        smtpFromName: variables.smtpFromName,
        smtpSecure: variables.smtpSecure,
        smtpEnabled: variables.smtpEnabled,
        isConfigured: isConfigured
      });
      
      toast({
        title: "SMTP Configuration Updated",
        description: "Your email settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error("📧 SMTP Save Error:", error);
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to update SMTP configuration",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest(`/api/client/${clientId}/smtp-test`, "POST", { testEmail: email });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Successful",
        description: data.message || "SMTP configuration test passed!",
      });
      setIsTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "SMTP connection test failed",
        variant: "destructive",
      });
    },
  });

  const clearConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/client/${clientId}/smtp-config`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/smtp-config`] });
      // Reset form to default values
      form.reset({
        smtpHost: "",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        smtpFromEmail: "",
        smtpFromName: "",
        smtpSecure: true,
        smtpEnabled: false
      });
      toast({
        title: "Configuration Cleared",
        description: "SMTP configuration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear SMTP configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SMTPConfigFormData) => {
    updateConfigMutation.mutate(data);
  };

  const handleTestConnection = () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }
    setIsTestingConnection(true);
    testConnectionMutation.mutate(testEmail);
    setTimeout(() => setIsTestingConnection(false), 2000);
  };

  const getConnectionStatusBadge = () => {
    if (!smtpConfig) return null;
    
    if (smtpConfig.smtpEnabled && smtpConfig.isConfigured) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (smtpConfig.isConfigured) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Configured (Disabled)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-gray-500">
          <XCircle className="w-3 h-3 mr-1" />
          Not Configured
        </Badge>
      );
    }
  };

  const getCommonProviders = () => [
    {
      name: "Gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: true,
      note: "Requires App Password"
    },
    {
      name: "Outlook/Hotmail",
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: true,
      note: "Use your email credentials"
    },
    {
      name: "Yahoo",
      host: "smtp.mail.yahoo.com",
      port: 587,
      secure: true,
      note: "Requires App Password"
    },
    {
      name: "SendGrid",
      host: "smtp.sendgrid.net",
      port: 587,
      secure: true,
      note: "Use API key as password"
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading SMTP configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="smtp-configuration-section">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>SMTP Email Configuration</CardTitle>
                <CardDescription>
                  Configure your email server to send notifications and confirmations
                </CardDescription>
              </div>
            </div>
            {getConnectionStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Configuration Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SMTP Host</label>
              <p className="text-sm text-gray-600">
                {smtpConfig?.smtpHost || "Not configured"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Port</label>
              <p className="text-sm text-gray-600">
                {smtpConfig?.smtpPort || "Not configured"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <p className="text-sm text-gray-600">
                {smtpConfig?.smtpUsername || "Not configured"}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From Email</label>
              <p className="text-sm text-gray-600">
                {smtpConfig?.smtpFromEmail || "Not configured"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canPerform('settings.manage') && (
              <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-configure-smtp">
                    <Settings className="w-4 h-4 mr-2" />
                    {smtpConfig?.isConfigured ? "Update Configuration" : "Configure SMTP"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>SMTP Email Configuration</DialogTitle>
                    <DialogDescription>
                      Configure your SMTP server settings for sending emails
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* SMTP Enable/Disable */}
                      <FormField
                        control={form.control}
                        name="smtpEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable SMTP Email</FormLabel>
                              <p className="text-sm text-gray-500">
                                Enable custom SMTP server for sending emails
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-smtp-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch('smtpEnabled') && (
                        <>
                          {/* SMTP Host and Port */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="smtpHost"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SMTP Host</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="smtp.gmail.com"
                                      {...field}
                                      data-testid="input-smtp-host"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="smtpPort"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Port</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="587"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        field.onChange(value ? parseInt(value, 10) : undefined);
                                      }}
                                      data-testid="input-smtp-port"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Username and Password */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="smtpUsername"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="your-email@gmail.com"
                                      {...field}
                                      data-testid="input-smtp-username"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="smtpPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Your password or app password"
                                        {...field}
                                        data-testid="input-smtp-password"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                      >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* From Email and Name */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="smtpFromEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>From Email</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="email"
                                      placeholder="noreply@yourbusiness.com"
                                      {...field}
                                      data-testid="input-smtp-from-email"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="smtpFromName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>From Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Your Business Name"
                                      {...field}
                                      data-testid="input-smtp-from-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Security Settings */}
                          <FormField
                            control={form.control}
                            name="smtpSecure"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Use TLS/SSL</FormLabel>
                                  <p className="text-sm text-gray-500">
                                    Enable secure connection (recommended)
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-smtp-secure"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsConfigDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateConfigMutation.isPending}>
                          {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}

            {canPerform('settings.manage') && smtpConfig?.isConfigured && (
              <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-test-smtp">
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Test SMTP Connection</DialogTitle>
                    <DialogDescription>
                      Send a test email to verify your SMTP configuration
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Test Email Address</label>
                      <Input
                        type="email"
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        data-testid="input-test-email"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsTestDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || testConnectionMutation.isPending}
                        data-testid="button-send-test-email"
                      >
                        {isTestingConnection || testConnectionMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {canPerform('settings.manage') && smtpConfig?.isConfigured && (
              <Button
                variant="destructive"
                onClick={() => clearConfigMutation.mutate()}
                disabled={clearConfigMutation.isPending}
                data-testid="button-clear-smtp"
              >
                {clearConfigMutation.isPending ? "Clearing..." : "Clear Configuration"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration Instructions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            How to Configure SMTP Email
          </CardTitle>
          <CardDescription>
            SMTP (Simple Mail Transfer Protocol) enables your application to send automated emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What SMTP Does:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Appointment Confirmations:</strong> Automatically send booking confirmations to customers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Reminders:</strong> Send appointment reminders before scheduled services</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Status Updates:</strong> Notify customers when appointment status changes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Notifications:</strong> Send alerts for new leads, payments, and important events</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Step-by-Step Setup Guide:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm pl-2">
              <li className="pl-2">
                <strong>Choose an Email Provider</strong>
                <p className="text-gray-600 ml-6 mt-1">Select from Gmail, Outlook, or a dedicated service like SendGrid (recommended for business use)</p>
              </li>
              <li className="pl-2">
                <strong>Get SMTP Credentials</strong>
                <ul className="ml-6 mt-1 space-y-1 text-gray-600">
                  <li>• <strong>Gmail:</strong> Enable 2-factor auth, then create an App Password in your Google Account settings</li>
                  <li>• <strong>Outlook:</strong> Use your regular email and password</li>
                  <li>• <strong>SendGrid/Others:</strong> Find SMTP settings in your account dashboard</li>
                </ul>
              </li>
              <li className="pl-2">
                <strong>Enter Configuration</strong>
                <p className="text-gray-600 ml-6 mt-1">Click "Configure SMTP" above and fill in the host, port, username, and password from your provider</p>
              </li>
              <li className="pl-2">
                <strong>Test Connection</strong>
                <p className="text-gray-600 ml-6 mt-1">Send a test email to verify everything works correctly</p>
              </li>
              <li className="pl-2">
                <strong>Enable SMTP</strong>
                <p className="text-gray-600 ml-6 mt-1">Toggle "Enable SMTP Email" to start sending automated emails</p>
              </li>
            </ol>
          </div>

          <Alert className="bg-white border-blue-200">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              <strong>Important:</strong> Gmail limits SMTP to 500 emails/day. For higher volume, consider using SendGrid, 
              Mailgun, or AWS SES which offer generous free tiers and better deliverability for business emails.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Popular Providers Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular SMTP Providers</CardTitle>
          <CardDescription>Quick reference for common email service settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {getCommonProviders().map((provider) => (
              <div key={provider.name} className="text-sm p-2 bg-gray-50 rounded border">
                <div className="font-medium">{provider.name}</div>
                  <div className="text-gray-600">
                    {provider.host}:{provider.port} • {provider.note}
                  </div>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>

      {/* Email Notifications Info */}
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          Once configured, this SMTP server will be used for all email notifications including:
          appointment confirmations, status changes, reminders, and other business communications.
        </AlertDescription>
      </Alert>
    </div>
  );
}