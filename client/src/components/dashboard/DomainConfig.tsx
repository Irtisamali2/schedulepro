import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Check, X, AlertTriangle, Loader2, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const domainFormSchema = z.object({
  domain: z.string().min(1, "Domain is required").refine(
    (domain) => {
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      return domainRegex.test(domain);
    },
    "Please enter a valid domain (e.g., yourbusiness.com)"
  ),
  domainType: z.enum(["ADMIN_PANEL", "CLIENT_WEBSITE"]),
  subdomain: z.string().optional(),
});

type DomainFormData = z.infer<typeof domainFormSchema>;

export default function DomainConfig() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get client ID from localStorage (same as ClientDashboard)
  useEffect(() => {
    const storedClient = localStorage.getItem('clientData');
    if (storedClient) {
      const clientData = JSON.parse(storedClient);
      setClientId(clientData.id);
    }
  }, []);

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domain: "",
      domainType: "CLIENT_WEBSITE",
      subdomain: "",
    },
  });

  // Fetch domains
  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: [`/api/clients/${clientId}/domains`],
    enabled: !!clientId
  });

  // Create domain mutation
  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return await apiRequest(`/api/clients/${clientId}/domains`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({
        title: "Domain Added",
        description: "Your domain has been added successfully. Please complete DNS verification.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add domain",
        variant: "destructive",
      });
    },
  });

  // Verify domain mutation
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return await apiRequest(`/api/domains/${domainId}/verify`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({
        title: "Verification Started",
        description: "Domain verification check initiated. This may take a few minutes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify domain",
        variant: "destructive",
      });
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return await apiRequest(`/api/domains/${domainId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({
        title: "Domain Removed",
        description: "Domain has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove domain",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DomainFormData) => {
    createDomainMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Domains</CardTitle>
              <CardDescription>
                Configure custom domains for your admin panel and client websites
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-domain">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Add a custom domain to your business. Make sure you own this domain.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="yourbusiness.com" 
                              data-testid="input-domain"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="domainType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-domain-type">
                                <SelectValue placeholder="Select domain type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CLIENT_WEBSITE">Client Website</SelectItem>
                              <SelectItem value="ADMIN_PANEL">Admin Panel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomain (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="app or www" 
                              data-testid="input-subdomain"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel-domain"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createDomainMutation.isPending}
                        data-testid="button-save-domain"
                      >
                        {createDomainMutation.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Add Domain
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDomains ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading domains...</span>
            </div>
          ) : domains && Array.isArray(domains) && domains.length > 0 ? (
            <div className="space-y-4">
              {domains.map((domain: any) => (
                <div key={domain.id} className="border rounded-lg p-4 space-y-4" data-testid={`domain-${domain.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" data-testid={`text-domain-${domain.id}`}>
                          {domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain}
                        </h3>
                        <Badge variant="outline">{domain.domainType}</Badge>
                        <Badge variant={domain.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                          {domain.verificationStatus || 'PENDING'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added on {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {domain.verificationStatus !== 'VERIFIED' && (
                        <Button 
                          size="sm" 
                          onClick={() => verifyDomainMutation.mutate(domain.id)}
                          disabled={verifyDomainMutation.isPending}
                          data-testid={`button-verify-${domain.id}`}
                        >
                          {verifyDomainMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteDomainMutation.mutate(domain.id)}
                        disabled={deleteDomainMutation.isPending}
                        data-testid={`button-delete-${domain.id}`}
                      >
                        {deleteDomainMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* DNS Verification Instructions */}
                  {domain.verificationStatus !== 'VERIFIED' && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
                        DNS Configuration Required
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Add these DNS records to your domain registrar (GoDaddy, Hostinger, etc.):
                      </p>
                      
                      <div className="space-y-3">
                        {/* Verification TXT Record */}
                        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-xs text-gray-600 dark:text-gray-400">TXT Record (For Verification)</p>
                              <p className="font-mono text-sm">
                                <span className="text-green-600">Name:</span> @ or {domain.domain}
                              </p>
                              <p className="font-mono text-sm">
                                <span className="text-green-600">Value:</span> scheduled-verify-{domain.id}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigator.clipboard.writeText(`scheduled-verify-${domain.id}`)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>

                        {/* A Record for pointing */}
                        <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-mono text-xs text-gray-600 dark:text-gray-400">A Record (For Pointing)</p>
                              <p className="font-mono text-sm">
                                <span className="text-green-600">Name:</span> @ or {domain.domain}
                              </p>
                              <p className="font-mono text-sm">
                                <span className="text-green-600">Value:</span> 34.102.136.180
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigator.clipboard.writeText('34.102.136.180')}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>

                        {domain.subdomain && (
                          <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-mono text-xs text-gray-600 dark:text-gray-400">CNAME Record (For Subdomain)</p>
                                <p className="font-mono text-sm">
                                  <span className="text-green-600">Name:</span> {domain.subdomain}
                                </p>
                                <p className="font-mono text-sm">
                                  <span className="text-green-600">Value:</span> {domain.domain}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => navigator.clipboard.writeText(domain.domain)}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                        <p>💡 After adding these records:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Wait 5-10 minutes for DNS propagation</li>
                          <li>Click the "Verify" button above</li>
                          <li>Once verified, your domain will be live!</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Success message for verified domains */}
                  {domain.verificationStatus === 'VERIFIED' && (
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          Domain verified and active! Your website is now live at {domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No custom domains configured</p>
                <p className="text-sm">Add a custom domain to get started</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Configuration Guide</CardTitle>
          <CardDescription>How to set up custom domains</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">For Client Websites:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Use your main business domain (e.g., yourbusiness.com)</li>
              <li>• Perfect for professional branding and SEO</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Admin Panel:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Use a subdomain like app.yourbusiness.com</li>
              <li>• Provides a professional admin experience</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}