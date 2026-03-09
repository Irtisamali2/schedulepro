import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Check, Star, Heart, Sparkles } from 'lucide-react';
import EditableText from '@/components/EditableText';
import EditableImage from '@/components/EditableImage';
import EditableSection from '@/components/EditableSection';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PetCareTemplateProps {
    clientId: string;
    websiteSections: any[];
    primaryColor?: string;
    secondaryColor?: string;
    businessName?: string;
    onEditSection?: (sectionId: string) => void;
    onDeleteSection?: (sectionId: string) => void;
    onDragStart?: (sectionId: string) => void;
    onDragOver?: (e: React.DragEvent, sectionId: string) => void;
    onDragEnd?: () => void;
    isBuilderPreview?: boolean;
}

// Asset paths
const heroImage = '/assets/pet-care/Hero section Dog.png';
const familyMemberImage = '/assets/pet-care/We treat your pet as a family member section.png';
const serviceIcon1 = '/assets/pet-care/Haircut of Choice.png';
const serviceIcon2 = '/assets/pet-care/Pawdicure.png';
const serviceIcon3 = '/assets/pet-care/Spa Baths.png';
const petGalleryImage = '/assets/pet-care/Pets images section.png';
const qualifiedCareLeft = '/assets/pet-care/Qualified personal care for all breeds section left image.png';
const qualifiedCareRight = '/assets/pet-care/Qualified personal care for all breeds section right image.png';
const starSectionImage = '/assets/pet-care/Where your pet is the star! section image.png';
const finalGalleryImage = '/assets/pet-care/last section pets images.png';
const starIcon = '/assets/pet-care/Satr.png';

export default function PetCareTemplate({
    clientId,
    websiteSections,
    primaryColor = '#FF8C42',
    secondaryColor = '#FFD6A5',
    businessName = 'PETCARE',
    onEditSection,
    onDeleteSection,
    onDragStart,
    onDragOver,
    onDragEnd,
    isBuilderPreview = false
}: PetCareTemplateProps) {
    const queryClient = useQueryClient();

    // Mutation to update website content
    const updateContentMutation = useMutation({
        mutationFn: async ({ sectionId, field, value }: { sectionId: string; field: string; value: string }) => {
            const response = await apiRequest(
                `/api/client/${clientId}/website/content`,
                'PUT',
                {
                    sectionId,
                    field,
                    value
                }
            );
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/public/client/${clientId}/website`] });
        }
    });

    return (
        <div className="min-h-screen bg-white font-sans">
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
                <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <EditableText
                                element="h1"
                                className="text-2xl font-bold tracking-wider"
                                sectionId="header"
                                elementId="logo"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'header', field: 'logoText', value: newText });
                                }}
                                style={{ color: primaryColor }}
                            >
                                {businessName}
                            </EditableText>

                            <nav className="hidden md:flex items-center space-x-8">
                                <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">Services</a>
                                <a href="#gallery" className="text-gray-600 hover:text-gray-900 transition-colors">Gallery</a>
                                <a href="#team" className="text-gray-600 hover:text-gray-900 transition-colors">Team</a>
                                <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
                                <Link href={`/booking/${clientId}`}>
                                    <Button
                                        className="text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Book Now
                                    </Button>
                                </Link>
                            </nav>
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
                <section className="py-12 md:py-20 bg-cream-50" style={{ backgroundColor: '#FFF8F0' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center text-center relative">
                            {/* Circular Text Effect - simplified for implementation */}
                            <div className="mb-8 relative">
                                <EditableText
                                    element="p"
                                    className="text-sm md:text-base uppercase tracking-widest text-gray-600 mb-4"
                                    sectionId="hero"
                                    elementId="hero-tagline"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'hero', field: 'content', value: newText });
                                    }}
                                >
                                    WHERE YOUR PET IS OUR PRIORITY
                                </EditableText>
                            </div>

                            {/* Hero Image - Circular */}
                            <div className="mb-8 relative">
                                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl">
                                    <EditableImage
                                        src={heroImage}
                                        alt="Happy Dog"
                                        className="w-full h-full object-cover"
                                        sectionId="hero"
                                        elementId="hero-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'hero',
                                                field: 'heroImage',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Main Heading */}
                            <EditableText
                                element="h2"
                                className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
                                sectionId="hero"
                                elementId="hero-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'hero', field: 'title', value: newText });
                                }}
                            >
                                WOOF!<br />DOGGIE WASH
                            </EditableText>

                            <EditableText
                                element="p"
                                className="text-base md:text-lg text-gray-600 max-w-2xl mb-8"
                                sectionId="hero"
                                elementId="hero-subtitle"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'hero', field: 'subtitle', value: newText });
                                }}
                            >
                                Professional grooming and care services for your beloved pets
                            </EditableText>

                            <Link href={`/booking/${clientId}`}>
                                <Button
                                    size="lg"
                                    className="text-white px-8 py-6 text-lg"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Book Appointment
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Family Member Section */}
            <EditableSection
                sectionId="family_member"
                sectionName="Family Member Section"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('family_member') : undefined}
                onSettings={onEditSection ? () => onEditSection('family_member') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <EditableText
                                    element="h2"
                                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
                                    sectionId="family_member"
                                    elementId="family-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'family_member', field: 'title', value: newText });
                                    }}
                                >
                                    We Treat Your Pet As A Family Member
                                </EditableText>

                                <EditableText
                                    element="p"
                                    className="text-gray-600 text-base md:text-lg leading-relaxed mb-6"
                                    sectionId="family_member"
                                    elementId="family-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'family_member', field: 'content', value: newText });
                                    }}
                                >
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                                </EditableText>

                                <Link href={`/booking/${clientId}`}>
                                    <Button
                                        size="lg"
                                        className="text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Learn More
                                    </Button>
                                </Link>
                            </div>

                            <div className="order-1 md:order-2">
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                    <EditableImage
                                        src={familyMemberImage}
                                        alt="Pet Care"
                                        className="w-full h-auto"
                                        sectionId="family_member"
                                        elementId="family-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'family_member',
                                                field: 'image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Services Section */}
            <EditableSection
                sectionId="services"
                sectionName="Services"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('services') : undefined}
                onSettings={onEditSection ? () => onEditSection('services') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="services" className="py-12 md:py-20" style={{ backgroundColor: '#FFF8F0' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="services"
                                elementId="services-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'services', field: 'title', value: newText });
                                }}
                            >
                                Our Premium Pet Services
                            </EditableText>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {/* Service 1 */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <EditableImage
                                            src={serviceIcon1}
                                            alt="Food Plan"
                                            className="w-16 h-16 object-contain"
                                            sectionId="services"
                                            elementId="service1-icon"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service1Icon',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-3"
                                    sectionId="services"
                                    elementId="service1-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service1Title', value: newText });
                                    }}
                                >
                                    Food Plan
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600"
                                    sectionId="services"
                                    elementId="service1-description"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service1Description', value: newText });
                                    }}
                                >
                                    Customized nutrition plans for your pet's health
                                </EditableText>
                            </div>

                            {/* Service 2 */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <EditableImage
                                            src={serviceIcon2}
                                            alt="Pet Spa"
                                            className="w-16 h-16 object-contain"
                                            sectionId="services"
                                            elementId="service2-icon"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service2Icon',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-3"
                                    sectionId="services"
                                    elementId="service2-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service2Title', value: newText });
                                    }}
                                >
                                    Pet Spa
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600"
                                    sectionId="services"
                                    elementId="service2-description"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service2Description', value: newText });
                                    }}
                                >
                                    Relaxing spa treatments and grooming services
                                </EditableText>
                            </div>

                            {/* Service 3 */}
                            <div className="text-center group">
                                <div className="mb-6 flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <EditableImage
                                            src={serviceIcon3}
                                            alt="24/7 Support"
                                            className="w-16 h-16 object-contain"
                                            sectionId="services"
                                            elementId="service3-icon"
                                            onUpdate={(newImageUrl) => {
                                                updateContentMutation.mutate({
                                                    sectionId: 'services',
                                                    field: 'service3Icon',
                                                    value: newImageUrl
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                                <EditableText
                                    element="h3"
                                    className="text-xl font-bold text-gray-900 mb-3"
                                    sectionId="services"
                                    elementId="service3-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service3Title', value: newText });
                                    }}
                                >
                                    24/7 Support
                                </EditableText>
                                <EditableText
                                    element="p"
                                    className="text-gray-600"
                                    sectionId="services"
                                    elementId="service3-description"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'services', field: 'service3Description', value: newText });
                                    }}
                                >
                                    Round-the-clock care and support for your pet
                                </EditableText>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Pet Gallery Section */}
            <EditableSection
                sectionId="pet_gallery"
                sectionName="Pet Gallery"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('pet_gallery') : undefined}
                onSettings={onEditSection ? () => onEditSection('pet_gallery') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section id="gallery" className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="pet_gallery"
                                elementId="gallery-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'pet_gallery', field: 'title', value: newText });
                                }}
                            >
                                Happy Pets Gallery
                            </EditableText>
                        </div>

                        {/* Gallery Image - Organic Shapes */}
                        <div className="flex justify-center">
                            <EditableImage
                                src={petGalleryImage}
                                alt="Happy Pets Gallery"
                                className="w-full max-w-5xl h-auto"
                                sectionId="pet_gallery"
                                elementId="gallery-image"
                                onUpdate={(newImageUrl) => {
                                    updateContentMutation.mutate({
                                        sectionId: 'pet_gallery',
                                        field: 'galleryImage',
                                        value: newImageUrl
                                    });
                                }}
                            />
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Qualified Care Section */}
            <EditableSection
                sectionId="qualified_care"
                sectionName="Qualified Care"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('qualified_care') : undefined}
                onSettings={onEditSection ? () => onEditSection('qualified_care') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20" style={{ backgroundColor: '#FFF8F0' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="relative">
                                    <EditableImage
                                        src={qualifiedCareLeft}
                                        alt="Pet Care Professional"
                                        className="w-full h-auto rounded-3xl shadow-xl"
                                        sectionId="qualified_care"
                                        elementId="care-image-left"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'qualified_care',
                                                field: 'imageLeft',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="order-1 md:order-2 space-y-6">
                                <EditableText
                                    element="h2"
                                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
                                    sectionId="qualified_care"
                                    elementId="care-title"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'qualified_care', field: 'title', value: newText });
                                    }}
                                >
                                    Qualified Personal Care For All Breeds
                                </EditableText>

                                <EditableText
                                    element="p"
                                    className="text-gray-600 text-base md:text-lg leading-relaxed mb-6"
                                    sectionId="qualified_care"
                                    elementId="care-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'qualified_care', field: 'content', value: newText });
                                    }}
                                >
                                    Our experienced team provides specialized care tailored to your pet's unique needs, ensuring they receive the best treatment possible.
                                </EditableText>

                                <ul className="space-y-4">
                                    <li className="flex items-start">
                                        <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Certified professional groomers</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Breed-specific grooming techniques</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Premium pet-safe products</span>
                                    </li>
                                    <li className="flex items-start">
                                        <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                                        <span className="text-gray-700">Compassionate and gentle care</span>
                                    </li>
                                </ul>

                                <div className="mt-6">
                                    <EditableImage
                                        src={qualifiedCareRight}
                                        alt="Happy Pet Owner"
                                        className="w-full h-auto rounded-3xl shadow-xl"
                                        sectionId="qualified_care"
                                        elementId="care-image-right"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'qualified_care',
                                                field: 'imageRight',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Star Section */}
            <EditableSection
                sectionId="star_section"
                sectionName="Star Section"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('star_section') : undefined}
                onSettings={onEditSection ? () => onEditSection('star_section') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <div>
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                    <EditableImage
                                        src={starSectionImage}
                                        alt="Your Pet is the Star"
                                        className="w-full h-auto"
                                        sectionId="star_section"
                                        elementId="star-image"
                                        onUpdate={(newImageUrl) => {
                                            updateContentMutation.mutate({
                                                sectionId: 'star_section',
                                                field: 'image',
                                                value: newImageUrl
                                            });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <img src={starIcon} alt="Star" className="w-12 h-12" />
                                    <EditableText
                                        element="h2"
                                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900"
                                        sectionId="star_section"
                                        elementId="star-title"
                                        onUpdate={(newText) => {
                                            updateContentMutation.mutate({ sectionId: 'star_section', field: 'title', value: newText });
                                        }}
                                    >
                                        Where Your Pet Is The Star!
                                    </EditableText>
                                </div>

                                <EditableText
                                    element="p"
                                    className="text-gray-600 text-base md:text-lg leading-relaxed mb-8"
                                    sectionId="star_section"
                                    elementId="star-content"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'star_section', field: 'content', value: newText });
                                    }}
                                >
                                    Every pet deserves to shine and feel special. We provide premium services that make your pet the star of the show with personalized attention and care.
                                </EditableText>

                                <Link href={`/booking/${clientId}`}>
                                    <Button
                                        size="lg"
                                        className="text-white"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Make Your Pet a Star
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </EditableSection>

            {/* Final Gallery Section */}
            <EditableSection
                sectionId="final_gallery"
                sectionName="Final Gallery"
                isEditable={isBuilderPreview}
                onDelete={onDeleteSection ? () => onDeleteSection('final_gallery') : undefined}
                onSettings={onEditSection ? () => onEditSection('final_gallery') : undefined}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <section className="py-12 md:py-20" style={{ backgroundColor: '#FFF8F0' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <EditableText
                                element="h2"
                                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                                sectionId="final_gallery"
                                elementId="final-gallery-title"
                                onUpdate={(newText) => {
                                    updateContentMutation.mutate({ sectionId: 'final_gallery', field: 'title', value: newText });
                                }}
                            >
                                More Happy Moments
                            </EditableText>
                        </div>

                        <div className="flex justify-center">
                            <EditableImage
                                src={finalGalleryImage}
                                alt="More Happy Pets"
                                className="w-full max-w-5xl h-auto"
                                sectionId="final_gallery"
                                elementId="final-gallery-image"
                                onUpdate={(newImageUrl) => {
                                    updateContentMutation.mutate({
                                        sectionId: 'final_gallery',
                                        field: 'galleryImage',
                                        value: newImageUrl
                                    });
                                }}
                            />
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
                                Get In Touch
                            </EditableText>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <Phone className="h-6 w-6" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                                    <p className="text-gray-600">(555) 123-4567</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <Mail className="h-6 w-6" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                                    <p className="text-gray-600">hello@petcare.com</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                                        <MapPin className="h-6 w-6" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                                    <p className="text-gray-600">123 Pet Street, City</p>
                                </CardContent>
                            </Card>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                                    {businessName}
                                </h3>
                                <EditableText
                                    element="p"
                                    className="text-gray-400 mb-4"
                                    sectionId="footer"
                                    elementId="footer-description"
                                    onUpdate={(newText) => {
                                        updateContentMutation.mutate({ sectionId: 'footer', field: 'description', value: newText });
                                    }}
                                >
                                    Your trusted pet care partner
                                </EditableText>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">Quick Links</h4>
                                <ul className="space-y-2 text-gray-400">
                                    <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                                    <li><a href="#gallery" className="hover:text-white transition-colors">Gallery</a></li>
                                    <li><a href="#team" className="hover:text-white transition-colors">Team</a></li>
                                    <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-4">Follow Us</h4>
                                <div className="flex gap-4">
                                    <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                                        <Facebook className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                                        <Instagram className="h-5 w-5" />
                                    </a>
                                    <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                                        <Twitter className="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
                            <p>&copy; 2024 {businessName}. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </EditableSection>
        </div>
    );
}
