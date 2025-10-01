import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import Figma assets
import heroImage from '@assets/Image (3)_1757807495639.png';
import contentsLogo from '@assets/Contents_1757807495638.png';
import staffMember1 from '@assets/Ellipse 54_1757064789129.png';
import staffMember2 from '@assets/Ellipse 55_1757064789130.png'; 
import staffMember3 from '@assets/Ellipse 56_1757064789130.png';
import testimonialAvatar from '@assets/Ellipse 57_1757064789131.png';

interface Client {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessAddress: string;
  industry: string;
}

interface FigmaDesignedWebsiteProps {
  clientId: string;
  isBuilderPreview?: boolean;
}

interface WebsiteStaff {
  id: string;
  name: string;
  title: string;
  experience: string;
  profileImage: string;
}

interface ServicePricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular: boolean;
  buttonText: string;
}

interface ClientService {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  category?: string;
  isActive: boolean;
}

interface WebsiteTestimonial {
  id: string;
  customerName: string;
  customerTitle: string;
  testimonialText: string;
  customerImage: string;
  rating: number;
}

interface FigmaDesignedWebsiteProps {
  clientId: string;
  isBuilderPreview?: boolean;
}

export default function FigmaDesignedWebsite({ clientId, isBuilderPreview = false }: FigmaDesignedWebsiteProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Fetch client data
  const { data: client } = useQuery<Client>({
    queryKey: [`/api/public/client/${clientId}`]
  });

  // Fetch website data from the same source as the builder
  const { data: websiteData } = useQuery<any>({
    queryKey: [`/api/public/client/${clientId}/website`],
    enabled: !!clientId
  });

  // Fetch staff data
  const { data: staff = [] } = useQuery<WebsiteStaff[]>({
    queryKey: [`/api/public/clients/${clientId}/website-staff`]
  });

  // Fetch pricing tiers
  const { data: pricingTiers = [] } = useQuery<ServicePricingTier[]>({
    queryKey: [`/api/public/clients/${clientId}/pricing-tiers`]
  });

  // Fetch client services to display alongside pricing tiers
  const { data: clientServices = [] } = useQuery<ClientService[]>({
    queryKey: [`/api/public/client/${clientId}/services`]
  });

  // Fetch testimonials
  const { data: testimonials = [] } = useQuery<WebsiteTestimonial[]>({
    queryKey: [`/api/public/clients/${clientId}/website-testimonials`]
  });

  // Newsletter subscription mutation
  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/public/clients/${clientId}/newsletter-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: '' })
      });
      if (!response.ok) throw new Error('Failed to subscribe');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "You've been subscribed to our newsletter." });
      setNewsletterEmail('');
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to subscribe. Please try again.", variant: "destructive" });
    }
  });


  // Fallback to imported assets only if no admin data is available
  const defaultStaffWithAssets = [
    { id: '1', name: 'Mara Olsen', title: 'Senior Stylist', experience: '8 years experience', profileImage: staffMember1 },
    { id: '2', name: 'Jess Nunez', title: 'Hair Specialist', experience: '6 years experience', profileImage: staffMember2 },
    { id: '3', name: 'Dana Welch', title: 'Color Expert', experience: '5 years experience', profileImage: staffMember3 },
  ];

  const defaultTestimonialWithAsset = [
    {
      id: '1',
      customerName: 'Sarah Johnson',
      customerTitle: 'Hair Influencer',
      testimonialText: 'Hair has been my home for hair for years',
      customerImage: testimonialAvatar,
      rating: 5
    }
  ];

  // Parse website sections from builder data
  let websiteSections: any[] = [];
  if (websiteData?.sections) {
    try {
      websiteSections = JSON.parse(websiteData.sections);
    } catch (e) {
      console.error('Error parsing website sections:', e);
      websiteSections = [];
    }
  }

  // Use website data for configuration when available
  const businessName = client?.businessName || 'Graceful Hair';
  const heroTitle = websiteSections.find(s => s.type === 'hero')?.title || 'Transform Your Look with Professional Hair Care';
  const heroContent = websiteSections.find(s => s.type === 'hero')?.content || 'Experience luxury hair services that bring out your natural beauty';
  const heroImageUrl = websiteSections.find(s => s.type === 'hero')?.settings?.heroImage || websiteData?.heroImage || heroImage;
  const primaryColor = websiteData?.primaryColor || '#a855f7'; // Default purple
  const secondaryColor = websiteData?.secondaryColor || '#ec4899'; // Default pink

  // Use real admin data when available, fallback to assets only for display purposes
  const displayStaff = staff.length > 0 ? staff : defaultStaffWithAssets;
  
  // Convert client services to display format similar to pricing tiers
  const convertedServices = clientServices.map(service => ({
    id: service.id,
    name: service.name,
    price: service.price,
    features: service.description ? [service.description, `Duration: ${service.durationMinutes} min`] : [`Duration: ${service.durationMinutes} min`],
    isPopular: false,
    buttonText: 'Book Now',
    isFromAdminServices: true // Mark as admin service for priority
  }));
  
  // Prioritize admin services over pricing tiers - if admin services exist, show only those
  // Otherwise fall back to pricing tiers
  const allDisplayPricing = clientServices.length > 0 ? convertedServices : pricingTiers;
  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonialWithAsset;

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      newsletterMutation.mutate(newsletterEmail);
    }
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % displayTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + displayTestimonials.length) % displayTestimonials.length);
  };

  return (
    <div className="min-h-screen bg-white" data-testid="figma-designed-website">
      {/* Header */}
      <header className="bg-white shadow-sm" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900" data-testid="business-name">
                {client?.businessName || 'Graceful Hair'}
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8" data-testid="navigation">
              <a href="#home" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#staff" className="text-gray-700 hover:text-gray-900">Staff</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
            </nav>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
              data-testid="contact-button"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-center"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`
        }}
        data-testid="hero-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6" data-testid="hero-title">
              {heroTitle}
            </h1>
            <p className="text-xl mb-8 opacity-90" data-testid="hero-description">
              {heroContent}
            </p>
            <Link href={`/booking/${clientId}`}>
              <Button 
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-semibold"
                data-testid="hero-cta-button"
              >
                Book Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="relative" data-testid="hero-image">
            <img 
              src={heroImageUrl} 
              alt="Woman with beautiful hair" 
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Staff Section */}
      <section id="staff" className="py-20 bg-gray-50" data-testid="staff-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="staff-title">
              Meet With Our Professional Staff
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayStaff.map((member, index) => (
              <div key={member.id} className="text-center" data-testid={`staff-member-${index}`}>
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <img 
                    src={member.profileImage} 
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover shadow-lg"
                    data-testid={`staff-image-${index}`}
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2" data-testid={`staff-name-${index}`}>
                  {member.name}
                </h3>
                <p className="text-gray-600 mb-1" data-testid={`staff-title-${index}`}>
                  {member.title}
                </p>
                <p className="text-sm text-gray-500" data-testid={`staff-experience-${index}`}>
                  {member.experience}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="pricing-title">
              Summer Hair Hair Offers
            </h2>
            <p className="text-gray-600" data-testid="pricing-description">
              Choose the perfect service for your hair care needs
            </p>
          </div>
          {allDisplayPricing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allDisplayPricing.map((tier, index) => (
                <Card 
                  key={tier.id} 
                  className={`relative ${tier.isPopular ? 'bg-purple-600 text-white scale-105 shadow-xl' : 'bg-white'}`}
                  data-testid={`pricing-tier-${index}`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <h3 className={`text-xl font-bold mb-4 ${tier.isPopular ? 'text-white' : 'text-gray-900'}`} data-testid={`tier-name-${index}`}>
                      {tier.name}
                    </h3>
                    <div className="mb-6">
                      <span className={`text-4xl font-bold ${tier.isPopular ? 'text-white' : 'text-gray-900'}`} data-testid={`tier-price-${index}`}>
                        ${tier.price}
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {tier.features?.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center" data-testid={`tier-feature-${index}-${featureIndex}`}>
                          <CheckCircle className={`h-5 w-5 mr-3 ${tier.isPopular ? 'text-pink-300' : 'text-green-500'}`} />
                          <span className={tier.isPopular ? 'text-white' : 'text-gray-600'}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/booking/${clientId}`}>
                      <Button 
                        className={`w-full ${
                          tier.isPopular 
                            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                        data-testid={`tier-button-${index}`}
                      >
                        {tier.buttonText || 'Book Now'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Pricing Tiers Available</h3>
              <p className="text-sm text-gray-500">Add pricing tiers in your admin dashboard to display services here</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonial Section */}
      <section 
        className="py-20 relative"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)'
        }}
        data-testid="testimonial-section"
      >
        <div className="absolute inset-0 opacity-20">
          <img src={contentsLogo} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayTestimonials.length > 0 && (
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-6 w-6 text-yellow-400 fill-yellow-400" 
                      data-testid={`testimonial-star-${i}`}
                    />
                  ))}
                </div>
              </div>
              <blockquote className="text-2xl lg:text-3xl text-white mb-8 italic leading-relaxed" data-testid="testimonial-quote">
                "{displayTestimonials[currentTestimonial].testimonialText}"
              </blockquote>
              <div className="flex items-center justify-center">
                <img 
                  src={displayTestimonials[currentTestimonial].customerImage} 
                  alt={displayTestimonials[currentTestimonial].customerName}
                  className="w-16 h-16 rounded-full mr-4"
                  data-testid="testimonial-avatar"
                />
                <div className="text-left">
                  <p className="font-bold text-white" data-testid="testimonial-name">
                    {displayTestimonials[currentTestimonial].customerName}
                  </p>
                  <p className="text-pink-300" data-testid="testimonial-title">
                    {displayTestimonials[currentTestimonial].customerTitle}
                  </p>
                </div>
              </div>
              
              {displayTestimonials.length > 1 && (
                <div className="flex justify-center mt-8 space-x-4">
                  <button
                    onClick={prevTestimonial}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                    data-testid="testimonial-prev-button"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                    data-testid="testimonial-next-button"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-50" data-testid="newsletter-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6" data-testid="newsletter-logo">
              <span className="text-white text-2xl font-bold">HS</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="newsletter-title">
              Subscribe to the Hair Newsletter
            </h2>
            <p className="text-gray-600 mb-8" data-testid="newsletter-description">
              Get exclusive tips, offers, and updates straight to your inbox
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1"
                required
                data-testid="newsletter-email-input"
              />
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                disabled={newsletterMutation.isPending}
                data-testid="newsletter-submit-button"
              >
                {newsletterMutation.isPending ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-purple-900 text-white py-16" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" data-testid="footer-logo">
                {client?.businessName || 'Graceful Hair'}
              </h3>
              <p className="text-purple-200 mb-4" data-testid="footer-description">
                Your trusted partner for beautiful, healthy hair
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4" data-testid="footer-contact-title">Contact Info</h4>
              <div className="space-y-2">
                <div className="flex items-center" data-testid="footer-phone">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{client?.phone || '(555) 123-4567'}</span>
                </div>
                <div className="flex items-center" data-testid="footer-email">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{client?.email || 'info@gracefulhair.com'}</span>
                </div>
                <div className="flex items-center" data-testid="footer-address">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{client?.businessAddress || '123 Beauty St, Hair City'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4" data-testid="footer-services-title">Services</h4>
              <ul className="space-y-2 text-purple-200">
                <li data-testid="footer-service-1">Hair Cutting</li>
                <li data-testid="footer-service-2">Hair Coloring</li>
                <li data-testid="footer-service-3">Hair Styling</li>
                <li data-testid="footer-service-4">Hair Treatments</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4" data-testid="footer-social-title">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-purple-200 hover:text-white" data-testid="footer-facebook">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-purple-200 hover:text-white" data-testid="footer-instagram">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-purple-200 hover:text-white" data-testid="footer-twitter">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-purple-200 hover:text-white" data-testid="footer-youtube">
                  <Youtube className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-purple-800 mt-12 pt-8 text-center">
            <p className="text-purple-200" data-testid="footer-copyright">
              © 2024 {client?.businessName || 'Graceful Hair'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}