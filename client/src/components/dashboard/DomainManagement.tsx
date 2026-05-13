import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Check, X, AlertTriangle, Loader2, Eye, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import type { DomainConfiguration } from "@shared/schema";

const clientId = "client_1"; // This would come from auth context

const domainFormSchema = z.object({
  domain: z.string().min(1, "Domain is required").refine(
    (domain) => {
      // Basic domain validation
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      return domainRegex.test(domain);
    },
    "Please enter a valid domain (e.g., yourbusiness.com)"
  ),
  domainType: z.enum(["ADMIN_PANEL", "CLIENT_WEBSITE"]),
  subdomain: z.string().optional(),
  redirectToHttps: z.boolean().default(true),
});

type DomainFormData = z.infer<typeof domainFormSchema>;

function DomainManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domain: "",
      domainType: "CLIENT_WEBSITE",
      subdomain: "",
      redirectToHttps: true,
    },
  });

  // Fetch domains
  const { data: domains = [], isLoading: isLoadingDomains } = useQuery<DomainConfiguration[]>({
    queryKey: [`/api/clients/${clientId}/domains`],
  });

  // Create domain mutation
  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return await apiRequest(`/api/clients/${clientId}/domains`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'domains'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'domains'] });
      toast({
        title: "Verification Complete",
        description: "Domain verification successful!",
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
      queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'domains'] });
      toast({
        title: "Domain Removed",
        description: "Domain configuration has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove domain",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DomainFormData) => {
    createDomainMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Verified</Badge>;
      case "PENDING":
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDomainTypeBadge = (type: string) => {
    switch (type) {
      case "ADMIN_PANEL":
        return <Badge variant="outline">Admin Panel</Badge>;
      case "CLIENT_WEBSITE":
        return <Badge variant="secondary">Client Website</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-center">
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
                    Add a custom domain to your business. Make sure you own this domain and can configure DNS records.
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
          ) : domains && domains.length > 0 ? (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="border rounded-lg p-4 space-y-3" data-testid={`domain-${domain.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium" data-testid={`text-domain-${domain.id}`}>
                          {domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain}
                        </h3>
                        {getDomainTypeBadge(domain.domainType)}
                        {getStatusBadge(domain.verificationStatus || 'UNKNOWN')}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Added on {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {domain.verificationStatus === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => verifyDomainMutation.mutate(domain.id)}
                          disabled={verifyDomainMutation.isPending}
                          data-testid={`button-verify-${domain.id}`}
                        >
                          {verifyDomainMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Verify
                        </Button>
                      )}
                      {domain.verificationStatus === "VERIFIED" && domain.isActive && (
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={`https://${domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            data-testid={`link-visit-${domain.id}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visit
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDomainMutation.mutate(domain.id)}
                        disabled={deleteDomainMutation.isPending}
                        data-testid={`button-delete-${domain.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {domain.verificationStatus === "PENDING" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-2">DNS Verification Required</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Add this TXT record to your domain's DNS settings:
                      </p>
                      <div className="bg-white border rounded p-2 font-mono text-sm">
                        <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-600 mb-1">
                          <span>Type</span>
                          <span>Name</span>
                          <span>Value</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <span>TXT</span>
                          <span>_scheduled-verification</span>
                          <span className="break-all">{domain.verificationToken || 'N/A'}</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        It may take up to 24 hours for DNS changes to propagate. Click "Verify" once you've added the record.
                      </p>
                    </div>
                  )}

                  {domain.verificationStatus === "FAILED" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-900 mb-1">Verification Failed</h4>
                      <p className="text-sm text-red-800">
                        We couldn't find the required DNS record. Please check your DNS configuration and try again.
                      </p>
                    </div>
                  )}

                  {domain.verificationStatus === "VERIFIED" && !domain.isActive && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-medium text-yellow-900 mb-1">Domain Verified but Inactive</h4>
                      <p className="text-sm text-yellow-800">
                        Your domain is verified but not yet active. Contact support if you need assistance.
                      </p>
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
          <CardDescription>How to set up custom domains for your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">For Client Websites:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Use your main business domain (e.g., yourbusiness.com)</li>
              <li>• Customers will visit your website at this domain</li>
              <li>• Perfect for professional branding and SEO</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">For Admin Panel:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Use a subdomain like app.yourbusiness.com</li>
              <li>• Access your dashboard at this custom URL</li>
              <li>• Provides a professional admin experience</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">DNS Setup:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Add the TXT record for verification</li>
              <li>• Point your domain to our servers with a CNAME record</li>
              <li>• SSL certificates are automatically provisioned</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DomainManagement;