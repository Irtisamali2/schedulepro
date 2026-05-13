import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Loader2, Trash2, Globe, Copy, ShieldCheck, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
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

interface DomainConfigProps {
  clientId: string;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DnsRecord({ label, type, name, value }: { label: string; type: string; name: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{type}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="divide-y divide-gray-50">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Name</p>
            <p className="font-mono text-xs text-gray-700 break-all">{name}</p>
          </div>
          <CopyButton value={name.startsWith("@") ? name : name} />
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Value</p>
            <p className="font-mono text-xs text-gray-700 break-all">{value}</p>
          </div>
          <CopyButton value={value} />
        </div>
      </div>
    </div>
  );
}

export default function DomainConfig({ clientId }: DomainConfigProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      domain: "",
      domainType: "CLIENT_WEBSITE",
      subdomain: "",
    },
  });

  const { data: domains = [], isLoading: isLoadingDomains } = useQuery({
    queryKey: [`/api/clients/${clientId}/domains`],
    enabled: !!clientId
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return await apiRequest(`/api/clients/${clientId}/domains`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({ title: "Domain Added", description: "Complete DNS verification to activate your domain." });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add domain", variant: "destructive" });
    },
  });

  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return await apiRequest(`/api/domains/${domainId}/verify`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({ title: "Verification Started", description: "DNS check initiated. This may take a few minutes." });
    },
    onError: (error: any) => {
      toast({ title: "Verification Failed", description: error.message || "Failed to verify domain", variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      return await apiRequest(`/api/domains/${domainId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/domains`] });
      toast({ title: "Domain Removed", description: "Domain has been removed successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Delete Failed", description: error.message || "Failed to remove domain", variant: "destructive" });
    },
  });

  const onSubmit = (data: DomainFormData) => createDomainMutation.mutate(data);

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    VERIFIED: { label: "Verified", className: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
    PENDING:  { label: "Pending",  className: "bg-amber-100 text-amber-700 border-amber-200",  icon: AlertCircle },
    FAILED:   { label: "Failed",   className: "bg-red-100 text-red-700 border-red-200",         icon: AlertCircle },
  };

  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex justify-center">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-domain" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Make sure you own this domain and can configure DNS records.
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
                        <Input placeholder="yourbusiness.com" data-testid="input-domain" {...field} />
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
                            <SelectValue placeholder="Select type" />
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
                      <FormLabel>Subdomain <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Input placeholder="app or www" data-testid="input-subdomain" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-domain">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl" disabled={createDomainMutation.isPending} data-testid="button-save-domain">
                    {createDomainMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Domain
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domain list */}
      {isLoadingDomains ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">Loading domains...</span>
        </div>
      ) : domains && Array.isArray(domains) && domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain: any) => {
            const status = domain.verificationStatus || 'PENDING';
            const cfg = statusConfig[status] || statusConfig.PENDING;
            const StatusIcon = cfg.icon;
            const fullDomain = domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain;

            return (
              <div key={domain.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden" data-testid={`domain-${domain.id}`}>

                {/* Domain header row */}
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 text-sm break-all" data-testid={`text-domain-${domain.id}`}>
                        {fullDomain}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
                        {domain.domainType === 'CLIENT_WEBSITE' ? 'Website' : 'Admin'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Added {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {status !== 'VERIFIED' && (
                      <Button
                        size="sm"
                        onClick={() => verifyDomainMutation.mutate(domain.id)}
                        disabled={verifyDomainMutation.isPending}
                        className="rounded-xl h-8 px-3 text-xs"
                        data-testid={`button-verify-${domain.id}`}
                      >
                        {verifyDomainMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1" />}
                        {!verifyDomainMutation.isPending && "Verify"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteDomainMutation.mutate(domain.id)}
                      disabled={deleteDomainMutation.isPending}
                      className="rounded-xl h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      data-testid={`button-delete-${domain.id}`}
                    >
                      {deleteDomainMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* DNS Records panel */}
                {status !== 'VERIFIED' && (
                  <div className="border-t border-gray-100 bg-blue-50/60 px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-900">DNS Setup Required</p>
                        <p className="text-[11px] text-blue-600">Add these records at your registrar (GoDaddy, Hostinger, etc.)</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <DnsRecord
                        label="For Verification"
                        type="TXT"
                        name={`@ or ${domain.domain}`}
                        value={`scheduled-verify-${domain.id}`}
                      />
                      <DnsRecord
                        label="For Pointing"
                        type="A"
                        name={`@ or ${domain.domain}`}
                        value="34.102.136.180"
                      />
                      {domain.subdomain && (
                        <DnsRecord
                          label="For Subdomain"
                          type="CNAME"
                          name={domain.subdomain}
                          value={domain.domain}
                        />
                      )}
                    </div>

                    <div className="mt-3 bg-blue-100/80 rounded-xl px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-blue-800 mb-1">After adding these records:</p>
                      <ol className="text-[11px] text-blue-700 space-y-0.5 list-decimal list-inside">
                        <li>Wait 5–10 minutes for DNS propagation</li>
                        <li>Tap "Verify" to check your configuration</li>
                        <li>Your domain goes live once verified</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* Verified state */}
                {status === 'VERIFIED' && (
                  <div className="border-t border-gray-100 bg-green-50 px-4 py-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <p className="text-xs text-green-700 font-medium">
                      Live at <span className="font-mono">{fullDomain}</span>
                    </p>
                    <a
                      href={`https://${fullDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-green-600 hover:text-green-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Globe className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No custom domains yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap "Add Domain" to connect your own domain</p>
        </div>
      )}

      {/* Guide card */}
      <Card className="rounded-2xl border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Setup Guide</CardTitle>
          <CardDescription className="text-xs">How custom domains work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Client Website", desc: "Use your main domain (yourbusiness.com) — perfect for branding & SEO" },
            { title: "Admin Panel", desc: "Use a subdomain like app.yourbusiness.com for your dashboard" },
            { title: "DNS Setup", desc: "Add TXT + A records, then click Verify. SSL is provisioned automatically" },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
