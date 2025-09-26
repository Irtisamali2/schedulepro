import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, BarChart3, Settings, Shield, Zap, Calendar, MessageCircle, FileText, Globe, Star, ArrowRight, Play, Menu, X } from "lucide-react";
import { insertContactMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Import assets
import gradientBg from "@assets/Group 477_1757064264173.png";
import step3Frame from "@assets/Frame 47_1757064264174.png";
import step2Frame from "@assets/Frame 48_1757064264174.png";
import step1Frame from "@assets/Frame 49_1757064264175.png";
import checkmarkIcon from "@assets/Subtract_1757064264175.png";
import heroImage from "@assets/Group 138 (1)_1757064264176.png";
import ratingStars from "@assets/Group 154_1757064264176.png";
import profile1 from "@assets/Ellipse 54_1757064789129.png";
import profile2 from "@assets/Ellipse 55_1757064789130.png";
import profile3 from "@assets/Ellipse 56_1757064789130.png";
import profile4 from "@assets/Ellipse 57_1757064789131.png";
import playButton from "@assets/Group 215_1757064789132.png";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing: string;
  features: string[];
  maxUsers: number;
  storageGB: number;
  isActive: boolean;
}

// Form schema for Get Started contact form
const getStartedFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Get Started form handling
  const getStartedForm = useForm<z.infer<typeof getStartedFormSchema>>({
    resolver: zodResolver(getStartedFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: (data: z.infer<typeof getStartedFormSchema>) => {
      return apiRequest("/api/contact", "POST", {
        ...data,
        subject: "Get Started Inquiry",
        source: "Landing Page"
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for your interest! We'll get back to you soon.",
      });
      getStartedForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onGetStartedSubmit(data: z.infer<typeof getStartedFormSchema>) {
    contactMutation.mutate(data);
  }

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/public/plans'],
    queryFn: async () => {
      const response = await fetch('/api/public/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    }
  });

  // Fetch review platforms for How It Works section
  const { data: reviewPlatforms = [] } = useQuery({
    queryKey: ['/api/review-platforms'],
    queryFn: async () => {
      const response = await fetch('/api/review-platforms');
      if (!response.ok) throw new Error('Failed to fetch review platforms');
      return response.json();
    }
  });

  const handleGetStarted = async (planId: string) => {
    try {
      const response = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      
      if (!response.ok) throw new Error('Failed to start onboarding');
      
      const { sessionId } = await response.json();
      window.location.href = `/onboarding/${sessionId}`;
    } catch (error) {
      console.error('Error starting onboarding:', error);
      alert('Failed to start onboarding. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center">
              <img src="/scheduled-pro-logo.png" alt="Logo" className="h-8 w-auto" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#footer" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 md:px-6 py-2 text-sm md:text-base"
                onClick={() => handleGetStarted('plan_1')}
              >
                Get Started
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#footer" 
                  className="text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-12 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
                Grow Your Business Visibility 
                <span className="block">with Scheduled Pro</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mb-6 md:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Take your business to the next level with our comprehensive scheduling and management platform designed for modern entrepreneurs.
              </p>
              <Button 
                className="text-white px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg w-full sm:w-auto" 
                style={{backgroundColor: '#7CB8EA'}} 
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#6BA6E0'} 
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#7CB8EA'}
              >
                Learn More
              </Button>
            </div>
            
            {/* Right Column - Hero Image */}
            <div className="relative order-first lg:order-last">
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Professional with business dashboard" 
                  className="w-full h-auto rounded-2xl max-w-md mx-auto lg:max-w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">More than 25,000 teams use Collabs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:justify-center lg:items-center gap-4 sm:gap-6 lg:gap-12 text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">DASHBOARD</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">PROJECTS</span>
              </div>
              <div className="flex items-center justify-center space-x-2 col-span-2 sm:col-span-1">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">TEAM CHAT</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">ANALYTICS</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm">INTEGRATIONS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
            {/* Left Column */}
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">How It Works</h2>
              <p className="text-gray-600 mb-6 md:mb-8 leading-relaxed text-sm sm:text-base">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
                Lorem Ipsum has been the industry's standard dummy text ever since the 
                1500s, when an unknown printer took a galley of type and scrambled it to 
                make a type specimen book.
              </p>
              
              {/* Ratings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                {reviewPlatforms.map((platform: any) => (
                  <div key={platform.id} className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start mb-2">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(Math.floor(platform.rating))].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                        {platform.rating % 1 !== 0 && (
                          <Star className="w-4 h-4 fill-current opacity-50" />
                        )}
                        {[...Array(platform.maxRating - Math.ceil(platform.rating))].map((_, i) => (
                          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
                        ))}
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{platform.rating} / {platform.maxRating} rating</p>
                    <p className="text-xs sm:text-sm text-gray-600">{platform.displayName}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Steps */}
            <div className="space-y-6 md:space-y-8 mt-8 md:mt-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4 md:mr-6">
                  <img 
                    src={step1Frame} 
                    alt="Step 1" 
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Sign up & Register your business</h3>
                  <p className="text-gray-600 text-sm md:text-base">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4 md:mr-6">
                  <img 
                    src={step2Frame} 
                    alt="Step 2" 
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">We auto-generate your Appearance</h3>
                  <p className="text-gray-600 text-sm md:text-base">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4 md:mr-6">
                  <img 
                    src={step3Frame} 
                    alt="Step 3" 
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Share it with customers & start selling</h3>
                  <p className="text-gray-600 text-sm md:text-base">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Our Features you can get</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto mb-4 sm:mb-6">We offer a variety of interesting features that you can help increase your productivity at work and manage your project easily</p>
            <Button 
              className="mt-2 sm:mt-4 text-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base w-full sm:w-auto" 
              style={{backgroundColor: '#7CB8EA'}} 
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#6BA6E0'} 
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#7CB8EA'}
              onClick={() => handleGetStarted('plan_1')}
            >
              Get Started Free
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature Cards */}
            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                <img 
                  src="/appointment-management-image.png" 
                  alt="Appointment Management" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Appointment Management</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Track and manage all your appointments in one centralized location.</p>
            </Card>

            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                <img 
                  src="/services-management-image.png" 
                  alt="Services Management" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Services management</h3>
              <p className="text-gray-600 text-xs sm:text-sm">No need to worry about storage because we provide storage up to 2 TB</p>
            </Card>

            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                <img 
                  src="/leads-management-image.png" 
                  alt="Leads Management" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Leads Management</h3>
              <p className="text-gray-600 text-xs sm:text-sm">We always provide useful informatin to make it easier for you every day</p>
            </Card>

            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4 overflow-hidden">
                <img 
                  src="/web-page-design-image.png" 
                  alt="Web page design" 
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Web page design</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Here you can handle projects together with team virtually</p>
            </Card>

            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4" style={{backgroundColor: '#D6E9F7'}}></div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Team and Collaboration</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Work seamlessly with your team members and collaborate effectively.</p>
            </Card>

            <Card className="p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-full h-24 sm:h-32 rounded-lg mb-3 sm:mb-4" style={{backgroundColor: '#D6E9F7'}}></div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">All in One Agent</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Comprehensive solution that handles all your business needs in one place.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Choose Plan</h2>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">That's Right For You</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Choose plan that works best for you, feel free to contact us</p>
            
            {/* Toggle Buttons */}
            <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-6 sm:mb-8">
              <button className="px-4 sm:px-6 py-2 rounded-md text-gray-600 hover:text-gray-900 text-sm sm:text-base">
                Bil Monthly
              </button>
              <button className="px-4 sm:px-6 py-2 text-white rounded-md text-sm sm:text-base" style={{backgroundColor: '#7CB8EA'}}>
                Bil Yearly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-gray-200 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Basic</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Have a go and test your superpowers</p>
              
              <div className="mb-6 sm:mb-8">
                <div className="relative inline-block">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">15</span>
                  <span className="text-xs sm:text-sm text-gray-400 absolute top-1 sm:top-2 -left-2 sm:-left-3">$</span>
                </div>
              </div>
              
              <ul className="space-y-2 sm:space-y-3 text-left mb-6 sm:mb-8">
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">2 Users</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">2 Files</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Public Share & Comments</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Chat Support</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">New income apps</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full text-sm sm:text-base py-2 sm:py-3"
                onClick={() => handleGetStarted('plan_1')}
              >
                Signup for free
              </Button>
            </Card>

            {/* Pro Plan - Highlighted */}
            <Card className="p-0 border-none relative text-center md:transform md:scale-105 overflow-hidden rounded-xl">
              <div 
                className="absolute inset-0 w-full h-full rounded-xl"
                style={{
                  backgroundImage: `url(${gradientBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
              
              <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Pro</h3>
                <p className="text-xs sm:text-sm text-white/90 mb-4 sm:mb-6">Experiment the power of infinite possibilities</p>
                
                <div className="mb-3 sm:mb-4">
                  <div className="relative inline-block">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">30</span>
                    <span className="text-xs sm:text-sm text-white/80 absolute top-1 sm:top-2 -left-2 sm:-left-3">$</span>
                  </div>
                </div>
                <p className="text-xs text-white/80 mb-6 sm:mb-8">Save $50 a year</p>
                
                {/* White content box for features */}
                <div className="bg-white rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
                  <ul className="space-y-2 sm:space-y-3 text-left">
                    <li className="flex items-center">
                      <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm text-gray-900">4 Users</span>
                    </li>
                    <li className="flex items-center">
                      <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm text-gray-900">All apps</span>
                    </li>
                    <li className="flex items-center">
                      <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm text-gray-900">Unlimited editable exports</span>
                    </li>
                    <li className="flex items-center">
                      <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm text-gray-900">Folders and collaboration</span>
                    </li>
                    <li className="flex items-center">
                      <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                      <span className="text-xs sm:text-sm text-gray-900">All incoming apps</span>
                    </li>
                  </ul>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white rounded-xl text-sm sm:text-base py-2 sm:py-3"
                  onClick={() => handleGetStarted('plan_2')}
                >
                  Go to pro
                </Button>
              </div>
            </Card>

            {/* Business Plan */}
            <Card className="p-4 sm:p-6 lg:p-8 border border-gray-200 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-6 sm:mb-8">Unveil new superpowers and join the Design League</p>
              
              <div className="mb-6 sm:mb-8">
                <div className="relative inline-block">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">46</span>
                  <span className="text-xs sm:text-sm text-gray-400 absolute top-1 sm:top-2 -left-2 sm:-left-3">$</span>
                </div>
              </div>
              
              <ul className="space-y-2 sm:space-y-3 text-left mb-6 sm:mb-8">
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">All the features of pro plan</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Account success Manager</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Single Sign-On (SSO)</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Co-conception program</span>
                </li>
                <li className="flex items-center">
                  <img src={checkmarkIcon} alt="Check" className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm">Collaboration-Soon</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full text-sm sm:text-base py-2 sm:py-3"
                onClick={() => handleGetStarted('plan_3')}
              >
                Goto Business
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="text-white py-12 sm:py-16 lg:py-20" style={{backgroundColor: '#7CB8EA'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-8 sm:mb-12 lg:mb-16">
            {/* Left Column - Testimonials */}
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">People are Saying About Scheduled Pro</h2>
              <p className="text-white/90 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry.
              </p>
              
              <div className="mb-6 sm:mb-8">
                <div className="text-4xl sm:text-5xl lg:text-6xl text-white/30 mb-3 sm:mb-4">"</div>
                <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
                  Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
                </p>
                <p className="text-white/80 mb-4 sm:mb-6 text-sm sm:text-base">— Ana Zaharija</p>
                
                <div className="flex items-center justify-center lg:justify-start space-x-3 sm:space-x-4">
                  <div className="flex -space-x-1 sm:-space-x-2">
                    <img src={profile1} alt="Profile 1" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white" />
                    <img src={profile2} alt="Profile 2" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white" />
                    <img src={profile3} alt="Profile 3" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white" />
                    <img src={profile4} alt="Profile 4" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white" />
                  </div>
                  <img src={playButton} alt="Play" className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 mt-8 lg:mt-0">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Get Started</h3>
              
              <form onSubmit={getStartedForm.handleSubmit(onGetStartedSubmit)} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="w-full p-2 sm:p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    data-testid="input-get-started-email"
                    {...getStartedForm.register("email")}
                  />
                  {getStartedForm.formState.errors.email && (
                    <p className="text-red-200 text-xs mt-1">{getStartedForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    className="w-full p-2 sm:p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    data-testid="input-get-started-name"
                    {...getStartedForm.register("name")}
                  />
                  {getStartedForm.formState.errors.name && (
                    <p className="text-red-200 text-xs mt-1">{getStartedForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Message</label>
                  <textarea 
                    placeholder="What can we help you with?" 
                    rows={3}
                    className="w-full p-2 sm:p-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                    data-testid="textarea-get-started-message"
                    {...getStartedForm.register("message")}
                  ></textarea>
                  {getStartedForm.formState.errors.message && (
                    <p className="text-red-200 text-xs mt-1">{getStartedForm.formState.errors.message.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white py-2 sm:py-3 text-sm sm:text-lg rounded-lg disabled:opacity-50"
                  data-testid="button-get-started-submit"
                >
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-white/20 pt-6 sm:pt-8">
            <div className="flex justify-center mb-6 sm:mb-8">
              {/* Company Info */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <img src="/scheduled-pro-footer-logo.png" alt="Scheduled Pro" className="h-6 w-auto sm:h-8 sm:w-auto" />
                </div>
                <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
                  Get started now try our product
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email here" 
                    className="flex-1 p-2 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-white/20 text-white placeholder-white/70 focus:outline-none text-xs sm:text-sm"
                  />
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-l-none sm:rounded-r-lg">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 sm:pt-6 border-t border-white/20 gap-3 sm:gap-0">
              <p className="text-white/60 text-xs sm:text-sm text-center sm:text-left">
                © 2025 Scheduled Pro. Copyright and rights reserved
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <a href="#" className="text-white/60 hover:text-white text-xs sm:text-sm text-center">Terms and Conditions</a>
                <a href="#" className="text-white/60 hover:text-white text-xs sm:text-sm text-center">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}