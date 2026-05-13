import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Plus, Edit, Trash2, Clock, DollarSign, CreditCard, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { insertServiceSchema, type Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIndustry, getTerminology } from "@/lib/industryContext";

const formSchema = insertServiceSchema.extend({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  durationMinutes: z.number().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  category: z.string().optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
  enableOnlinePayments: z.boolean().default(true),
  stripeIdMode: z.enum(["auto", "manual"]).default("auto")
}).superRefine((data, ctx) => {
  // Conditional validation for manual Stripe ID mode
  if (data.stripeIdMode === "manual" && data.enableOnlinePayments) {
    if (data.stripeProductId && !data.stripeProductId.startsWith("prod_")) {
      ctx.addIssue({
        code: "custom",
        message: "Product ID must start with 'prod_'",
        path: ["stripeProductId"]
      });
    }
    if (data.stripePriceId && !data.stripePriceId.startsWith("price_")) {
      ctx.addIssue({
        code: "custom",
        message: "Price ID must start with 'price_'",
        path: ["stripePriceId"]
      });
    }
    if (!data.stripeProductId || data.stripeProductId.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Product ID is required in manual mode",
        path: ["stripeProductId"]
      });
    }
    if (!data.stripePriceId || data.stripePriceId.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Price ID is required in manual mode",
        path: ["stripePriceId"]
      });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 300, label: "5 hours" },
  { value: 360, label: "6 hours" }
];

interface ServicesManagementProps {
  hasPermission?: (permission: string) => boolean;
  clientId?: string;
}

export default function ServicesManagement({ hasPermission, clientId = "client_1" }: ServicesManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isGeneratingStripe, setIsGeneratingStripe] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedIndustry } = useIndustry();
  const terminology = getTerminology(selectedIndustry.id as any);

  // Permission helper - defaults to full access if no permission function provided
  const canPerform = (permission: string) => {
    return hasPermission ? hasPermission(permission) : true;
  };

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: [`/api/client/${clientId}/services`]
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      durationMinutes: 60,
      category: "",
      stripeProductId: "",
      stripePriceId: "",
      enableOnlinePayments: true,
      stripeIdMode: "auto" as const
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => 
      apiRequest(`/api/client/${clientId}/services`, "POST", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/services`] });
      closeAddDialog();
      toast({
        title: "Service Added",
        description: "Successfully added new service"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add service",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      apiRequest(`/api/client/${clientId}/services/${id}`, "PUT", data).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/services`] });
      closeEditDialog();
      toast({
        title: "Service Updated",
        description: "Successfully updated service"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/client/${clientId}/services/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/services`] });
      toast({
        title: "Service Removed",
        description: "Service has been removed"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Transform price from string to number for API
      let transformedData = {
        ...data,
        price: parseFloat(data.price),
        clientId
      } as any;
      
      // Auto-generate Stripe product/price if in auto mode and online payments enabled
      if (data.stripeIdMode === "auto" && data.enableOnlinePayments && 
          (!data.stripeProductId || !data.stripePriceId || data.stripeProductId.trim() === "" || data.stripePriceId.trim() === "")) {
        
        // Validate required fields for auto-generation
        if (!data.name || !data.description || !data.price) {
          toast({
            title: "Missing Information",
            description: "Please fill out service name, price, and description for auto-generation",
            variant: "destructive"
          });
          return;
        }
        
        try {
          // Auto-generate Stripe product and price
          const generated = await generateStripeMutation.mutateAsync({
            name: data.name,
            price: parseFloat(data.price),
            description: data.description
          });
          
          // Update transformed data with generated IDs
          transformedData.stripeProductId = generated.productId;
          transformedData.stripePriceId = generated.priceId;
          
          toast({
            title: "Stripe Product Created",
            description: "Successfully created Stripe product for online payments"
          });
          
        } catch (generateError: any) {
          console.error("Stripe auto-generation error:", generateError);
          
          // Check if it's a Stripe configuration error
          const errorMessage = generateError.message || "Failed to auto-generate Stripe product";
          
          if (errorMessage.includes("Stripe not configured") || errorMessage.includes("Stripe secret key")) {
            // Allow service creation without Stripe but disable online payments
            transformedData.enableOnlinePayments = false;
            toast({
              title: "Service will be created without online payments",
              description: "Stripe is not configured. You can enable online payments later in Settings.",
              variant: "default"
            });
          } else {
            toast({
              title: "Stripe Setup Issue",
              description: `${errorMessage}. Service will be created without online payments.`,
              variant: "default"
            });
            // Continue without Stripe but disable online payments
            transformedData.enableOnlinePayments = false;
          }
        }
      }
      
      // Proceed with service creation/update based on which dialog is open
      if (isEditDialogOpen && editingService) {
        updateMutation.mutate({ id: editingService.id, data: transformedData });
      } else {
        createMutation.mutate(transformedData);
      }
      
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An error occurred during submission",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
    form.reset({
      name: service.name,
      description: service.description,
      price: service.price.toString(), // Convert number to string for form
      durationMinutes: service.durationMinutes,
      category: service.category || "",
      stripeProductId: (service as any).stripeProductId || "",
      stripePriceId: (service as any).stripePriceId || "",
      enableOnlinePayments: (service as any).enableOnlinePayments ?? true,
      stripeIdMode: (service as any).stripeProductId ? "manual" as const : "auto" as const
    });
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const generateStripeMutation = useMutation({
    mutationFn: async (data: { name: string; price: number; description: string }) => {
      const response = await apiRequest(`/api/client/${clientId}/generate-stripe-product`, "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("stripeProductId", data.productId);
      form.setValue("stripePriceId", data.priceId);
      toast({
        title: "Stripe Product Generated",
        description: "Successfully created new Stripe product and price"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate Stripe product",
        variant: "destructive"
      });
    }
  });

  const handleGenerateStripeProduct = async () => {
    const name = form.watch("name");
    const price = parseFloat(form.watch("price"));
    const description = form.watch("description");

    if (!name || !price || !description) {
      toast({
        title: "Missing Information",
        description: "Please fill out service name, price, and description before generating Stripe product",
        variant: "destructive"
      });
      return;
    }

    generateStripeMutation.mutate({ name, price, description });
  };

  const validateStripeId = (id: string, type: 'product' | 'price') => {
    const prefix = type === 'product' ? 'prod_' : 'price_';
    return id.startsWith(prefix) && id.length > prefix.length;
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    form.reset();
  };
  
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingService(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Services Management</h2>
          <p className="text-sm text-gray-600">
            {canPerform('services.create') || canPerform('services.edit')
              ? "Manage your services, pricing, and durations"
              : "View services and their details"
            }
          </p>
        </div>
        {canPerform('services.create') && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) closeAddDialog(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Add New Service
              </DialogTitle>
              <DialogDescription>
                Add a new service to your business
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter service name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Hair, Nails, Massage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this service includes..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="50" 
                              className="pl-10"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DURATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stripe Integration Section */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <h3 className="text-sm font-medium">Online Payments</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="enableOnlinePayments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-enable-online-payments"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Enable online payments for this service
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Customers can pay online via Stripe when booking this service
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("enableOnlinePayments") && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                      {/* Stripe ID Management Mode Selector */}
                      <FormField
                        control={form.control}
                        name="stripeIdMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Product Setup</FormLabel>
                            <FormControl>
                              <div className="flex gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    value="auto"
                                    checked={field.value === "auto"}
                                    onChange={() => field.onChange("auto")}
                                    className="w-4 h-4 text-primary"
                                    data-testid="radio-stripe-auto"
                                  />
                                  <span className="text-sm">Generate New Product</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    value="manual"
                                    checked={field.value === "manual"}
                                    onChange={() => field.onChange("manual")}
                                    className="w-4 h-4 text-primary"
                                    data-testid="radio-stripe-manual"
                                  />
                                  <span className="text-sm">Link Existing Product</span>
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Auto-Generate Mode */}
                      {form.watch("stripeIdMode") === "auto" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <span>A new Stripe product and price will be created for this service</span>
                          </div>
                          
                          {/* Generate Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateStripeProduct}
                            disabled={generateStripeMutation.isPending}
                            className="w-full"
                            data-testid="button-generate-stripe-product"
                          >
                            {generateStripeMutation.isPending ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Generate Stripe Product Now
                              </>
                            )}
                          </Button>

                          {/* Display Generated IDs */}
                          {(form.watch("stripeProductId") || form.watch("stripePriceId")) && (
                            <div className="grid grid-cols-1 gap-3 p-3 bg-background border rounded-md">
                              <div className="text-xs font-medium text-center mb-2">Generated Stripe IDs</div>
                              {form.watch("stripeProductId") && (
                                <div>
                                  <label className="text-xs font-medium">Product ID</label>
                                  <p className="text-xs text-muted-foreground font-mono break-all">
                                    {form.watch("stripeProductId")}
                                  </p>
                                </div>
                              )}
                              {form.watch("stripePriceId") && (
                                <div>
                                  <label className="text-xs font-medium">Price ID</label>
                                  <p className="text-xs text-muted-foreground font-mono break-all">
                                    {form.watch("stripePriceId")}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual Entry Mode */}
                      {form.watch("stripeIdMode") === "manual" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ExternalLink className="h-4 w-4" />
                            <span>Link to existing Stripe product and price IDs</span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <FormField
                              control={form.control}
                              name="stripeProductId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Product ID</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="prod_xxxxxxxxxx"
                                      {...field}
                                      className={!validateStripeId(field.value || '', 'product') && field.value ? 'border-destructive' : ''}
                                      data-testid="input-stripe-product-id"
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Format: prod_xxxxxxxxxx
                                  </p>
                                  {field.value && !validateStripeId(field.value, 'product') && (
                                    <p className="text-xs text-destructive">Invalid Product ID format</p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="stripePriceId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stripe Price ID</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="price_xxxxxxxxxx"
                                      {...field}
                                      className={!validateStripeId(field.value || '', 'price') && field.value ? 'border-destructive' : ''}
                                      data-testid="input-stripe-price-id"
                                    />
                                  </FormControl>
                                  <p className="text-xs text-muted-foreground">
                                    Format: price_xxxxxxxxxx
                                  </p>
                                  {field.value && !validateStripeId(field.value, 'price') && (
                                    <p className="text-xs text-destructive">Invalid Price ID format</p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              💡 <strong>Tip:</strong> You can find these IDs in your Stripe Dashboard under Products. 
                              The price ID is associated with the specific pricing tier of your product.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={closeAddDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-add-service"
                  >
                    Add Service
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        )}
        
        {/* Separate Edit Dialog */}
        {canPerform('services.edit') && (
          <Dialog open={isEditDialogOpen} onOpenChange={closeEditDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  Edit Service
                </DialogTitle>
                <DialogDescription>
                  Update service information
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter service name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Hair, Nails, Massage" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what this service includes..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="50" 
                                className="pl-10"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select 
                            value={field.value?.toString()} 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DURATION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeEditDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      Update Service
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">{service.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{service.durationMinutes}min</span>
                    </div>
                    {(service as any).enableOnlinePayments && (
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span>Online Pay</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canPerform('services.edit') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canPerform('services.delete') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {service.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Scissors className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Services Yet</h3>
              <p className="text-muted-foreground mb-4">
                {canPerform('services.create') 
                  ? "Add your first service to start taking bookings"
                  : "No services have been created yet"
                }
              </p>
              {canPerform('services.create') && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}