import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ReviewRequestModal from "./ReviewRequestModal";

// Sample client data (in a real app, this would come from your backend)
const mockClients = [
  { 
    id: 1, 
    name: "Jane Smith", 
    email: "jane.smith@example.com", 
    phone: "555-123-4567", 
    lastVisit: "2023-04-15", 
    preferredService: "Women's Haircut",
    notes: "Prefers organic products",
    reviewStatus: "None" // None, Requested, Completed
  },
  { 
    id: 2, 
    name: "Michael Johnson", 
    email: "michael.j@example.com", 
    phone: "555-987-6543", 
    lastVisit: "2023-05-02", 
    preferredService: "Men's Haircut & Beard Trim",
    notes: "Allergic to certain dyes",
    reviewStatus: "Completed"
  },
  { 
    id: 3, 
    name: "Lisa Brown", 
    email: "lisa.brown@example.com", 
    phone: "555-567-8901", 
    lastVisit: "2023-04-28", 
    preferredService: "Highlights",
    notes: "Likes to be early",
    reviewStatus: "Requested"
  },
  { 
    id: 4, 
    name: "Robert Davis", 
    email: "robert.d@example.com", 
    phone: "555-345-6789", 
    lastVisit: "2023-03-20", 
    preferredService: "Men's Haircut",
    notes: "",
    reviewStatus: "None"
  },
];

export default function ClientManagement() {
  const [clients, setClients] = useState(mockClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    preferredService: "",
    notes: ""
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof mockClients[0] | null>(null);
  const { toast } = useToast();

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email || !newClient.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newClientWithId = {
      ...newClient,
      id: clients.length + 1,
      lastVisit: "Never",
      reviewStatus: "None"
    };

    setClients([...clients, newClientWithId]);
    setNewClient({
      name: "",
      email: "",
      phone: "",
      preferredService: "",
      notes: ""
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Client Added",
      description: `${newClient.name} has been added to your client list.`
    });
  };

  const handleSendReviewRequest = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    setSelectedClient(client);
    setReviewModalOpen(true);
  };
  
  const handleReviewRequestSent = () => {
    if (!selectedClient) return;
    
    // Update the client's review status
    setClients(clients.map(client => 
      client.id === selectedClient.id 
        ? { ...client, reviewStatus: "Requested" } 
        : client
    ));
    
    setReviewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Clients</CardTitle>
            <CardDescription>Manage your client list and request Google reviews</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Client</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's details below to add them to your system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newClient.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newClient.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={newClient.phone}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="preferredService" className="text-right">
                      Preferred Service
                    </Label>
                    <Input
                      id="preferredService"
                      name="preferredService"
                      value={newClient.preferredService}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Input
                      id="notes"
                      name="notes"
                      value={newClient.notes}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddClient}>
                    Add Client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Preferred Service</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div>{client.email}</div>
                        <div>{client.phone}</div>
                      </TableCell>
                      <TableCell>{client.lastVisit}</TableCell>
                      <TableCell>{client.preferredService}</TableCell>
                      <TableCell>
                        {client.reviewStatus === "None" && (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-800">
                            Not requested
                          </span>
                        )}
                        {client.reviewStatus === "Requested" && (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
                            Requested
                          </span>
                        )}
                        {client.reviewStatus === "Completed" && (
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Posted
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendReviewRequest(client.id)}
                            disabled={client.reviewStatus === "Completed"}
                          >
                            {client.reviewStatus === "Requested" ? "Resend Request" : "Ask for Review"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedClient && (
        <ReviewRequestModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          clientName={selectedClient.name}
          clientEmail={selectedClient.email}
        />
      )}
    </div>
  );
}