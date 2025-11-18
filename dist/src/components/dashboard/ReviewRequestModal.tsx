import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ReviewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientEmail: string;
}

export default function ReviewRequestModal({ 
  isOpen, 
  onClose, 
  clientName, 
  clientEmail 
}: ReviewRequestModalProps) {
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [customMessage, setCustomMessage] = useState(
    `Hi ${clientName},\n\nThank you for visiting us! We'd love to hear about your experience. Could you take a moment to leave us a review on Google?\n\nThank you!`
  );
  const [sendingMethod, setSendingMethod] = useState("email");
  const { toast } = useToast();
  
  const handleSendReviewRequest = () => {
    // In a real app, this would connect to a backend API to send the email or SMS
    toast({
      title: "Review Request Sent",
      description: `A review request has been sent to ${clientName} via ${sendingMethod}.`,
    });
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request a Google Review</DialogTitle>
          <DialogDescription>
            Send a request to {clientName} to leave a review on Google
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="setup" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="message">Message</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-place-id">Google Place ID</Label>
              <Input
                id="google-place-id"
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                placeholder="Enter your Google Place ID"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                You can find your Google Place ID by searching for your business on{" "}
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google's Place ID Finder
                </a>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Sending Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <div 
                  className={`cursor-pointer p-3 border rounded-md flex items-center gap-2 ${
                    sendingMethod === "email" 
                      ? "border-primary bg-primary/5" 
                      : "border-neutral-200"
                  }`}
                  onClick={() => setSendingMethod("email")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="text-sm font-medium">Email</span>
                </div>
                <div 
                  className={`cursor-pointer p-3 border rounded-md flex items-center gap-2 ${
                    sendingMethod === "sms" 
                      ? "border-primary bg-primary/5" 
                      : "border-neutral-200"
                  }`}
                  onClick={() => setSendingMethod("sms")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="text-sm font-medium">SMS</span>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border p-3 bg-neutral-50">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                How it works
              </h4>
              <p className="text-xs text-neutral-600">
                We'll send a message to your client with a direct link to leave a Google review. When they click the link, they'll be taken directly to your Google Business profile review form.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="message" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-message">Customize Your Message</Label>
              <textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your message here..."
              />
              <p className="text-xs text-muted-foreground">
                Personalize your message to encourage clients to leave a review. A Google review link will be automatically added to the end of your message.
              </p>
            </div>
            
            <div className="rounded-md border p-3 bg-neutral-50">
              <h4 className="text-sm font-medium mb-2">Preview</h4>
              <div className="p-3 rounded-md bg-white border text-sm whitespace-pre-wrap">
                {customMessage}
                <div className="mt-3 p-2 border rounded-md bg-primary/5 inline-block">
                  <span className="text-primary font-medium">Leave a Google review</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSendReviewRequest}>
            Send Review Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}