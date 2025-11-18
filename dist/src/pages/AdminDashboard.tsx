import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Mock data for the admin dashboard
const mockSubscriptions = [
  { 
    id: 1, 
    customerName: "John's Hair Salon", 
    email: "john@hairsalon.com", 
    industry: "hairstylist",
    plan: "Professional", 
    status: "active", 
    amount: 79, 
    startDate: "2023-05-10", 
    nextBilling: "2023-06-10"
  },
  { 
    id: 2, 
    customerName: "Woodcraft Builders", 
    email: "info@woodcraft.com", 
    industry: "carpenter",
    plan: "Basic", 
    status: "active", 
    amount: 29, 
    startDate: "2023-04-15", 
    nextBilling: "2023-05-15"
  },
  { 
    id: 3, 
    customerName: "Serene Massage Studio", 
    email: "appointments@serenemassage.com", 
    industry: "massage",
    plan: "Professional", 
    status: "active", 
    amount: 79, 
    startDate: "2023-05-01", 
    nextBilling: "2023-06-01"
  },
  { 
    id: 4, 
    customerName: "Elite Nails", 
    email: "contact@elitenails.com", 
    industry: "nails",
    plan: "Enterprise", 
    status: "active", 
    amount: 199, 
    startDate: "2023-04-20", 
    nextBilling: "2023-05-20"
  },
  { 
    id: 5, 
    customerName: "Flowing Plumbing", 
    email: "service@flowingplumbing.com", 
    industry: "plumber",
    plan: "Professional", 
    status: "active", 
    amount: 79, 
    startDate: "2023-05-05", 
    nextBilling: "2023-06-05"
  }
];

const mockFeedback = [
  {
    id: 1,
    customerName: "John's Hair Salon",
    email: "john@hairsalon.com",
    industry: "hairstylist",
    category: "feature_request",
    subject: "Add inventory management",
    message: "It would be great if we could track product inventory directly in the app. Currently we're using a separate system and it would be more efficient to have it all in one place.",
    date: "2023-05-12",
    status: "new",
    priority: "medium"
  },
  {
    id: 2,
    customerName: "Woodcraft Builders",
    email: "info@woodcraft.com",
    industry: "carpenter",
    category: "bug_report",
    subject: "Calendar not showing all appointments",
    message: "When we have more than 10 appointments in a day, not all of them show up in the calendar view. We need to scroll but there's no scroll indicator.",
    date: "2023-05-11",
    status: "in_progress",
    priority: "high"
  },
  {
    id: 3,
    customerName: "Serene Massage Studio",
    email: "appointments@serenemassage.com",
    industry: "massage",
    category: "feature_request",
    subject: "Integration with booking websites",
    message: "We'd like to see integration with popular booking websites like Booksy and StyleSeat.",
    date: "2023-05-10",
    status: "under_review",
    priority: "medium"
  },
  {
    id: 4,
    customerName: "Elite Nails",
    email: "contact@elitenails.com",
    industry: "nails",
    category: "usability",
    subject: "Mobile view needs improvement",
    message: "The mobile interface is a bit cluttered. It would be better if the buttons were larger and the menus more simplified when on mobile.",
    date: "2023-05-09",
    status: "planned",
    priority: "low"
  },
  {
    id: 5,
    customerName: "Flowing Plumbing",
    email: "service@flowingplumbing.com",
    industry: "plumber",
    category: "suggestion",
    subject: "Add parts tracking feature",
    message: "We need a better way to track parts used on jobs. It would be great to have a feature to add this directly to the client's invoice.",
    date: "2023-05-08",
    status: "completed",
    priority: "high"
  },
  {
    id: 6,
    customerName: "Elite Nails",
    email: "contact@elitenails.com",
    industry: "nails",
    category: "praise",
    subject: "Love the new Google reviews feature!",
    message: "The Google reviews integration has helped us get 15 new reviews in just one week! Our ratings have improved and we're seeing more new clients. Thank you!",
    date: "2023-05-07",
    status: "closed",
    priority: "low"
  }
];

const mockAnalytics = {
  monthlyRevenue: 12350,
  activeSubscriptions: 165,
  usersByIndustry: [
    { industry: "hairstylist", count: 58, percentage: 35 },
    { industry: "carpenter", count: 22, percentage: 13 },
    { industry: "massage", count: 36, percentage: 22 },
    { industry: "nails", count: 28, percentage: 17 },
    { industry: "plumber", count: 14, percentage: 9 },
    { industry: "electrician", count: 7, percentage: 4 }
  ],
  planDistribution: [
    { plan: "Basic", count: 68, percentage: 41 },
    { plan: "Professional", count: 82, percentage: 50 },
    { plan: "Enterprise", count: 15, percentage: 9 }
  ],
  feedbackCategories: [
    { category: "feature_request", count: 28, percentage: 45 },
    { category: "bug_report", count: 12, percentage: 19 },
    { category: "usability", count: 15, percentage: 24 },
    { category: "praise", count: 7, percentage: 12 }
  ]
};

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("feedback");
  const [feedbackList, setFeedbackList] = useState(mockFeedback);
  const [feedbackSearchTerm, setFeedbackSearchTerm] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<typeof mockFeedback[0] | null>(null);
  const [feedbackResponse, setFeedbackResponse] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<string>("");
  const { toast } = useToast();
  
  // Filter feedback based on search term
  const filteredFeedback = feedbackList.filter(feedback => 
    feedback.subject.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
    feedback.message.toLowerCase().includes(feedbackSearchTerm.toLowerCase()) ||
    feedback.customerName.toLowerCase().includes(feedbackSearchTerm.toLowerCase())
  );
  
  const handleSelectFeedback = (feedback: typeof mockFeedback[0]) => {
    setSelectedFeedback(feedback);
    setFeedbackStatus(feedback.status);
  };
  
  const handleUpdateFeedbackStatus = () => {
    if (!selectedFeedback) return;
    
    setFeedbackList(feedbackList.map(feedback => {
      if (feedback.id === selectedFeedback.id) {
        return {
          ...feedback,
          status: feedbackStatus
        };
      }
      return feedback;
    }));
    
    setSelectedFeedback(prev => prev ? { ...prev, status: feedbackStatus } : null);
    
    toast({
      title: "Feedback Updated",
      description: "The feedback status has been updated successfully."
    });
  };
  
  const handleRespondToFeedback = () => {
    if (!selectedFeedback || !feedbackResponse.trim()) return;
    
    toast({
      title: "Response Sent",
      description: `Your response has been sent to ${selectedFeedback.customerName}.`
    });
    
    setFeedbackResponse("");
  };
  
  // Status badge color mapper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">New</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">In Progress</Badge>;
      case "under_review":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Under Review</Badge>;
      case "planned":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">Planned</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Completed</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-neutral-100 text-neutral-700 border-neutral-300">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Priority badge color mapper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">High</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Medium</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <section className="py-8 bg-neutral min-h-screen">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">Admin Dashboard</h2>
        
        <Tabs defaultValue="feedback" onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <Input
                placeholder="Search feedback..."
                value={feedbackSearchTerm}
                onChange={(e) => setFeedbackSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Button variant="outline">Export</Button>
                <Button>Generate Report</Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-[1fr_400px] gap-6">
              {/* Feedback List */}
              <Card>
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                  <CardDescription>
                    View and manage feedback from your users across all industries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeedback.length > 0 ? (
                          filteredFeedback.map((feedback) => (
                            <TableRow 
                              key={feedback.id}
                              className={`cursor-pointer hover:bg-neutral-50 ${
                                selectedFeedback?.id === feedback.id ? 'bg-primary/5' : ''
                              }`}
                              onClick={() => handleSelectFeedback(feedback)}
                            >
                              <TableCell className="font-medium">{feedback.subject}</TableCell>
                              <TableCell>{feedback.customerName}</TableCell>
                              <TableCell className="capitalize">{feedback.industry}</TableCell>
                              <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                              <TableCell>{getPriorityBadge(feedback.priority)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No feedback found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {/* Feedback Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Details</CardTitle>
                  <CardDescription>
                    View and respond to selected feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedFeedback ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">{selectedFeedback.subject}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{selectedFeedback.date}</span>
                          <span>•</span>
                          <span className="capitalize">{selectedFeedback.category.replace('_', ' ')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {selectedFeedback.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{selectedFeedback.customerName}</div>
                          <div className="text-sm text-muted-foreground">{selectedFeedback.email}</div>
                          <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                            {selectedFeedback.message}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="status">Update Status</Label>
                          <select
                            id="status"
                            value={feedbackStatus}
                            onChange={(e) => setFeedbackStatus(e.target.value)}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="under_review">Under Review</option>
                            <option value="planned">Planned</option>
                            <option value="completed">Completed</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleUpdateFeedbackStatus}
                        >
                          Update Status
                        </Button>
                      </div>
                      
                      <div className="space-y-3 border-t pt-4">
                        <Label htmlFor="response">Respond to Feedback</Label>
                        <textarea
                          id="response"
                          value={feedbackResponse}
                          onChange={(e) => setFeedbackResponse(e.target.value)}
                          placeholder="Type your response here..."
                          className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <Button 
                          className="w-full"
                          onClick={handleRespondToFeedback}
                          disabled={!feedbackResponse.trim()}
                        >
                          Send Response
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-1">No feedback selected</h3>
                      <p className="text-muted-foreground max-w-xs">
                        Select a feedback item from the list to view details and respond
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Active Subscriptions</CardTitle>
                <CardDescription>
                  Manage your subscribers and their payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <div className="font-medium">{subscription.customerName}</div>
                            <div className="text-sm text-muted-foreground">{subscription.email}</div>
                          </TableCell>
                          <TableCell className="capitalize">{subscription.industry}</TableCell>
                          <TableCell>{subscription.plan}</TableCell>
                          <TableCell>${subscription.amount}/mo</TableCell>
                          <TableCell>{subscription.nextBilling}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockAnalytics.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on current active subscriptions</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all plans</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Feedback Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockFeedback.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">In the past 30 days</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Users by Industry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.usersByIndustry.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{item.industry}</span>
                          <span className="text-sm text-muted-foreground">{item.count} users ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Plan Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.planDistribution.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{item.plan}</span>
                          <span className="text-sm text-muted-foreground">{item.count} users ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: index === 0 ? '#22c55e' : index === 1 ? '#3b82f6' : '#a855f7' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Feedback Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAnalytics.feedbackCategories.map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{item.category.replace('_', ' ')}</span>
                          <span className="text-sm text-muted-foreground">{item.count} items ({item.percentage}%)</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full" 
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#ef4444' : index === 2 ? '#f59e0b' : '#22c55e' 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2H2v10h10z" />
                          <path d="M12 12H2v10h10z" />
                          <path d="M22 12h-10v10h10z" />
                          <path d="M22 2h-10v10h10z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">New subscription</p>
                        <p className="text-xs text-muted-foreground">Elite Nails subscribed to Enterprise plan</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">New feedback</p>
                        <p className="text-xs text-muted-foreground">Serene Massage Studio requested booking website integration</p>
                        <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <path d="M7 7h10" />
                          <path d="M7 12h10" />
                          <path d="M7 17h10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Plan upgrade</p>
                        <p className="text-xs text-muted-foreground">Woodcraft Builders upgraded from Basic to Professional</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}