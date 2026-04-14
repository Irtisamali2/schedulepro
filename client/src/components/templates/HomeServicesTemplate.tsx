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
    Menu,
    Facebook,
    Instagram,
    Twitter,
    Linkedin
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditableSection from '@/components/EditableSection';
import EditableText from '@/components/EditableText';
import EditableImage from '@/components/EditableImage';
import { useEditableWebsite } from '@/contexts/EditableWebsiteContext';
import { apiRequest } from '@/lib/queryClient';
import LeadForm from '@/components/LeadForm';

// Import Home Services assets
import heroImage from '@assets/home services/Hero Iamge.png';
import homeCleaningIcon from '@assets/home services/home cleaning services.png';
import plumbingIcon from '@assets/home services/plumbing service.png';
import remodelingIcon from '@assets/home services/Home Remodelling.png';
import professionalServicesImg from '@assets/home services/Professional Services Built for Modern Homes section picture.png';
import teamMember1 from '@assets/home services/Erick Reynolds.png';
import teamMember2 from '@assets/home services/Erick Reynolds 2.png';
import teamMember3 from '@assets/home services/Erick Reynolds 3.png';
import trustedServicesImg from '@assets/home services/Book Trusted  Home Services With Confidence section picture.png';
import testimonialAvatar from '@assets/home services/Robert fox.png';
import blogImg1 from '@assets/home services/benifits of regular professional cleaning.png';
import blogImg2 from '@assets/home services/eco friendly cleaning.png';
import blogImg3 from '@assets/home services/How to maintain a clean house.png';

interface HomeServicesTemplateProps {
    clientId?: string;
    subdomain?: string;
    isBuilderPreview?: boolean;
    onDeleteSection?: (sectionId: string) => void;
    onEditSection?: (sectionId: string) => void;
    onDragStart?: (sectionId: string) => void;
    onDragOver?: (e: React.DragEvent, sectionId: string) => void;
    onDragEnd?: () => void;
}

interface Client {
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessAddress: string;
    industry: string;
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

interface ServicePricingTier {
    id: string;
    name: string;
    price: number;
    features: string[];
    isPopular: boolean;
    buttonText: string;
}

interface WebsiteTestimonial {
    id: string;
    customerName: string;
    customerTitle: string;
    testimonialText: string;
    customerImage: string;
    rating: number;
}

export default function HomeServicesTemplate({
    clientId,
    subdomain,
    isBuilderPreview = false,
    onDeleteSection,
    onEditSection,
    onDragStart,
    onDragOver,
    onDragEnd
}: HomeServicesTemplateProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const { isEditable, setSelectedElement, setToolbarPosition } = useEditableWebsite();

    // Wrapper that disables booking navigation in builder preview
    const BookingLink = ({ children }: { children: React.ReactNode }) =>
        isBuilderPreview ? <>{children}</> : <Link href={`/booking/${clientId}`}>{children}</Link>;

    // Determine which identifier to use
    const identifier = subdomain || clientId;
    const isSubdomainRoute = !!subdomain;
    const apiBase = isSubdomainRoute ? `/api/public/${subdomain}` : `/api/public/client/${clientId}`;

    // Fetch client data
    const { data: client, isLoading: isClientLoading } = useQuery<Client>({
        queryKey: isSubdomainRoute ? [`/api/public/${subdomain}`] : [`/api/public/client/${clientId}`],
        enabled: !!identifier
    });

    // Fetch website data
    const { data: websiteData, isLoading: isWebsiteLoading } = useQuery<any>({
        queryKey: [`${apiBase}/website`],
        enabled: !!identifier
    });

    // Fetch client services
    const { data: clientServices = [] } = useQuery<ClientService[]>({
        queryKey: [`${apiBase}/services`],
        enabled: !!identifier
    });

    // Fetch pricing tiers
    const { data: pricingTiers = [] } = useQuery<ServicePricingTier[]>({
        queryKey: [`/api/public/clients/${identifier}/pricing-tiers`],
        enabled: !!identifier
    });

    // Fetch testimonials
    const { data: testimonials = [] } = useQuery<WebsiteTestimonial[]>({
        queryKey: [`/api/public/clients/${identifier}/website-testimonials`],
        enabled: !!identifier
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

    // Update website content mutation
    const updateContentMutation = useMutation({
        mutationFn: async (updates: { sectionId: string; field: string; value: string }) => {
            const currentWebsiteData = queryClient.getQueryData<any>([`/api/public/client/${clientId}/website`]);

            let currentSections: any[] = [];
            if (currentWebsiteData?.sections) {
                try {
                    currentSections = JSON.parse(currentWebsiteData.sections);
                } catch (e) {
                    currentSections = [];
                }
            }

            const updatedSections = [...currentSections];
            const sectionIndex = updatedSections.findIndex(s => s.id === updates.sectionId || s.type === updates.sectionId);

            let parsedValue = updates.value;
            try {
                const parsed = JSON.parse(updates.value);
                if (typeof parsed === 'object' && parsed !== null) {
                    parsedValue = parsed;
                }
            } catch (e) {
                parsedValue = updates.value;
            }

            if (sectionIndex >= 0) {
                updatedSections[sectionIndex] = {
                    ...updatedSections[sectionIndex],
                    [updates.field]: parsedValue
                };
            } else {
                updatedSections.push({
                    id: updates.sectionId,
                    type: updates.sectionId,
                    [updates.field]: parsedValue
                });
            }

            const response = await apiRequest(
                `/api/client/${clientId}/website`,
                'PUT',
                {
                    ...currentWebsiteData,
                    sections: JSON.stringify(updatedSections)
                }
            );

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/public/client/${clientId}/website`] });
            queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/website`] });
            toast({ title: "Saved!", description: "Content updated successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        }
    });

    // Parse website sections
    let websiteSections: any[] = [];
    if (websiteData?.sections) {
        try {
            websiteSections = JSON.parse(websiteData.sections);
        } catch (e) {
            websiteSections = [];
        }
    }

    // Website configuration
    const businessName = client?.businessName || 'Home Services Pro';
    const primaryColor = websiteData?.primaryColor || '#3a86ff';
    const secondaryColor = websiteData?.secondaryColor || '#0077b6';

    // Default testimonials
    const defaultTestimonials = [
        {
            id: '1',
            customerName: 'Robert Fox',
            customerTitle: 'Homeowner',
            testimonialText: 'Excellent service! They transformed my home with professional cleaning and maintenance.',
            customerImage: testimonialAvatar,
            rating: 5
        }
    ];

    const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

    // Pricing display
    const convertedServices = clientServices.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        features: service.description ? [service.description] : [],
        isPopular: false,
        buttonText: 'Book Now'
    }));

    const allDisplayPricing = clientServices.length > 0 ? convertedServices : pricingTiers;

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

    // Loading state
    if (isClientLoading || isWebsiteLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading website...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (!client && !isClientLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center max-w-md px-4">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Website Not Found</h1>
                    <p className="text-gray-600 mb-8">The website you're looking for doesn't exist or has been moved.</p>
                    <a href="/" className="text-blue-600 hover:text-blue-700 underline">Go to Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <EditableSection
                sectionId="header"
                sectionName="Header"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('header') : undefined}
                onSettings={onEditSection ? () => onEditSection('header') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <EditableText
                                element="h1"
                                className="text-2xl md:text-3xl font-bold text-gray-900"
                                sectionId="header"
                                elementId="business-name"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'header', field: 'businessName', value: newText });
                                }}
                            >
                                {businessName}
                            </EditableText>
                            <nav className="hidden md:flex space-x-8">
                                <a href="#home" className="text-gray-700 hover:text-blue-600 transition">Home</a>
                                <a href="#services" className="text-gray-700 hover:text-blue-600 transition">Services</a>
                                <a href="#team" className="text-gray-700 hover:text-blue-600 transition">Team</a>
                                <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition">Pricing</a>
                                <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
                            </nav>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Contact Us
                            </Button>
                            <button className="md:hidden">
                                <Menu className="h-6 w-6 text-gray-700" />
                            </button>
                        </div>
                    </div>
                </header>
            </EditableSection>

            {/* Hero Section */}
            <EditableSection
                sectionId="hero"
                sectionName="Hero Section"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('hero') : undefined}
                onSettings={onEditSection ? () => onEditSection('hero') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="home" className="bg-gray-50 py-12 md:py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div>
                                <EditableText
                                    element="h1"
                                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight"
                                    sectionId="hero"
                                    elementId="hero-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'hero', field: 'title', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'hero')?.title || 'Reliable Home Cleaning and Maintenance Solutions'}
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-base md:text-lg text-gray-600 mb-6 md:mb-8"
                                    sectionId="hero"
                                    elementId="hero-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'hero', field: 'content', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'hero')?.content || 'Professional services for your home, delivered by trained experts you can trust.'}
                                </EditableText>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <BookingLink>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md flex items-center justify-center"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Book Service Now
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </BookingLink>
                                    <Button variant="outline" className="px-8 py-3 rounded-md">
                                        Learn More
                                    </Button>
                                </div>

                                {/* Testimonial Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-12">
                                    <Card className="bg-white border border-gray-200">
                                        <CardContent className="p-4">
                                            <div className="flex mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">"Great cleaning service!"</p>
                                            <p className="text-xs text-gray-500">- Sarah M.</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-white border border-gray-200">
                                        <CardContent className="p-4">
                                            <div className="flex mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">"Reliable and professional"</p>
                                            <p className="text-xs text-gray-500">- John D.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            <div className="relative">
                                <EditableImage
                                    src={heroImage}
                                    alt="Professional home services"
                                    className="w-full h-auto rounded-lg shadow-xl"
                                    sectionId="hero"
                                    elementId="hero-image"
                                    onUpdate={(newImageUrl) => {
                                        updateContentMutation.mutate({
                                            sectionId: 'hero',
                                            field: 'settings',
                                            value: JSON.stringify({ ...websiteSections.find(s => s.type === 'hero')?.settings, heroImage: newImageUrl })
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Services Grid Section */}
            <EditableSection
                sectionId="services"
                sectionName="Services Grid"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('services') : undefined}
                onSettings={onEditSection ? () => onEditSection('services') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="services" className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 md:mb-16">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="services"
                                elementId="services-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'services', field: 'title', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'services')?.title || 'Everything Your Home Needs, Our Trained Techs Provide'}
                            </EditableText>
                            <EditableText
                                element="p"
                                className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto"
                                sectionId="services"
                                elementId="services-content"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'services', field: 'content', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'services')?.content || 'From routine cleaning to complex repairs, we provide comprehensive solutions.'}
                            </EditableText>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {/* Service Card 1 */}
                            <Card className="group hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6">
                                    <div className="mb-4 overflow-hidden rounded-lg">
                                        <EditableImage
                                            src={homeCleaningIcon}
                                            alt="Home Cleaning Services"
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            sectionId="services"
                                            elementId="service1-image"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service1Image',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-2"
                                        sectionId="services"
                                        elementId="service1-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service1Title', value: newText });
                                        }}
                                    >
                                        Home Cleaning
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4"
                                        sectionId="services"
                                        elementId="service1-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service1Description', value: newText });
                                        }}
                                    >
                                        Professional cleaning services to keep your home spotless and fresh.
                                    </EditableText>
                                    <BookingLink>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            style={{ borderColor: primaryColor, color: primaryColor }}
                                        >
                                            Book Now
                                        </Button>
                                    </BookingLink>
                                </CardContent>
                            </Card>

                            {/* Service Card 2 */}
                            <Card className="group hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6">
                                    <div className="mb-4 overflow-hidden rounded-lg">
                                        <EditableImage
                                            src={plumbingIcon}
                                            alt="Plumbing Services"
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            sectionId="services"
                                            elementId="service2-image"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service2Image',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-2"
                                        sectionId="services"
                                        elementId="service2-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service2Title', value: newText });
                                        }}
                                    >
                                        Plumbing Services
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4"
                                        sectionId="services"
                                        elementId="service2-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service2Description', value: newText });
                                        }}
                                    >
                                        Expert plumbing repairs and installations for your peace of mind.
                                    </EditableText>
                                    <BookingLink>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            style={{ borderColor: primaryColor, color: primaryColor }}
                                        >
                                            Book Now
                                        </Button>
                                    </BookingLink>
                                </CardContent>
                            </Card>

                            {/* Service Card 3 */}
                            <Card className="group hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6">
                                    <div className="mb-4 overflow-hidden rounded-lg">
                                        <EditableImage
                                            src={remodelingIcon}
                                            alt="Home Remodeling"
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                            sectionId="services"
                                            elementId="service3-image"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service3Image',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-2"
                                        sectionId="services"
                                        elementId="service3-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service3Title', value: newText });
                                        }}
                                    >
                                        Home Remodeling
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4"
                                        sectionId="services"
                                        elementId="service3-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'services', field: 'service3Description', value: newText });
                                        }}
                                    >
                                        Transform your space with our professional remodeling services.
                                    </EditableText>
                                    <BookingLink>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            style={{ borderColor: primaryColor, color: primaryColor }}
                                        >
                                            Book Now
                                        </Button>
                                    </BookingLink>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Professional Services Section */}
            <EditableSection
                sectionId="professional_services"
                sectionName="Professional Services"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('professional_services') : undefined}
                onSettings={onEditSection ? () => onEditSection('professional_services') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="order-2 lg:order-1">
                                <EditableImage
                                    src={professionalServicesImg}
                                    alt="Professional Services"
                                    className="w-full h-auto rounded-lg shadow-lg"
                                    sectionId="professional_services"
                                    elementId="prof-services-image"
                                    onUpdate={(newImageUrl) => {
                                        updateContentMutation.mutate({
                                            sectionId: 'professional_services',
                                            field: 'image',
                                            value: newImageUrl
                                        });
                                    }}
                                />
                            </div>
                            <div className="order-1 lg:order-2">
                                <EditableText
                                    element="h2"
                                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                    sectionId="professional_services"
                                    elementId="prof-services-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'professional_services', field: 'title', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'professional_services')?.title || 'Professional Services Built for Modern Homes'}
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600 mb-6 text-base md:text-lg"
                                    sectionId="professional_services"
                                    elementId="prof-services-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'professional_services', field: 'content', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'professional_services')?.content || 'We deliver reliable, professional home services that exceed expectations. Our team of experts is dedicated to maintaining and improving your living space.'}
                                </EditableText>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start">
                                        <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Certified and trained professionals</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">100% satisfaction guaranteed</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Transparent pricing with no hidden fees</span>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Available 7 days a week</span>
                                    </li>
                                </ul>
                                <BookingLink>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Get Started Today
                                    </Button>
                                </BookingLink>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Team Section */}
            <EditableSection
                sectionId="team"
                sectionName="Team Section"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('team') : undefined}
                onSettings={onEditSection ? () => onEditSection('team') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="team" className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 md:mb-16">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="team"
                                elementId="team-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'team', field: 'title', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'team')?.title || 'Our Expert Team Delivers Exceptional Home Service'}
                            </EditableText>
                            <EditableText
                                element="p"
                                className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto"
                                sectionId="team"
                                elementId="team-content"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'team', field: 'content', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'team')?.content || 'Meet our skilled professionals who are committed to excellence'}
                            </EditableText>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {/* Team Member 1 */}
                            <div className="text-center group">
                                <div className="relative w-48 h-48 mx-auto mb-6 overflow-hidden rounded-full">
                                    <EditableImage
                                        src={teamMember1}
                                        alt="Team Member"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="team"
                                        elementId="team-member1-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'team',
                                                field: 'member1Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-2"
                                    sectionId="team"
                                    elementId="team-member1-name"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member1Name', value: newText });
                                    }}
                                >
                                    Erick Reynolds
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600 mb-1"
                                    sectionId="team"
                                    elementId="team-member1-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member1Title', value: newText });
                                    }}
                                >
                                    Lead Technician
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-sm text-gray-500"
                                    sectionId="team"
                                    elementId="team-member1-experience"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member1Experience', value: newText });
                                    }}
                                >
                                    10+ years experience
                                </EditableText>
                            </div>

                            {/* Team Member 2 */}
                            <div className="text-center group">
                                <div className="relative w-48 h-48 mx-auto mb-6 overflow-hidden rounded-full">
                                    <EditableImage
                                        src={teamMember2}
                                        alt="Team Member"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="team"
                                        elementId="team-member2-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'team',
                                                field: 'member2Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-2"
                                    sectionId="team"
                                    elementId="team-member2-name"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member2Name', value: newText });
                                    }}
                                >
                                    Sarah Miller
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600 mb-1"
                                    sectionId="team"
                                    elementId="team-member2-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member2Title', value: newText });
                                    }}
                                >
                                    Cleaning Specialist
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-sm text-gray-500"
                                    sectionId="team"
                                    elementId="team-member2-experience"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member2Experience', value: newText });
                                    }}
                                >
                                    8+ years experience
                                </EditableText>
                            </div>

                            {/* Team Member 3 */}
                            <div className="text-center group">
                                <div className="relative w-48 h-48 mx-auto mb-6 overflow-hidden rounded-full">
                                    <EditableImage
                                        src={teamMember3}
                                        alt="Team Member"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="team"
                                        elementId="team-member3-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'team',
                                                field: 'member3Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-2"
                                    sectionId="team"
                                    elementId="team-member3-name"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member3Name', value: newText });
                                    }}
                                >
                                    Michael Chen
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600 mb-1"
                                    sectionId="team"
                                    elementId="team-member3-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member3Title', value: newText });
                                    }}
                                >
                                    Plumbing Expert
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-sm text-gray-500"
                                    sectionId="team"
                                    elementId="team-member3-experience"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'team', field: 'member3Experience', value: newText });
                                    }}
                                >
                                    12+ years experience
                                </EditableText>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Trusted Services Section */}
            <EditableSection
                sectionId="trusted_services"
                sectionName="Trusted Services"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('trusted_services') : undefined}
                onSettings={onEditSection ? () => onEditSection('trusted_services') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-blue-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div>
                                <EditableText
                                    element="h2"
                                    className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                    sectionId="trusted_services"
                                    elementId="trusted-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'trusted_services', field: 'title', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'trusted_services')?.title || 'Book Trusted Home Services With Confidence'}
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600 mb-6 text-base md:text-lg"
                                    sectionId="trusted_services"
                                    elementId="trusted-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'trusted_services', field: 'content', value: newText });
                                    }}
                                >
                                    {websiteSections.find(s => s.type === 'trusted_services')?.content || 'Your satisfaction is our priority. We stand behind every service with our quality guarantee.'}
                                </EditableText>
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h4 className="text-3xl md:text-4xl font-bold text-blue-600 mb-2" style={{ color: primaryColor }}>500+</h4>
                                        <p className="text-gray-600 text-sm">Happy Customers</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <h4 className="text-3xl md:text-4xl font-bold text-blue-600 mb-2" style={{ color: primaryColor }}>98%</h4>
                                        <p className="text-gray-600 text-sm">Satisfaction Rate</p>
                                    </div>
                                </div>
                                <BookingLink>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Book Your Service
                                    </Button>
                                </BookingLink>
                            </div>
                            <div>
                                <EditableImage
                                    src={trustedServicesImg}
                                    alt="Trusted Services"
                                    className="w-full h-auto rounded-lg shadow-lg"
                                    sectionId="trusted_services"
                                    elementId="trusted-services-image"
                                    onUpdate={(newImageUrl) => {
                                        updateContentMutation.mutate({
                                            sectionId: 'trusted_services',
                                            field: 'image',
                                            value: newImageUrl
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Pricing Section */}
            <EditableSection
                sectionId="pricing"
                sectionName="Pricing Plans"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('pricing') : undefined}
                onSettings={onEditSection ? () => onEditSection('pricing') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="pricing" className="py-12 md:py-20 bg-blue-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 md:mb-16">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="pricing"
                                elementId="pricing-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'pricing', field: 'title', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'pricing')?.title || 'Choose From Our Latest Plans And Pricings'}
                            </EditableText>
                            <EditableText
                                element="p"
                                className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto"
                                sectionId="pricing"
                                elementId="pricing-description"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'pricing', field: 'description', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'pricing')?.description || 'Transparent pricing for all your home service needs'}
                            </EditableText>
                        </div>

                        {allDisplayPricing.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                {allDisplayPricing.slice(0, 3).map((tier, index) => (
                                    <Card
                                        key={tier.id}
                                        className={`relative ${tier.isPopular ? 'ring-2 ring-blue-600 scale-105' : ''} bg-white hover:shadow-xl transition-all duration-300`}
                                    >
                                        {tier.isPopular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
                                                    Most Popular
                                                </span>
                                            </div>
                                        )}
                                        <CardContent className="p-6 md:p-8 text-center">
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{tier.name}</h3>
                                            <div className="mb-6">
                                                <span className="text-4xl md:text-5xl font-bold text-gray-900">${tier.price}</span>
                                            </div>
                                            <ul className="space-y-3 mb-8 text-left">
                                                {tier.features?.map((feature, featureIndex) => (
                                                    <li key={featureIndex} className="flex items-start">
                                                        <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                                        <span className="text-gray-600 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <BookingLink>
                                                <Button
                                                    className={`w-full ${tier.isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white hover:bg-gray-50'}`}
                                                    variant={tier.isPopular ? 'default' : 'outline'}
                                                    style={tier.isPopular ? { backgroundColor: primaryColor } : { borderColor: primaryColor, color: primaryColor }}
                                                >
                                                    {tier.buttonText || 'Book Now'}
                                                </Button>
                                            </BookingLink>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg">
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No Pricing Plans Available</h3>
                                <p className="text-sm text-gray-500">Add pricing tiers in your admin dashboard</p>
                            </div>
                        )}
                    </div>
                </section>
            </EditableSection>

            {/* Testimonials Section */}
            <EditableSection
                sectionId="testimonials"
                sectionName="Testimonials"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('testimonials') : undefined}
                onSettings={onEditSection ? () => onEditSection('testimonials') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Real Reviews From Happy Homeowners</h2>
                            <p className="text-gray-600">See what our customers have to say about our services</p>
                        </div>

                        {displayTestimonials.length > 0 && (
                            <div className="relative">
                                <Card className="bg-gray-50 border-0 shadow-lg">
                                    <CardContent className="p-6 md:p-12 text-center">
                                        <div className="flex justify-center mb-6">
                                            {Array.from({ length: displayTestimonials[currentTestimonial].rating }).map((_, i) => (
                                                <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-lg md:text-2xl text-gray-700 mb-8 italic leading-relaxed">
                                            "{displayTestimonials[currentTestimonial].testimonialText}"
                                        </p>
                                        <div className="flex items-center justify-center">
                                            <img
                                                src={displayTestimonials[currentTestimonial].customerImage}
                                                alt={displayTestimonials[currentTestimonial].customerName}
                                                className="w-16 h-16 rounded-full mr-4 object-cover"
                                            />
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900">{displayTestimonials[currentTestimonial].customerName}</p>
                                                <p className="text-gray-600">{displayTestimonials[currentTestimonial].customerTitle}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {displayTestimonials.length > 1 && (
                                    <div className="flex justify-center mt-8 space-x-4">
                                        <button
                                            onClick={prevTestimonial}
                                            className="bg-white hover:bg-gray-100 border border-gray-200 rounded-full p-3 transition-colors"
                                        >
                                            <ChevronLeft className="h-6 w-6 text-gray-600" />
                                        </button>
                                        <button
                                            onClick={nextTestimonial}
                                            className="bg-white hover:bg-gray-100 border border-gray-200 rounded-full p-3 transition-colors"
                                        >
                                            <ChevronRight className="h-6 w-6 text-gray-600" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </EditableSection>

            {/* Latest Insights/Blog Section */}
            <EditableSection
                sectionId="insights"
                sectionName="Latest Insights"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('insights') : undefined}
                onSettings={onEditSection ? () => onEditSection('insights') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 md:mb-16">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="insights"
                                elementId="insights-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'insights', field: 'title', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'insights')?.title || 'Home Care Tips, Insights And Updates'}
                            </EditableText>
                            <EditableText
                                element="p"
                                className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto"
                                sectionId="insights"
                                elementId="insights-content"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'insights', field: 'content', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'insights')?.content || 'Latest advice from our experts'}
                            </EditableText>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {/* Blog Card 1 */}
                            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="overflow-hidden">
                                    <EditableImage
                                        src={blogImg1}
                                        alt="Benefits of Regular Professional Cleaning"
                                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="insights"
                                        elementId="blog1-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'insights',
                                                field: 'blog1Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <CardContent className="p-6">
                                    <EditableText
                                        element="p"
                                        className="text-sm text-blue-600 mb-2"
                                        sectionId="insights"
                                        elementId="blog1-category"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog1Category', value: newText });
                                        }}
                                        style={{ color: primaryColor }}
                                    >
                                        Home Care Tips
                                    </EditableText>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-3"
                                        sectionId="insights"
                                        elementId="blog1-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog1Title', value: newText });
                                        }}
                                    >
                                        Benefits of Regular Professional Cleaning
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4 text-sm"
                                        sectionId="insights"
                                        elementId="blog1-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog1Description', value: newText });
                                        }}
                                    >
                                        Discover why regular cleaning maintains a healthy home environment...
                                    </EditableText>
                                    <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-semibold" style={{ color: primaryColor }}>
                                        Read More
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </CardContent>
                            </Card>

                            {/* Blog Card 2 */}
                            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="overflow-hidden">
                                    <EditableImage
                                        src={blogImg2}
                                        alt="Eco-Friendly Cleaning"
                                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="insights"
                                        elementId="blog2-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'insights',
                                                field: 'blog2Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <CardContent className="p-6">
                                    <EditableText
                                        element="p"
                                        className="text-sm text-blue-600 mb-2"
                                        sectionId="insights"
                                        elementId="blog2-category"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog2Category', value: newText });
                                        }}
                                        style={{ color: primaryColor }}
                                    >
                                        Sustainability
                                    </EditableText>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-3"
                                        sectionId="insights"
                                        elementId="blog2-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog2Title', value: newText });
                                        }}
                                    >
                                        Eco-Friendly Cleaning Solutions
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4 text-sm"
                                        sectionId="insights"
                                        elementId="blog2-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog2Description', value: newText });
                                        }}
                                    >
                                        Learn about environmentally conscious cleaning methods...
                                    </EditableText>
                                    <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-semibold" style={{ color: primaryColor }}>
                                        Read More
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </CardContent>
                            </Card>

                            {/* Blog Card 3 */}
                            <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="overflow-hidden">
                                    <EditableImage
                                        src={blogImg3}
                                        alt="How to Maintain a Clean House"
                                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                                        sectionId="insights"
                                        elementId="blog3-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'insights',
                                                field: 'blog3Image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                                <CardContent className="p-6">
                                    <EditableText
                                        element="p"
                                        className="text-sm text-blue-600 mb-2"
                                        sectionId="insights"
                                        elementId="blog3-category"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog3Category', value: newText });
                                        }}
                                        style={{ color: primaryColor }}
                                    >
                                        Maintenance
                                    </EditableText>
                                    <EditableText
                                        element="h3"
                                        className="text-xl font-bold text-gray-900 mb-3"
                                        sectionId="insights"
                                        elementId="blog3-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog3Title', value: newText });
                                        }}
                                    >
                                        How to Maintain a Clean House
                                    </EditableText>
                                    <EditableText
                                        element="p"
                                        className="text-gray-600 mb-4 text-sm"
                                        sectionId="insights"
                                        elementId="blog3-description"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'insights', field: 'blog3Description', value: newText });
                                        }}
                                    >
                                        Simple daily habits to keep your home spotless year-round...
                                    </EditableText>
                                    <a href="#" className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-semibold" style={{ color: primaryColor }}>
                                        Read More
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Contact Section */}
            <EditableSection
                sectionId="contact"
                sectionName="Contact"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('contact') : undefined}
                onSettings={onEditSection ? () => onEditSection('contact') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="contact" className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="contact"
                                elementId="contact-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'contact', field: 'title', value: newText });
                                }}
                            >
                                {websiteSections.find(s => s.type === 'contact')?.title || 'Keep In Touch'}
                            </EditableText>
                            <p className="text-gray-600 text-base md:text-lg">We're here to help with all your home service needs</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6 md:p-8">
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <Phone className="h-8 w-8 text-blue-600" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Call Us</h3>
                                    <p className="text-gray-600">{client?.phone || '(555) 123-4567'}</p>
                                </CardContent>
                            </Card>

                            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6 md:p-8">
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <Mail className="h-8 w-8 text-blue-600" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
                                    <p className="text-gray-600">{client?.email || 'info@homeservices.com'}</p>
                                </CardContent>
                            </Card>

                            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                                <CardContent className="p-6 md:p-8">
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <MapPin className="h-8 w-8 text-blue-600" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Visit Us</h3>
                                    <p className="text-gray-600">{client?.businessAddress || '123 Main St, City, State'}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-12 max-w-2xl mx-auto">
                            <LeadForm clientId={clientId || ''} />
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Footer */}
            <EditableSection
                sectionId="footer"
                sectionName="Footer"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('footer') : undefined}
                onSettings={onEditSection ? () => onEditSection('footer') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <footer className="bg-gray-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4">{businessName}</h3>
                                <p className="text-gray-400 mb-4">
                                    {websiteSections.find(s => s.type === 'footer')?.description || 'Your trusted home services partner'}
                                </p>
                                <div className="flex space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-white transition"><Facebook className="h-5 w-5" /></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition"><Instagram className="h-5 w-5" /></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition"><Twitter className="h-5 w-5" /></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition"><Linkedin className="h-5 w-5" /></a>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Services</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition">Home Cleaning</a></li>
                                    <li><a href="#" className="hover:text-white transition">Plumbing</a></li>
                                    <li><a href="#" className="hover:text-white transition">Remodeling</a></li>
                                    <li><a href="#" className="hover:text-white transition">Maintenance</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Company</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#" className="hover:text-white transition">About Us</a></li>
                                    <li><a href="#" className="hover:text-white transition">Our Team</a></li>
                                    <li><a href="#" className="hover:text-white transition">Careers</a></li>
                                    <li><a href="#" className="hover:text-white transition">Contact</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Newsletter</h4>
                                <p className="text-gray-400 mb-4">Stay updated with tips and offers</p>
                                <form onSubmit={handleNewsletterSubmit} className="flex">
                                    <Input
                                        type="email"
                                        placeholder="Your email"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        className="rounded-r-none bg-gray-800 border-gray-700 text-white"
                                    />
                                    <Button
                                        type="submit"
                                        className="rounded-l-none bg-blue-600 hover:bg-blue-700"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Subscribe
                                    </Button>
                                </form>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                            <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </EditableSection>
        </div>
    );
}
