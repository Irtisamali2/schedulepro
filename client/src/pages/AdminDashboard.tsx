import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ReferralTracking from '@/components/analytics/ReferralTracking';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import {
  Shield,
  Users,
  TrendingUp,
  Settings,
  Database,
  BarChart3,
  Star,
  Plus,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    rating: 5.0,
    maxRating: 5,
    reviewCount: 0,
    logoUrl: '',
    isActive: true,
    sortOrder: 0
  });

  // Fetch review platforms
  const { data: reviewPlatforms = [], isLoading } = useQuery({
    queryKey: ['/api/review-platforms'],
    queryFn: async () => {
      const response = await fetch('/api/review-platforms');
      if (!response.ok) throw new Error('Failed to fetch review platforms');
      return response.json();
    }
  });

  // Create platform mutation
  const createPlatformMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/review-platforms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
      setShowAddForm(false);
      resetForm();
    }
  });

  // Update platform mutation
  const updatePlatformMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest('PUT', `/api/review-platforms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
      setEditingPlatform(null);
      resetForm();
    }
  });

  // Delete platform mutation
  const deletePlatformMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/review-platforms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/review-platforms'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      rating: 5.0,
      maxRating: 5,
      reviewCount: 0,
      logoUrl: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlatform) {
      updatePlatformMutation.mutate({ id: editingPlatform.id, data: formData });
    } else {
      createPlatformMutation.mutate(formData);
    }
  };

  const startEdit = (platform: any) => {
    setEditingPlatform(platform);
    setFormData({
      name: platform.name,
      displayName: platform.displayName,
      rating: platform.rating,
      maxRating: platform.maxRating,
      reviewCount: platform.reviewCount || 0,
      logoUrl: platform.logoUrl || '',
      isActive: platform.isActive,
      sortOrder: platform.sortOrder
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Business intelligence and partnership management</p>
          </div>
          <Badge className="bg-red-100 text-red-800 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Only
          </Badge>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="partnerships" className="space-y-6">
          <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <TabsTrigger value="partnerships" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">User Analytics</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Business Metrics</span>
              <span className="sm:hidden">Business</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
              <span className="sm:hidden">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Partnership Analytics */}
          <TabsContent value="partnerships">
            <ReferralTracking />
          </TabsContent>

          {/* User Analytics */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-gray-600">Waiting for first users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-gray-600">Ready for launch</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0%</div>
                  <p className="text-sm text-gray-600">Pre-launch phase</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Business Metrics */}
          <TabsContent value="business">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Revenue metrics will appear when users start subscribing</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Industry Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Industry analytics will show user template preferences</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Review Platforms */}
          <TabsContent value="reviews">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Platforms Management</h2>
                  <p className="text-gray-600">Manage Google Reviews, Yelp, Trust Pilot and other review platforms for the landing page</p>
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Platform
                </Button>
              </div>

              {/* Add/Edit Form */}
              {(showAddForm || editingPlatform) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingPlatform ? 'Edit Platform' : 'Add New Platform'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Platform Key</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., google, yelp, trustpilot"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="e.g., Google Reviews"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="rating">Current Rating</Label>
                          <Input
                            id="rating"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={formData.rating}
                            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxRating">Max Rating</Label>
                          <Input
                            id="maxRating"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.maxRating}
                            onChange={(e) => setFormData({ ...formData, maxRating: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="reviewCount">Review Count</Label>
                          <Input
                            id="reviewCount"
                            type="number"
                            min="0"
                            value={formData.reviewCount}
                            onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                          <Input
                            id="logoUrl"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                            placeholder="https://example.com/logo.png"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sortOrder">Sort Order</Label>
                          <Input
                            id="sortOrder"
                            type="number"
                            min="0"
                            value={formData.sortOrder}
                            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label>Active (Show on landing page)</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={createPlatformMutation.isPending || updatePlatformMutation.isPending}>
                          {editingPlatform ? 'Update' : 'Create'} Platform
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingPlatform(null);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Platforms List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading platforms...</div>
                  ) : reviewPlatforms.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No review platforms configured yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviewPlatforms.map((platform: any) => (
                        <div key={platform.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                          <div className="flex items-center space-x-4">
                            {platform.logoUrl && (
                              <img src={platform.logoUrl} alt={platform.displayName} className="w-8 h-8 rounded" />
                            )}
                            <div>
                              <h3 className="font-semibold">{platform.displayName}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <div className="flex text-yellow-400">
                                  {[...Array(Math.floor(platform.rating))].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-current" />
                                  ))}
                                  {platform.rating % 1 !== 0 && (
                                    <Star className="w-3 h-3 fill-current opacity-50" />
                                  )}
                                </div>
                                <span>{platform.rating} / {platform.maxRating}</span>
                                {platform.reviewCount && <span>• {platform.reviewCount} reviews</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={platform.isActive ? "default" : "secondary"}>
                              {platform.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(platform)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePlatformMutation.mutate(platform.id)}
                              disabled={deletePlatformMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Google Business
                      </a>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <a href="https://business.yelp.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Yelp Business
                      </a>
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <a href="https://business.trustpilot.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Trustpilot Business
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-medium">Referral Tracking</h3>
                      <p className="text-sm text-gray-600">Monitor Stripe partnership referrals</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-medium">User Analytics</h3>
                      <p className="text-sm text-gray-600">Track user engagement and retention</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <h3 className="font-medium">Partnership Reminders</h3>
                      <p className="text-sm text-gray-600">Automated partnership milestone alerts</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}