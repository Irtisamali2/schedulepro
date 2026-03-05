import { WebsiteSection } from '@/components/FigmaDesignedWebsite';

export interface WebsiteTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    previewImage: string;
    primaryColor: string;
    secondaryColor: string;
    defaultSections: any[]; // Will be populated with template-specific sections
}

// Default template (current Graceful Hair beauty salon template)
const defaultTemplate: WebsiteTemplate = {
    id: 'default',
    name: 'Beauty & Wellness',
    description: 'Professional template for beauty salons, spas, and wellness centers',
    category: 'beauty',
    previewImage: '/templates/default-preview.png',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    defaultSections: [
        {
            id: 'header',
            type: 'header',
            title: 'Header',
            settings: {
                backgroundColor: '#FFFFFF',
            }
        },
        {
            id: 'hero',
            type: 'hero',
            title: 'Transform Your Look with Professional Hair Care',
            content: 'Experience luxury hair services that bring out your natural beauty',
            settings: {
                backgroundColor: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                heroImage: ''
            }
        },
        {
            id: 'staff',
            type: 'staff',
            title: 'Meet With Our Professional Staff',
            settings: {
                backgroundColor: '#F9FAFB'
            }
        },
        {
            id: 'pricing',
            type: 'pricing',
            title: 'Summer Hair Offers',
            description: 'Choose the perfect service for your hair care needs',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'testimonials',
            type: 'testimonials',
            title: 'What Our Clients Say',
            settings: {
                backgroundColor: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 100%)'
            }
        },
        {
            id: 'contact',
            type: 'contact',
            title: 'Get In Touch',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'newsletter',
            type: 'newsletter',
            title: 'Subscribe to the Hair Newsletter',
            description: 'Get exclusive tips, offers, and updates straight to your inbox',
            settings: {
                backgroundColor: '#F9FAFB'
            }
        },
        {
            id: 'footer',
            type: 'footer',
            description: 'Your trusted partner for beautiful, healthy hair',
            settings: {
                backgroundColor: '#1F2937'
            }
        }
    ]
};

// Home Services template (new template based on uploaded UI)
const homeServicesTemplate: WebsiteTemplate = {
    id: 'home_services',
    name: 'Home Services',
    description: 'Professional template for home cleaning, maintenance, and repair services',
    category: 'home_services',
    previewImage: '/templates/home-services-preview.png',
    primaryColor: '#3a86ff',
    secondaryColor: '#0077b6',
    defaultSections: [
        {
            id: 'header',
            type: 'header',
            title: 'Header',
            settings: {
                backgroundColor: '#FFFFFF',
                logoText: 'Home Services'
            }
        },
        {
            id: 'hero',
            type: 'hero',
            title: 'Reliable Home Cleaning and Maintenance Solutions',
            content: 'Professional services for your home, delivered by trained experts',
            settings: {
                backgroundColor: '#F8F9FA',
                heroImage: '',
                layout: 'home_services'
            }
        },
        {
            id: 'services',
            type: 'services',
            title: 'Everything Your Home Needs, Our Trained Techs Provide',
            content: 'From cleaning to repairs, we provide comprehensive home services',
            settings: {
                backgroundColor: '#FFFFFF',
                layout: 'grid'
            }
        },
        {
            id: 'professional_services',
            type: 'professional_services',
            title: 'Professional Services Built for Modern Homes',
            content: 'We deliver reliable, professional home services',
            settings: {
                backgroundColor: '#F8F9FA'
            }
        },
        {
            id: 'team',
            type: 'team',
            title: 'Our Expert Team Delivers Exceptional Home Service',
            content: 'Meet our skilled professionals',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'trusted_services',
            type: 'trusted_services',
            title: 'Book Trusted Home Services With Confidence',
            content: 'Your satisfaction is our priority',
            settings: {
                backgroundColor: '#F8F9FA'
            }
        },
        {
            id: 'pricing',
            type: 'pricing',
            title: 'Choose From Our Latest Plans And Pricings',
            description: 'Transparent pricing for all your home service needs',
            settings: {
                backgroundColor: '#EFF6FF',
                layout: 'cards'
            }
        },
        {
            id: 'testimonials',
            type: 'testimonials',
            title: 'Real Reviews From Happy Homeowners',
            settings: {
                backgroundColor: '#FFFFFF',
                layout: 'carousel'
            }
        },
        {
            id: 'insights',
            type: 'insights',
            title: 'Home Care Tips, Insights And Updates',
            content: 'Latest advice from our experts',
            settings: {
                backgroundColor: '#F8F9FA'
            }
        },
        {
            id: 'contact',
            type: 'contact',
            title: 'Keep In Touch',
            settings: {
                backgroundColor: '#FFFFFF',
                layout: 'grid'
            }
        },
        {
            id: 'footer',
            type: 'footer',
            description: 'Your trusted home services partner',
            settings: {
                backgroundColor: '#1a1a1a'
            }
        }
    ]
};

// Pet Care template
const petCareTemplate: WebsiteTemplate = {
    id: 'pet_care',
    name: 'Pet Care',
    description: 'Professional template for pet grooming, veterinary clinics, and pet care services',
    category: 'pet_care',
    previewImage: '/templates/pet-care-preview.png',
    primaryColor: '#FF8C42',
    secondaryColor: '#FFD6A5',
    defaultSections: [
        {
            id: 'header',
            type: 'header',
            title: 'Header',
            settings: {
                backgroundColor: '#FFFFFF',
                logoText: 'PETCARE'
            }
        },
        {
            id: 'hero',
            type: 'hero',
            title: 'WOOF! DOGGIE WASH',
            content: 'WHERE YOUR PET IS OUR PRIORITY',
            settings: {
                backgroundColor: '#FFF8F0',
                heroImage: '',
                layout: 'pet_care'
            }
        },
        {
            id: 'family_member',
            type: 'family_member',
            title: 'We Treat Your Pet As A Family Member',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'services',
            type: 'services',
            title: 'Our Premium Pet Services',
            content: 'Professional care for your beloved pets',
            settings: {
                backgroundColor: '#FFF8F0',
                layout: 'icons'
            }
        },
        {
            id: 'pet_gallery',
            type: 'pet_gallery',
            title: 'Happy Pets Gallery',
            settings: {
                backgroundColor: '#FFFFFF',
                layout: 'organic'
            }
        },
        {
            id: 'qualified_care',
            type: 'qualified_care',
            title: 'Qualified Personal Care For All Breeds',
            content: 'Our experienced team provides specialized care tailored to your pet\'s unique needs',
            settings: {
                backgroundColor: '#FFF8F0'
            }
        },
        {
            id: 'team',
            type: 'team',
            title: 'Meet Our Expert Team',
            content: 'Dedicated professionals who love animals',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'testimonials',
            type: 'testimonials',
            title: 'What Pet Parents Say',
            settings: {
                backgroundColor: '#FFF8F0',
                layout: 'carousel'
            }
        },
        {
            id: 'star_section',
            type: 'star_section',
            title: 'Where Your Pet Is The Star!',
            content: 'Every pet deserves to shine',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'final_gallery',
            type: 'final_gallery',
            title: 'More Happy Moments',
            settings: {
                backgroundColor: '#FFF8F0'
            }
        },
        {
            id: 'contact',
            type: 'contact',
            title: 'Get In Touch',
            settings: {
                backgroundColor: '#FFFFFF'
            }
        },
        {
            id: 'footer',
            type: 'footer',
            description: 'Your trusted pet care partner',
            settings: {
                backgroundColor: '#2C2C2C'
            }
        }
    ]
};

// Export all templates
export const websiteTemplates: WebsiteTemplate[] = [
    defaultTemplate,
    homeServicesTemplate,
    petCareTemplate
];

// Helper function to get template by ID
export const getTemplateById = (templateId: string): WebsiteTemplate | undefined => {
    return websiteTemplates.find(template => template.id === templateId);
};

// Helper function to get default sections for a template
export const getTemplateDefaultSections = (templateId: string): any[] => {
    const template = getTemplateById(templateId);
    return template?.defaultSections || defaultTemplate.defaultSections;
};
