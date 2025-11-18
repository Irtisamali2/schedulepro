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

const pricingPlans = [
  {
    name: "Basic",
    price: 29,
    billingPeriod: "month",
    description: "Perfect for individual service providers getting started",
    features: [
      "Up to 50 appointments per month",
      "Client management",
      "Online scheduling",
      "Email notifications",
      "1 industry template"
    ],
    limitations: [
      "Basic analytics",
      "Single user only",
      "Email support"
    ],
    highlighted: false,
    cta: "Start Basic"
  },
  {
    name: "Professional",
    price: 79,
    billingPeriod: "month",
    description: "For growing businesses with multiple service providers",
    features: [
      "Unlimited appointments",
      "Advanced client management",
      "Custom branding options",
      "SMS notifications",
      "All industry templates",
      "Google review automation",
      "Team management (up to 5)",
      "Payment processing integration"
    ],
    limitations: [],
    highlighted: true,
    mostPopular: true,
    cta: "Start Professional"
  },
  {
    name: "Enterprise",
    price: 199,
    billingPeriod: "month",
    description: "For larger organizations with advanced needs",
    features: [
      "Everything in Professional",
      "Unlimited team members",
      "Advanced analytics & reporting",
      "API access",
      "Priority support",
      "Dedicated account manager",
      "Custom integrations",
      "Multi-location support"
    ],
    limitations: [],
    highlighted: false,
    cta: "Contact Sales"
  }
];

export default function Pricing() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof pricingPlans[0] | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleSelectPlan = (plan: typeof pricingPlans[0]) => {
    setSelectedPlan(plan);
    
    if (plan.name === "Enterprise") {
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
              key={index} 
              className={`relative overflow-hidden ${
                plan.highlighted ? 'shadow-xl border-primary' : 'shadow-md'
              }`}
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
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-neutral-600">/{plan.billingPeriod}</span>
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
                        <li key={i} className="text-sm flex items-start text-neutral-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 mt-0.5 text-neutral-400">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
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
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Need a custom solution?</h3>
          <p className="mb-6 text-neutral-600 max-w-2xl mx-auto">
            We offer flexible options for larger organizations with specific requirements. 
            Contact our sales team to discuss your needs.
          </p>
          <Button variant="outline" size="lg">Contact Sales</Button>
        </div>
      </div>
      
      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedPlan?.name} Plan</DialogTitle>
            <DialogDescription>
              Enter your payment details to start your subscription
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="1234 5678 9012 3456" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration Date</Label>
                <Input id="expiration" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="billing-zip">Billing Zip Code</Label>
              <Input id="billing-zip" placeholder="10001" />
            </div>
            
            <div className="mt-2 p-3 bg-neutral-50 rounded-md">
              <div className="flex justify-between text-sm mb-1">
                <span>{selectedPlan?.name} Plan</span>
                <span>${selectedPlan?.price}.00/{selectedPlan?.billingPeriod}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Total</span>
                <span>${selectedPlan?.price}.00</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePayment}>Subscribe Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}