import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IOSTest() {
  const [activeTab, setActiveTab] = useState('app');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">iOS App Preparation Test</h1>
      
      <Tabs defaultValue="app" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="app">App Preview</TabsTrigger>
          <TabsTrigger value="assets">App Assets</TabsTrigger>
          <TabsTrigger value="info">App Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="app" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>App Component Preview</CardTitle>
              <CardDescription>
                These components will be integrated into the iOS app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="text-lg font-medium mb-2">SplashScreen Component</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This will be displayed when your app is launching on iOS devices.
                  </p>
                  <div className="bg-[#3b5ac2] text-white p-10 rounded-md text-center">
                    <div className="w-20 h-20 mx-auto bg-white rounded-md mb-4 
                                  flex items-center justify-center relative">
                      <div className="w-full h-3 bg-[#4a6edb] absolute top-0 rounded-t-md"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="w-4 h-4 bg-[#4a6edb] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#4a6edb] rounded-full"></div>
                      </div>
                    </div>
                    <p className="font-bold text-xl">Scheduled</p>
                    <p className="text-sm opacity-90">Professional Scheduling for All Industries</p>
                  </div>
                </div>
                
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="text-lg font-medium mb-2">Native Features</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Capacitor will enable these iOS-specific features.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Push Notifications", "Deep Linking", "App State", "Status Bar", "Native UI"].map((feature) => (
                      <div key={feature} className="flex items-center px-3 py-2 rounded-md bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" 
                            viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                These components will be fully functional when built with Capacitor for iOS.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>App Assets</CardTitle>
              <CardDescription>
                Visual assets prepared for iOS App Store submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">App Icon</h3>
                  <div className="bg-gray-100 p-6 rounded-md flex justify-center">
                    <div className="w-24 h-24 bg-[#3b5ac2] rounded-2xl flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center relative">
                        <div className="w-full h-3 bg-[#4a6edb] absolute top-0 rounded-t-md"></div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="w-3 h-3 bg-[#4a6edb] rounded-full"></div>
                          <div className="w-3 h-3 bg-[#4a6edb] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    App icon for iOS (multiple sizes will be generated)
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Screenshots</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    You'll need to create screenshots in these device sizes:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "iPhone 14 Pro Max (6.7-inch)",
                      "iPhone 14 Plus (6.5-inch)",
                      "iPhone 8 Plus (5.5-inch)",
                      "iPad Pro (12.9-inch)",
                      "iPad Pro (11-inch)"
                    ].map((device) => (
                      <div key={device} className="px-3 py-2 rounded-md bg-gray-50 text-sm">
                        {device}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Assets are prepared as SVGs for pixel-perfect rendering at any size.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>App Store Information</CardTitle>
              <CardDescription>
                Key submission details prepared in documentation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="text-lg font-medium mb-2">App Info</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">App Name:</span>
                      <span className="text-sm">Scheduled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Subtitle:</span>
                      <span className="text-sm">Professional Booking & Scheduling</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Bundle ID:</span>
                      <span className="text-sm">com.scheduled.app</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Categories:</span>
                      <span className="text-sm">Business, Productivity</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Age Rating:</span>
                      <span className="text-sm">4+</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border border-gray-200 p-4">
                  <h3 className="text-lg font-medium mb-2">Subscription Plans</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Basic", price: "$29.99/month", id: "com.scheduled.app.subscription.basic" },
                      { name: "Professional", price: "$79.99/month", id: "com.scheduled.app.subscription.professional" },
                      { name: "Enterprise", price: "$199.99/month", id: "com.scheduled.app.subscription.enterprise" }
                    ].map((plan) => (
                      <div key={plan.name} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-gray-500">{plan.id}</p>
                        </div>
                        <span className="text-sm font-medium">{plan.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => window.open('/privacy-policy.html', '_blank')}>
                Privacy Policy
              </Button>
              <Button variant="outline" onClick={() => window.open('/terms-of-service.html', '_blank')}>
                Terms of Service
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          {activeTab === 'app' && "The actual components will be used in the iOS app build."}
          {activeTab === 'assets' && "Assets will be processed during the iOS build."}
          {activeTab === 'info' && "This information is documented in ios-assets/app-store-info.md."}
        </p>
        <Button onClick={() => alert("When you're ready, follow the instructions in ios-assets/mac-preparation-guide.md to build the iOS app.")}>
          Test iOS Preparation
        </Button>
      </div>
    </div>
  );
}