import { useState } from "react";
import { useLocation } from "wouter";
import IndustryTemplates from "@/components/setup/IndustryTemplates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIndustry } from "@/lib/industryContext";

export default function Setup() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectIndustryById } = useIndustry();
  
  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  const handleContinue = () => {
    if (!selectedTemplate) {
      toast({
        title: "Please Select a Template",
        description: "You need to select an industry template to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // Update the selected industry in our context
    selectIndustryById(selectedTemplate);
    
    // Navigate to the dashboard
    setLocation("/dashboard");
    
    toast({
      title: "Setup Complete!",
      description: "Your dashboard has been personalized for your industry."
    });
  };

  return (
    <section className="py-12 bg-neutral min-h-screen">
      <div className="container mx-auto px-4">
        <Card className="max-w-5xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Set Up Your Scheduled Dashboard</CardTitle>
            <CardDescription>
              Let's personalize your scheduling experience for your business
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 1 && (
              <IndustryTemplates onSelectTemplate={handleTemplateSelection} />
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Cancel
            </Button>
            
            <Button 
              onClick={handleContinue}
              disabled={!selectedTemplate}
            >
              Continue to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}