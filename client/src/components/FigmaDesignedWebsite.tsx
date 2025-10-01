import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

// Import Figma assets as fallbacks
import heroImage from '@assets/Image (3)_1757807495639.png';
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

interface WebsiteSection {
  id: string;
  type: 'header' | 'hero' | 'about' | 'services' | 'contact-info' | 'contact-form' | 'lead-form' | 'testimonials' | 'gallery' | 'text' | 'image' | 'columns' | 'spacer' | 'staff' | 'pricing' | 'newsletter' | 'booking' | 'footer';
  title?: string;
  content?: string;
  columns?: any[];
  settings?: any;
  data?: any;
}

export default function FigmaDesignedWebsite({ clientId, isBuilderPreview = false }: FigmaDesignedWebsiteProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  // Fetch client data
  const { data: client } = useQuery<Client>({
    queryKey: [`/api/public/client/${clientId}`]
  });

  // Fetch website data from the same source as the builder
  const { data: websiteData } = useQuery<any>({
    queryKey: [`/api/public/client/${clientId}/website`],
    enabled: !!clientId
  });

  // Parse website sections from builder data
  let websiteSections: WebsiteSection[] = [];
  if (websiteData?.sections) {
    try {
      websiteSections = typeof websiteData.sections === 'string' 
        ? JSON.parse(websiteData.sections) 
        : websiteData.sections;
    } catch (e) {
      console.error('Error parsing website sections:', e);
      websiteSections = [];
    }
  }

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

  // Booking form submission mutation
  const bookingMutation = useMutation({
    mutationFn: async (formData: typeof bookingForm) => {
      const response = await fetch(`/api/public/clients/${clientId}/booking-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to submit');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "We'll contact you soon to schedule your appointment." });
      setBookingForm({ name: '', email: '', phone: '', message: '' });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
    }
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      newsletterMutation.mutate(newsletterEmail);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookingMutation.mutate(bookingForm);
  };

  const nextTestimonial = (testimonials: any[]) => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = (testimonials: any[]) => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get primary and secondary colors from website data
  const primaryColor = websiteData?.primaryColor || '#a855f7';
  const secondaryColor = websiteData?.secondaryColor || '#ec4899';

  // Helper function to get section background style
  const getSectionStyle = (section: WebsiteSection) => {
    const settings = section.settings || {};
    let style: React.CSSProperties = {};

    if (settings.backgroundType === 'gradient') {
      const colors = settings.gradientColors || [primaryColor, secondaryColor];
      const direction = settings.gradientDirection || '135deg';
      style.background = `linear-gradient(${direction}, ${colors.join(', ')})`;
    } else if (settings.backgroundImage) {
      style.backgroundImage = `url(${settings.backgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else {
      style.backgroundColor = settings.backgroundColor || '#FFFFFF';
    }

    if (settings.textColor) {
      style.color = settings.textColor;
    }

    return style;
  };

  // Helper function to get padding class
  const getPaddingClass = (section: WebsiteSection) => {
    const padding = section.settings?.padding || 'medium';
    const paddingMap = {
      small: 'py-8',
      medium: 'py-16',
      large: 'py-20',
      custom: ''
    };
    return paddingMap[padding as keyof typeof paddingMap] || 'py-16';
  };

  // Render individual section based on type
  const renderSection = (section: WebsiteSection, index: number) => {
    const sectionStyle = getSectionStyle(section);
    const paddingClass = getPaddingClass(section);
    const settings = section.settings || {};
    const data = section.data || {};

    switch (section.type) {
      case 'header':
        return (
          <header key={section.id} className="bg-white shadow-sm" style={sectionStyle} data-testid="header">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold" data-testid="business-name">
                    {client?.businessName || section.title || 'Business Name'}
                  </h1>
                </div>
                <nav className="hidden md:flex space-x-8" data-testid="navigation">
                  {websiteSections.filter(s => s.type !== 'header' && s.type !== 'footer').map((s) => (
                    <a key={s.id} href={`#${s.id}`} className="hover:opacity-75">
                      {s.title}
                    </a>
                  ))}
                </nav>
                <Button 
                  className="px-6 py-2 rounded-full"
                  style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                  data-testid="header-cta-button"
                >
                  {data.buttonText || 'Contact Us'}
                </Button>
              </div>
            </div>
          </header>
        );

      case 'hero':
        const heroImageUrl = settings.heroImage || heroImage;
        return (
          <section 
            key={section.id}
            id={section.id}
            className={`relative min-h-screen flex items-center ${paddingClass}`}
            style={sectionStyle}
            data-testid="hero-section"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
              <div>
                <h1 className="text-5xl lg:text-7xl font-bold mb-6" data-testid="hero-title">
                  {section.title || 'Welcome'}
                </h1>
                <p className="text-xl mb-8 opacity-90" data-testid="hero-description">
                  {section.content || 'Professional services for you'}
                </p>
                <Link href={data.buttonLink || `/booking/${clientId}`}>
                  <Button 
                    className="px-8 py-3 rounded-full text-lg font-semibold"
                    style={{ backgroundColor: '#FFFFFF', color: primaryColor }}
                    data-testid="hero-cta-button"
                  >
                    {data.buttonText || 'Book Appointment'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              {heroImageUrl && (
                <div className="relative" data-testid="hero-image">
                  <img 
                    src={heroImageUrl} 
                    alt={settings.heroImageAlt || "Hero image"} 
                    className="w-full h-auto rounded-lg shadow-2xl"
                  />
                </div>
              )}
            </div>
          </section>
        );

      case 'about':
        return (
          <section
            key={section.id}
            id={section.id}
            className={paddingClass}
            style={sectionStyle}
            data-testid="about-section"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`text-${settings.alignment || 'center'}`}>
                <h2 className="text-4xl font-bold mb-6" data-testid="about-title">
                  {section.title || 'About Us'}
                </h2>
                <div className="text-lg leading-relaxed max-w-3xl mx-auto" data-testid="about-content">
                  {section.content?.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'staff':
        const staffMembers = settings.staffMembers || [];
        return (
          <section key={section.id} id={section.id} className={paddingClass} style={sectionStyle} data-testid="staff-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4" data-testid="staff-title">
                  {section.title || 'Our Team'}
                </h2>
                {section.content && (
                  <p className="text-lg" data-testid="staff-description">{section.content}</p>
                )}
              </div>
              {staffMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {staffMembers.map((member: any, idx: number) => (
                    <div key={member.id} className="text-center" data-testid={`staff-member-${idx}`}>
                      <div className="relative w-48 h-48 mx-auto mb-6">
                        <img 
                          src={member.profileImage} 
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover shadow-lg"
                          data-testid={`staff-image-${idx}`}
                        />
                      </div>
                      <h3 className="text-xl font-bold mb-2" data-testid={`staff-name-${idx}`}>
                        {member.name}
                      </h3>
                      <p className="mb-1" data-testid={`staff-title-${idx}`}>{member.title}</p>
                      <p className="text-sm opacity-75" data-testid={`staff-experience-${idx}`}>{member.experience}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 opacity-50">
                  <p>No staff members added yet</p>
                </div>
              )}
            </div>
          </section>
        );

      case 'pricing':
        const pricingTiers = settings.pricingTiers || [];
        return (
          <section key={section.id} id={section.id} className={paddingClass} style={sectionStyle} data-testid="pricing-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4" data-testid="pricing-title">
                  {section.title || 'Pricing'}
                </h2>
                {section.content && (
                  <p className="text-lg" data-testid="pricing-description">{section.content}</p>
                )}
              </div>
              {pricingTiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pricingTiers.map((tier: any, idx: number) => (
                    <Card 
                      key={tier.id} 
                      className={`relative ${tier.isPopular ? 'scale-105 shadow-xl' : ''}`}
                      style={tier.isPopular ? { backgroundColor: primaryColor, color: '#FFFFFF' } : {}}
                      data-testid={`pricing-tier-${idx}`}
                    >
                      {tier.isPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: secondaryColor, color: '#FFFFFF' }}>
                            Most Popular
                          </span>
                        </div>
                      )}
                      <CardContent className="p-6 text-center">
                        <h3 className="text-xl font-bold mb-4" data-testid={`tier-name-${idx}`}>
                          {tier.name}
                        </h3>
                        <div className="mb-6">
                          <span className="text-4xl font-bold" data-testid={`tier-price-${idx}`}>
                            ${tier.price}
                          </span>
                        </div>
                        <ul className="space-y-3 mb-8">
                          {tier.features?.map((feature: string, fIdx: number) => (
                            <li key={fIdx} className="flex items-center" data-testid={`tier-feature-${idx}-${fIdx}`}>
                              <CheckCircle className="h-5 w-5 mr-3" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Link href={`/booking/${clientId}`}>
                          <Button 
                            className="w-full"
                            style={{ backgroundColor: tier.isPopular ? secondaryColor : primaryColor, color: '#FFFFFF' }}
                            data-testid={`tier-button-${idx}`}
                          >
                            {tier.buttonText || 'Book Now'}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 opacity-50">
                  <p>No pricing tiers added yet</p>
                </div>
              )}
            </div>
          </section>
        );

      case 'testimonials':
        const testimonials = settings.testimonials || [];
        if (testimonials.length === 0) {
          return (
            <section key={section.id} id={section.id} className={`${paddingClass} text-center opacity-50`} style={sectionStyle}>
              <p>No testimonials added yet</p>
            </section>
          );
        }
        return (
          <section key={section.id} id={section.id} className={`${paddingClass} relative`} style={sectionStyle} data-testid="testimonial-section">
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-8" data-testid="testimonial-title">
                  {section.title || 'What Clients Say'}
                </h2>
                <div className="flex justify-center mb-8">
                  <div className="flex">
                    {Array.from({ length: testimonials[currentTestimonial]?.rating || 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className="h-6 w-6 fill-current" 
                        style={{ color: secondaryColor }}
                        data-testid={`testimonial-star-${i}`}
                      />
                    ))}
                  </div>
                </div>
                <blockquote className="text-2xl lg:text-3xl mb-8 italic leading-relaxed" data-testid="testimonial-quote">
                  "{testimonials[currentTestimonial].testimonialText}"
                </blockquote>
                <div className="flex items-center justify-center">
                  <img 
                    src={testimonials[currentTestimonial].customerImage} 
                    alt={testimonials[currentTestimonial].customerName}
                    className="w-16 h-16 rounded-full mr-4"
                    data-testid="testimonial-avatar"
                  />
                  <div className="text-left">
                    <p className="font-bold" data-testid="testimonial-name">
                      {testimonials[currentTestimonial].customerName}
                    </p>
                    <p className="opacity-75" data-testid="testimonial-title">
                      {testimonials[currentTestimonial].customerTitle}
                    </p>
                  </div>
                </div>
                
                {testimonials.length > 1 && (
                  <div className="flex justify-center mt-8 space-x-4">
                    <button
                      onClick={() => prevTestimonial(testimonials)}
                      className="bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                      style={{ backgroundColor: '#FFFFFF' }}
                      data-testid="testimonial-prev-button"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => nextTestimonial(testimonials)}
                      className="bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 transition-colors"
                      style={{ backgroundColor: '#FFFFFF' }}
                      data-testid="testimonial-next-button"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <section key={section.id} id={section.id} className={paddingClass} style={sectionStyle} data-testid="newsletter-section">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h2 className="text-3xl font-bold mb-4" style={{ color: primaryColor }} data-testid="newsletter-title">
                  {section.title || 'Subscribe to Newsletter'}
                </h2>
                {section.content && (
                  <p className="text-gray-600 mb-8" data-testid="newsletter-description">
                    {section.content}
                  </p>
                )}
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
                    className="px-8 py-2 text-white"
                    style={{ backgroundColor: primaryColor }}
                    disabled={newsletterMutation.isPending}
                    data-testid="newsletter-submit-button"
                  >
                    {newsletterMutation.isPending ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        );

      case 'booking':
        return (
          <section key={section.id} id={section.id} className={paddingClass} style={sectionStyle} data-testid="booking-section">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-4 text-center" style={{ color: primaryColor }} data-testid="booking-title">
                  {section.title || 'Book an Appointment'}
                </h2>
                {section.content && (
                  <p className="text-gray-600 mb-8 text-center" data-testid="booking-description">
                    {section.content}
                  </p>
                )}
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                      required
                      data-testid="booking-name-input"
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Your Email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                      required
                      data-testid="booking-email-input"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Your Phone"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                      required
                      data-testid="booking-phone-input"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Message (optional)"
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                      data-testid="booking-message-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-white"
                    style={{ backgroundColor: primaryColor }}
                    disabled={bookingMutation.isPending}
                    data-testid="booking-submit-button"
                  >
                    {bookingMutation.isPending ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                </form>
              </div>
            </div>
          </section>
        );

      case 'footer':
        return (
          <footer key={section.id} id={section.id} className={`${paddingClass} text-white`} style={sectionStyle} data-testid="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4" data-testid="footer-logo">
                    {client?.businessName || section.title || 'Business Name'}
                  </h3>
                  <p className="opacity-75 mb-4" data-testid="footer-description">
                    {section.content || 'Your trusted partner'}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4" data-testid="footer-contact-title">Contact Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center" data-testid="footer-phone">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{data.phone || client?.phone || '(555) 123-4567'}</span>
                    </div>
                    <div className="flex items-center" data-testid="footer-email">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{data.email || client?.email || 'info@business.com'}</span>
                    </div>
                    <div className="flex items-center" data-testid="footer-address">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{data.address || client?.businessAddress || '123 Main St'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4" data-testid="footer-links-title">Quick Links</h4>
                  <ul className="space-y-2 opacity-75">
                    {websiteSections.filter(s => s.type !== 'header' && s.type !== 'footer').slice(0, 4).map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="hover:opacity-100">{s.title}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-4" data-testid="footer-social-title">Follow Us</h4>
                  <div className="flex space-x-4">
                    <a href="#" className="opacity-75 hover:opacity-100" data-testid="footer-facebook">
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a href="#" className="opacity-75 hover:opacity-100" data-testid="footer-instagram">
                      <Instagram className="h-6 w-6" />
                    </a>
                    <a href="#" className="opacity-75 hover:opacity-100" data-testid="footer-twitter">
                      <Twitter className="h-6 w-6" />
                    </a>
                    <a href="#" className="opacity-75 hover:opacity-100" data-testid="footer-youtube">
                      <Youtube className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-opacity-20 mt-12 pt-8 text-center">
                <p className="opacity-75" data-testid="footer-copyright">
                  © {new Date().getFullYear()} {client?.businessName || section.title || 'Business Name'}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        );

      case 'text':
        return (
          <section
            key={section.id}
            id={section.id}
            className={paddingClass}
            style={sectionStyle}
            data-testid="text-section"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`text-${settings.alignment || 'left'}`}>
                {section.title && (
                  <h2 className="text-3xl font-bold mb-6" data-testid="text-title">
                    {section.title}
                  </h2>
                )}
                <div className="leading-relaxed" data-testid="text-content">
                  {section.content?.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'spacer':
        const height = section.settings?.customHeight || '50px';
        return (
          <div key={section.id} style={{ height }} data-testid="spacer-section" />
        );

      default:
        // For unsupported section types, render a placeholder
        return (
          <section
            key={section.id}
            id={section.id}
            className={paddingClass}
            style={sectionStyle}
            data-testid={`${section.type}-section`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center opacity-50">
                <p>Section type "{section.type}" not fully implemented yet</p>
                <p className="text-sm mt-2">{section.title}</p>
              </div>
            </div>
          </section>
        );
    }
  };

  // If no sections are defined, show a placeholder
  if (websiteSections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="empty-website">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Not Configured</h2>
          <p className="text-gray-600">Please configure your website in the Website Builder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="figma-designed-website">
      {websiteSections.map((section, index) => renderSection(section, index))}
    </div>
  );
}
