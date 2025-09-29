import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PlanFromAPI {
  id: string;
  name: string;
  monthlyPrice: number;
  features: string[];
  maxUsers: number;
  storageGB: number;
  isActive: boolean;
}

interface TransformedPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  description: string;
  features: string[];
  limitations: string[];
  highlighted: boolean;
  mostPopular?: boolean;
  cta: string;
}

export default function Pricing() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TransformedPlan | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Fetch plans from super admin configuration
  const { data: apiPlans = [], isLoading: plansLoading, error } = useQuery<PlanFromAPI[]>({
    queryKey: ['/api/public/plans'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform API plans to UI format
  const pricingPlans: TransformedPlan[] = apiPlans.map((plan, index) => ({
    id: plan.id,
    name: plan.name,
    price: plan.monthlyPrice || 0,
    billingPeriod: "month",
    description: getPlanDescription(plan.name),
    features: plan.features || [],
    limitations: getPlanLimitations(plan.name),
    highlighted: plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('professional'),
    mostPopular: plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('professional'),
    cta: plan.monthlyPrice === 0 ? "Start Free" : `Start ${plan.name}`
  }));

  function getPlanDescription(planName: string): string {
    const name = planName.toLowerCase();
    if (name.includes('free') || name.includes('demo')) {
      return "Perfect for trying out our platform";
    } else if (name.includes('basic')) {
      return "Perfect for individual service providers getting started";
    } else if (name.includes('pro') || name.includes('professional')) {
      return "For growing businesses with multiple service providers";
    } else if (name.includes('enterprise') || name.includes('premium')) {
      return "For larger organizations with advanced needs";
    }
    return "Professional scheduling solution for your business";
  }

  function getPlanLimitations(planName: string): string[] {
    const name = planName.toLowerCase();
    if (name.includes('free') || name.includes('demo')) {
      return ["Limited features", "Basic support", "Trial period"];
    } else if (name.includes('basic')) {
      return ["Basic analytics", "Email support"];
    }
    return [];
  }

  const handleSelectPlan = (plan: TransformedPlan) => {
    setSelectedPlan(plan);
    
    if (plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('premium')) {
      toast({
        title: "Contact our sales team",
        description: "Our team will reach out to discuss your enterprise needs."
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  };
  
  const handlePayment = () => {
    toast({
      title: "Subscription Activated!",
      description: `Your ${selectedPlan?.name} plan is now active. Enjoy using Scheduled!`
    });
    
    setIsPaymentModalOpen(false);
    
    // Redirect to setup
    setTimeout(() => {
      setLocation('/setup');
    }, 1500);
  };

  if (plansLoading) {
    return (
      <section className="py-16 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading pricing plans...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing</h1>
            <p className="text-xl text-red-600">Failed to load pricing plans. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-neutral">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-neutral-600">
            Choose the perfect plan for your business needs. All plans include our core scheduling features.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={plan.id || index} 
              className={`relative overflow-hidden ${
                plan.highlighted ? 'shadow-xl border-primary' : 'shadow-md'
              }`}
              data-testid={`pricing-card-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {plan.mostPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-neutral-600">/{plan.billingPeriod}</span>
                  )}
                  {plan.price === 0 && (
                    <span className="text-neutral-600"> Free</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    What's included
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-sm flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-green-500">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-neutral-500">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Limitations
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="text-sm text-neutral-600 flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-neutral-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                  data-testid={`button-select-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-neutral-600 mb-4">
            All plans include 24/7 support, data migration assistance, and a 30-day money-back guarantee.
          </p>
          <p className="text-sm text-neutral-500">
            Questions about pricing? <a href="/contact" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              You're about to subscribe to the {selectedPlan?.name} plan for ${selectedPlan?.price}/{selectedPlan?.billingPeriod}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            
            <div>
              <Label htmlFor="card">Card information</Label>
              <Input id="card" placeholder="1234 5678 9012 3456" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input placeholder="MM / YY" />
              </div>
              <div>
                <Input placeholder="CVC" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              className="w-full sm:w-auto"
              data-testid="button-complete-payment"
            >
              Complete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}