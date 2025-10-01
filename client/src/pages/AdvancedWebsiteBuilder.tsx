import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Plus, Trash2, ArrowLeft, ArrowUp, ArrowDown, Smartphone, Monitor, Tablet, Type, Layout, Palette, Settings, Phone, Mail, Star, GripVertical, Image, Columns, Square, MousePointer, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import FigmaDesignedWebsite from "@/components/FigmaDesignedWebsite";
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WebsiteElement {
  id: string;
  type: 'text' | 'button' | 'image' | 'spacer' | 'reviews';
  content?: string;
  settings?: {
    fontSize?: string;
    fontWeight?: 'normal' | 'bold' | string;
    textColor?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    alignment?: 'left' | 'center' | 'right';
    textAlign?: string;
    width?: string;
    height?: string;
    link?: string;
    imageUrl?: string;
    alt?: string;
    altText?: string;
    buttonLink?: string;
    hoverColor?: string;
    display?: string;
    borderWidth?: string;
    borderColor?: string;
    objectFit?: string;
    mobileFontSize?: string;
    mobileTextAlign?: string;
    mobileWidth?: string;
    mobileHeight?: string;
    mobileDisplay?: string;
    reviews?: Array<{
      id: string;
      name: string;
      rating: number;
      text: string;
      date?: string;
    }>;
    reviewStyle?: 'carousel' | 'grid';
  };
}

interface WebsiteColumn {
  id: string;
  width: 'auto' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4' | 'custom';
  customWidth?: string;
  elements: WebsiteElement[];
  settings?: {
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    verticalAlign?: 'top' | 'center' | 'bottom';
  };
}

interface WebsiteSection {
  id: string;
  type: 'header' | 'hero' | 'about' | 'services' | 'contact-info' | 'contact-form' | 'lead-form' | 'testimonials' | 'gallery' | 'text' | 'image' | 'columns' | 'spacer' | 'staff' | 'pricing' | 'newsletter' | 'booking' | 'footer';
  title?: string;
  content?: string;
  columns?: WebsiteColumn[];
  settings?: {
    backgroundColor?: string;
    textColor?: string;
    backgroundImage?: string;
    backgroundType?: 'color' | 'gradient' | 'image';
    gradientType?: 'linear' | 'radial';
    gradientDirection?: string;
    gradientColors?: string[];
    alignment?: 'left' | 'center' | 'right';
    padding?: 'small' | 'medium' | 'large' | 'custom';
    customPadding?: string;
    fontSize?: 'small' | 'medium' | 'large';
    width?: 'full' | 'container' | 'custom';
    customWidth?: string;
    height?: 'auto' | 'screen' | 'custom';
    customHeight?: string;
    marginTop?: string;
    marginBottom?: string;
    responsive?: {
      mobile?: {
        padding?: string;
        fontSize?: string;
        alignment?: string;
      };
      tablet?: {
        padding?: string;
        fontSize?: string;
        alignment?: string;
      };
    };
    heroImage?: string;
    heroImageAlt?: string;
    staffMembers?: Array<{
      id: string;
      name: string;
      title: string;
      experience: string;
      profileImage: string;
    }>;
    pricingTiers?: Array<{
      id: string;
      name: string;
      price: number;
      features: string[];
      isPopular: boolean;
      buttonText: string;
    }>;
    testimonials?: Array<{
      id: string;
      customerName: string;
      customerTitle: string;
      testimonialText: string;
      customerImage: string;
      rating: number;
    }>;
  };
  data?: {
    phone?: string;
    email?: string;
    address?: string;
    buttonText?: string;
    buttonLink?: string;
    items?: Array<{
      title: string;
      description: string;
      price?: string;
    }>;
  };
}

interface WebsiteData {
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  sections: WebsiteSection[];
}

interface ClientData {
  client: {
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    businessAddress: string;
    industry: string;
    status: string;
    planId: string;
  };
}

// Reviews Carousel Component
function ReviewsCarousel({ element }: { element: WebsiteElement }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviews = element.settings?.reviews || [];
  
  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };
  
  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!reviews.length) {
    return (
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Reviews Added</h3>
        <p className="text-sm text-gray-500">Add customer reviews to display here</p>
      </div>
    );
  }

  if (element.settings?.reviewStyle === 'grid') {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
          {element.content || 'Customer Reviews'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-600">({review.rating}/5)</span>
              </div>
              <p className="text-gray-700 mb-4 italic">"{review.text}"</p>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{review.name}</p>
                {review.date && (
                  <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel view (default)
  return (
    <div className="py-8 px-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
        {element.content || 'Customer Reviews'}
      </h2>
      <div className="max-w-4xl mx-auto relative">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center min-h-[300px] flex flex-col justify-center">
          <div className="flex justify-center mb-6">
            {renderStars(reviews[currentIndex].rating)}
          </div>
          <blockquote className="text-xl text-gray-700 mb-6 italic leading-relaxed">
            "{reviews[currentIndex].text}"
          </blockquote>
          <div>
            <p className="font-bold text-lg text-gray-900">{reviews[currentIndex].name}</p>
            {reviews[currentIndex].date && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(reviews[currentIndex].date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {reviews.length > 1 && (
          <>
            <button
              onClick={prevReview}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
            
            {/* Pagination dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdvancedWebsiteBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get clientId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('clientId');
  
  // Get client data
  const { data: clientData } = useQuery<ClientData>({
    queryKey: [`/api/client/${clientId}/dashboard`],
    enabled: !!clientId
  });

  // Get existing website data
  const { data: existingWebsite } = useQuery<any>({
    queryKey: [`/api/client/${clientId}/website`],
    enabled: !!clientId
  });

  const [websiteData, setWebsiteData] = useState<WebsiteData>({
    title: "My Business Website",
    description: "Professional website for my business",
    primaryColor: "#3B82F6",
    secondaryColor: "#F3F4F6",
    sections: [
      {
        id: "hero",
        type: "hero",
        title: "Welcome to Our Business",
        content: "We provide exceptional service and results for our clients.",
        settings: { backgroundColor: "#3B82F6", textColor: "#FFFFFF", alignment: "center", padding: "large" }
      },
      {
        id: "about",
        type: "about",
        title: "About Us",
        content: "Learn about our story, mission, and what makes us different.",
        settings: { backgroundColor: "#FFFFFF", textColor: "#1F2937", alignment: "left", padding: "medium" }
      }
    ]
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'section' | 'column' | 'element'>('section');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [draggedElement, setDraggedElement] = useState<{ sectionId: string; columnId: string; elementId: string; index: number } | null>(null);

  // Initialize with existing website data or create full default structure
  useEffect(() => {
    if (existingWebsite && existingWebsite.sections) {
      // Load existing website data
      try {
        const sections = typeof existingWebsite.sections === 'string' 
          ? JSON.parse(existingWebsite.sections) 
          : existingWebsite.sections;
        setWebsiteData({
          title: existingWebsite.title,
          description: existingWebsite.description || "",
          primaryColor: existingWebsite.primaryColor || "#ec4899",
          secondaryColor: existingWebsite.secondaryColor || "#a855f7",
          sections: sections
        });
      } catch (e) {
        console.error('Error parsing existing website sections:', e);
        // If parsing fails, initialize with current layout structure
        initializeWithCurrentLayout();
      }
    } else if (clientData?.client) {
      // Initialize with complete current layout structure
      initializeWithCurrentLayout();
    }
  }, [clientData, existingWebsite]);

  // Function to initialize with complete current layout structure
  const initializeWithCurrentLayout = () => {
    setWebsiteData(prev => ({
      ...prev,
      title: `${clientData?.client?.businessName || 'Graceful Hair'} - Professional Hair Salon`,
      description: `${clientData?.client?.businessName || 'Graceful Hair'} - Professional hair care and styling services`,
      primaryColor: "#ec4899", // Pink from current layout
      secondaryColor: "#a855f7", // Purple from current layout
      sections: [
        {
          id: "hero",
          type: "hero",
          title: `${clientData?.client?.businessName || 'Graceful Hair'}`,
          content: "Truly, yours.\nExperience premium hair care with our professional stylists",
          settings: { 
            backgroundType: "gradient",
            gradientType: "linear",
            gradientDirection: "135deg",
            gradientColors: ["#ec4899", "#a855f7"],
            textColor: "#FFFFFF", 
            alignment: "left", 
            padding: "large",
            height: "screen",
            heroImage: "/assets/Image (3)_1757807495639.png",
            heroImageAlt: "Woman with beautiful hair"
          },
          data: {
            buttonText: "Book Appointment",
            buttonLink: "#contact"
          }
        },
        {
          id: "staff",
          type: "staff", 
          title: "Meet With Our Professional Staff",
          content: "Our experienced team of hair professionals",
          settings: { 
            backgroundColor: "#F9FAFB", 
            textColor: "#1F2937", 
            alignment: "center", 
            padding: "large",
            staffMembers: [
              {
                id: "1",
                name: "Mara Olsen",
                title: "Senior Stylist", 
                experience: "8 years experience",
                profileImage: "/assets/Ellipse 54_1757064789129.png"
              },
              {
                id: "2", 
                name: "Jess Nunez",
                title: "Hair Specialist",
                experience: "6 years experience", 
                profileImage: "/assets/Ellipse 55_1757064789130.png"
              },
              {
                id: "3",
                name: "Dana Welch", 
                title: "Color Expert",
                experience: "5 years experience",
                profileImage: "/assets/Ellipse 56_1757064789131.png"
              }
            ]
          }
        },
        {
          id: "pricing",
          type: "pricing",
          title: "Summer Hair Hair Offers",
          content: "Choose the perfect service for your hair care needs", 
          settings: { 
            backgroundColor: "#FFFFFF", 
            textColor: "#1F2937", 
            alignment: "center", 
            padding: "large",
            pricingTiers: [
              {
                id: "1",
                name: "Hair Dryer",
                price: 30,
                features: ["Basic wash", "Blow dry", "Simple styling"],
                isPopular: false,
                buttonText: "Book Now"
              },
              {
                id: "2", 
                name: "Hair Washer", 
                price: 40,
                features: ["Deep cleanse", "Conditioning", "Scalp massage"],
                isPopular: true,
                buttonText: "Book Now"
              },
              {
                id: "3",
                name: "Hair Developer",
                price: 70, 
                features: ["Cut & style", "Deep conditioning", "Hair treatment", "Consultation"],
                isPopular: true,
                buttonText: "Book Now"
              },
              {
                id: "4",
                name: "Hair Color",
                price: 100,
                features: ["Full color service", "Premium products", "Expert consultation", "After-care"],
                isPopular: false, 
                buttonText: "Book Now"
              }
            ]
          }
        },
        {
          id: "testimonials",
          type: "testimonials",
          title: "What Our Clients Say",
          content: "Read testimonials from our satisfied customers",
          settings: { 
            backgroundType: "gradient",
            gradientType: "linear", 
            gradientDirection: "135deg",
            gradientColors: ["#1e1b4b", "#581c87"],
            textColor: "#FFFFFF", 
            alignment: "center", 
            padding: "large",
            testimonials: [
              {
                id: "1",
                customerName: "Sarah Johnson",
                customerTitle: "Hair Influencer",
                testimonialText: "Graceful Hair has been my go-to salon for years. The stylists are incredible!",
                customerImage: "/assets/Ellipse 57_1757064789131.png",
                rating: 5
              }
            ]
          }
        },
        {
          id: "newsletter", 
          type: "newsletter",
          title: "Subscribe to the Hair Newsletter",
          content: "Get exclusive tips, offers, and updates straight to your inbox",
          settings: { 
            backgroundColor: "#F9FAFB", 
            textColor: "#1F2937", 
            alignment: "center", 
            padding: "large"
          }
        },
        {
          id: "booking",
          type: "booking",
          title: "Schedule your hair experience", 
          content: "Ready to transform your look? Fill out the form and we'll get back to you to schedule your appointment.",
          settings: { 
            backgroundColor: "#FFFFFF", 
            textColor: "#1F2937", 
            alignment: "left", 
            padding: "large"
          }
        },
        {
          id: "footer",
          type: "footer",
          title: "Footer",
          content: "Business information and social links",
          settings: { 
            backgroundColor: "#581c87", 
            textColor: "#FFFFFF", 
            alignment: "left", 
            padding: "large"
          },
          data: {
            phone: clientData?.client?.phone || "(555) 123-4567",
            email: clientData?.client?.email || "info@gracefulhair.com", 
            address: clientData?.client?.businessAddress || "123 Beauty St, Hair City"
          }
        }
      ]
    }));
  };

  // Section management functions
  const addSection = (type: WebsiteSection['type']) => {
    const sectionTemplates = {
      header: { title: "Header", content: "Navigation and business logo" },
      hero: { title: "Hero Section", content: "Graceful Hair\nTruly, yours." },
      about: { title: "About Us", content: "Learn more about our story and mission." },
      services: { title: "Our Services", content: "Discover what we can do for you." },
      staff: { title: "Meet With Our Professional Staff", content: "Professional team members" },
      pricing: { title: "Summer Hair Hair Offers", content: "Choose the perfect service for your hair care needs" },
      'contact-info': { title: "Contact Information", content: "Get in touch with us through multiple channels." },
      'contact-form': { title: "Contact Form", content: "Send us a message and we'll get back to you soon." },
      'lead-form': { title: "Get a Quote", content: "Tell us about your needs and we'll contact you with a personalized quote." },
      testimonials: { title: "What Our Clients Say", content: "Read testimonials from our satisfied customers." },
      newsletter: { title: "Subscribe to the Hair Newsletter", content: "Get exclusive tips, offers, and updates straight to your inbox" },
      booking: { title: "Schedule your hair experience", content: "Ready to transform your look? Fill out the form and we'll get back to you to schedule your appointment." },
      footer: { title: "Footer", content: "Business information and social links" },
      gallery: { title: "Gallery", content: "View our portfolio and past work." },
      text: { title: "Text Section", content: "Add your custom text content here." },
      image: { title: "Image Section", content: "Add an image with caption." },
      columns: { title: "Column Layout", content: "" },
      spacer: { title: "Spacer", content: "" }
    };

    const template = sectionTemplates[type];
    const newSection: WebsiteSection = {
      id: `section_${Date.now()}`,
      type,
      title: template.title,
      content: template.content,
      settings: {
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        backgroundType: "color",
        alignment: "left",
        padding: "medium",
        fontSize: "medium",
        width: "container",
        height: "auto",
        responsive: {
          mobile: { padding: "small", fontSize: "small", alignment: "center" },
          tablet: { padding: "medium", fontSize: "medium", alignment: "left" }
        }
      },
      columns: type === 'columns' ? [
        {
          id: `column_${Date.now()}_1`,
          width: '1/2',
          elements: [{
            id: `element_${Date.now()}_1`,
            type: 'text',
            content: 'Column 1 content',
            settings: { fontSize: '16px', textColor: '#1F2937' }
          }]
        },
        {
          id: `column_${Date.now()}_2`,
          width: '1/2',
          elements: [{
            id: `element_${Date.now()}_2`,
            type: 'text',
            content: 'Column 2 content',
            settings: { fontSize: '16px', textColor: '#1F2937' }
          }]
        }
      ] : undefined,
      data: type === 'contact-info' ? {
        phone: clientData?.client?.phone || "555-0101",
        email: clientData?.client?.email || "info@business.com", 
        address: clientData?.client?.businessAddress || "Business Address"
      } : type === 'hero' ? {
        buttonText: "Book Appointment",
        buttonLink: "/booking"
      } : undefined
    };

    setWebsiteData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setSelectedSection(newSection.id);
    setEditMode('section');
  };

  const addColumn = (sectionId: string) => {
    const newColumn: WebsiteColumn = {
      id: `column_${Date.now()}`,
      width: 'auto',
      elements: [{
        id: `element_${Date.now()}`,
        type: 'text',
        content: 'New column content',
        settings: { fontSize: '16px', textColor: '#1F2937' }
      }]
    };

    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? { ...section, columns: [...(section.columns || []), newColumn] }
          : section
      )
    }));
  };

  const addElement = (columnId: string, type: WebsiteElement['type']) => {
    const elementTemplates = {
      text: { content: 'Your text content here' },
      button: { content: 'Button Text' },
      image: { content: '' },
      spacer: { content: '' },
      reviews: { content: 'Customer Reviews' }
    };

    const template = elementTemplates[type];
    const newElement: WebsiteElement = {
      id: `element_${Date.now()}`,
      type,
      content: template.content,
      settings: {
        fontSize: type === 'text' ? '16px' : undefined,
        textColor: '#1F2937',
        backgroundColor: type === 'button' ? '#3B82F6' : undefined,
        padding: type === 'button' ? '12px 24px' : undefined,
        borderRadius: type === 'button' ? '6px' : undefined,
        height: type === 'spacer' ? '40px' : undefined,
        reviews: type === 'reviews' ? [
          {
            id: '1',
            name: 'Sarah Johnson',
            rating: 5,
            text: 'Amazing service! Highly recommend to everyone.',
            date: '2024-01-15'
          },
          {
            id: '2',
            name: 'Mike Chen',
            rating: 5,
            text: 'Professional, reliable, and exceeded expectations.',
            date: '2024-01-10'
          },
          {
            id: '3',
            name: 'Lisa Rodriguez',
            rating: 5,
            text: 'Outstanding quality and customer service.',
            date: '2024-01-05'
          }
        ] : undefined,
        reviewStyle: type === 'reviews' ? 'carousel' : undefined
      }
    };

    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section => ({
        ...section,
        columns: section.columns?.map(column =>
          column.id === columnId 
            ? { ...column, elements: [...column.elements, newElement] }
            : column
        )
      }))
    }));
    
    setSelectedElement(newElement.id);
    setEditMode('element');
  };

  const deleteElement = (sectionId: string, columnId: string, elementId: string) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              columns: section.columns?.map(column =>
                column.id === columnId
                  ? {
                      ...column,
                      elements: column.elements.filter(element => element.id !== elementId)
                    }
                  : column
              )
            }
          : section
      )
    }));
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
      setEditMode('column');
    }
  };

  const deleteColumn = (sectionId: string, columnId: string) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              columns: section.columns?.filter(column => column.id !== columnId)
            }
          : section
      )
    }));
    
    if (selectedColumn === columnId) {
      setSelectedColumn(null);
      setSelectedElement(null);
      setEditMode('section');
    }
  };

  const addColumnRow = (sectionId: string) => {
    // Add a full-width column that creates a new "row"
    const newColumn: WebsiteColumn = {
      id: `column_${Date.now()}`,
      width: 'auto',
      elements: [{
        id: `element_${Date.now()}`,
        type: 'text',
        content: 'New row content',
        settings: { fontSize: '16px', textColor: '#1F2937' }
      }]
    };

    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? { ...section, columns: [...(section.columns || []), newColumn] }
          : section
      )
    }));
  };

  // Move element function for drag and drop
  const moveElement = (draggedElement: { sectionId: string; columnId: string; elementId: string; index: number }, targetSectionId: string, targetColumnId: string, targetIndex: number) => {
    setWebsiteData(prev => {
      const newSections = [...prev.sections];
      
      // Find source section and column
      const sourceSection = newSections.find(s => s.id === draggedElement.sectionId);
      const sourceColumn = sourceSection?.columns?.find(c => c.id === draggedElement.columnId);
      
      // Find target section and column
      const targetSection = newSections.find(s => s.id === targetSectionId);
      const targetColumn = targetSection?.columns?.find(c => c.id === targetColumnId);
      
      if (!sourceColumn || !targetColumn) return prev;
      
      // Remove element from source
      const elementToMove = sourceColumn.elements[draggedElement.index];
      sourceColumn.elements.splice(draggedElement.index, 1);
      
      // Add element to target position
      targetColumn.elements.splice(targetIndex, 0, elementToMove);
      
      return { ...prev, sections: newSections };
    });
  };

  // Add element to any section (not just columns)
  const addElementToSection = (sectionId: string, type: WebsiteElement['type']) => {
    const elementTemplates = {
      text: { content: 'Your text content here' },
      button: { content: 'Button Text' },
      image: { content: '' },
      spacer: { content: '' },
      reviews: { content: 'Customer Reviews' }
    };

    const template = elementTemplates[type];
    const newElement: WebsiteElement = {
      id: `element_${Date.now()}`,
      type,
      content: template.content,
      settings: {
        fontSize: type === 'text' ? '16px' : undefined,
        textColor: '#1F2937',
        backgroundColor: type === 'button' ? '#3B82F6' : undefined,
        padding: type === 'button' ? '12px 24px' : undefined,
        borderRadius: type === 'button' ? '6px' : undefined,
        height: type === 'spacer' ? '40px' : undefined,
        reviews: type === 'reviews' ? [
          {
            id: '1',
            name: 'Sarah Johnson',
            rating: 5,
            text: 'Amazing service! Highly recommend to everyone.',
            date: '2024-01-15'
          },
          {
            id: '2',
            name: 'Mike Chen',
            rating: 5,
            text: 'Professional, reliable, and exceeded expectations.',
            date: '2024-01-10'
          },
          {
            id: '3',
            name: 'Lisa Rodriguez',
            rating: 5,
            text: 'Outstanding quality and customer service.',
            date: '2024-01-05'
          }
        ] : undefined,
        reviewStyle: type === 'reviews' ? 'carousel' : undefined
      }
    };

    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          // If section doesn't have columns, create a default column
          if (!section.columns || section.columns.length === 0) {
            return {
              ...section,
              columns: [{
                id: `column_${Date.now()}`,
                width: 'auto',
                elements: [newElement]
              }]
            };
          } else {
            // Add to first column
            return {
              ...section,
              columns: section.columns.map((column, index) => 
                index === 0 
                  ? { ...column, elements: [...column.elements, newElement] }
                  : column
              )
            };
          }
        }
        return section;
      })
    }));
    
    setSelectedElement(newElement.id);
    setEditMode('element');
  };

  const updateSection = (id: string, field: keyof WebsiteSection, value: any) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    }));
  };

  const updateSectionSettings = (id: string, settings: Partial<WebsiteSection['settings']>) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id 
          ? { ...section, settings: { ...section.settings, ...settings } }
          : section
      )
    }));
  };

  const updateSectionData = (id: string, data: Partial<WebsiteSection['data']>) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === id 
          ? { ...section, data: { ...section.data, ...data } }
          : section
      )
    }));
  };

  const updateColumn = (sectionId: string, columnId: string, updates: Partial<WebsiteColumn>) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              columns: section.columns?.map(column =>
                column.id === columnId 
                  ? { ...column, ...updates }
                  : column
              )
            }
          : section
      )
    }));
  };

  const updateElement = (sectionId: string, columnId: string, elementId: string, updates: Partial<WebsiteElement>) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId 
          ? {
              ...section,
              columns: section.columns?.map(column =>
                column.id === columnId
                  ? {
                      ...column,
                      elements: column.elements.map(element =>
                        element.id === elementId
                          ? { ...element, ...updates }
                          : element
                      )
                    }
                  : column
              )
            }
          : section
      )
    }));
  };

  // Helper functions to get selected items
  const getSelectedSection = () => {
    return websiteData.sections.find(section => section.id === selectedSection);
  };

  const getSelectedColumn = () => {
    const section = getSelectedSection();
    return section?.columns?.find(column => column.id === selectedColumn);
  };

  const getSelectedElement = () => {
    const column = getSelectedColumn();
    return column?.elements.find(element => element.id === selectedElement);
  };

  const deleteSection = (id: string) => {
    setWebsiteData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== id)
    }));
    if (selectedSection === id) {
      setSelectedSection(null);
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    setWebsiteData(prev => {
      const newSections = [...prev.sections];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);
      return { ...prev, sections: newSections };
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveSection(dragIndex, dropIndex);
    }
  };

  // Save website mutation
  const saveWebsiteMutation = useMutation({
    mutationFn: async (data: WebsiteData) => {
      const method = existingWebsite ? 'PUT' : 'POST';
      const response = await fetch(`/api/client/${clientId}/website`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          heroImage: '',
          contactInfo: JSON.stringify({ phone: clientData?.client?.phone || '', email: clientData?.client?.email || '' }),
          socialLinks: JSON.stringify({}),
          sections: JSON.stringify(data.sections), // Save sections as JSON
          showPrices: true,
          allowOnlineBooking: true,
          isPublished: true,
          subdomain: clientData?.client?.businessName?.toLowerCase().replace(/\s+/g, '-') || 'business'
        })
      });
      if (!response.ok) throw new Error('Failed to save website');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/client/${clientId}/website`] });
      toast({
        title: "Website Saved",
        description: "Your website has been successfully saved and published.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save website. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (import.meta.env.DEV) {
      console.log('📝 AdvancedWebsiteBuilder: Saving website data');
      console.log('📝 Total sections:', websiteData.sections.length);
      websiteData.sections.forEach((section, idx) => {
        console.log(`📝 Section ${idx}: ${section.type} - ${section.title || 'No title'}`);
        if (section.columns) {
          section.columns.forEach((col, colIdx) => {
            console.log(`  📝 Column ${colIdx}: ${col.elements.length} elements`);
            col.elements.forEach((el, elIdx) => {
              console.log(`    📝 Element ${elIdx}: ${el.type} - Content: "${el.content?.substring(0, 50) || 'No content'}"`);
            });
          });
        }
      });
    }
    saveWebsiteMutation.mutate(websiteData);
  };

  const selectedSectionData = websiteData.sections.find(s => s.id === selectedSection);

  const getDeviceIcon = (mode: 'desktop' | 'tablet' | 'mobile') => {
    switch (mode) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
    }
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'desktop': return '100%';
      case 'tablet': return '768px';
      case 'mobile': return '375px';
    }
  };

  const getPaddingClass = (padding?: string) => {
    switch (padding) {
      case 'small': return 'p-2 sm:p-4';
      case 'large': return 'p-6 sm:p-8 lg:p-12';
      default: return 'p-4 sm:p-6 lg:p-8';
    }
  };

  const getAlignmentClass = (alignment?: string) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getFontSizeClass = (fontSize?: string) => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case 'full': return 'w-full';
      case 'container': return 'max-w-6xl mx-auto';
      case 'custom': return '';
      default: return 'max-w-6xl mx-auto';
    }
  };

  const getHeightClass = (height?: string) => {
    switch (height) {
      case 'screen': return 'min-h-screen';
      case 'custom': return '';
      default: return '';
    }
  };

  const getBackgroundStyle = (settings?: WebsiteSection['settings']) => {
    if (!settings) return {};
    
    const style: React.CSSProperties = {};
    
    if (settings.backgroundType === 'gradient') {
      const colors = settings.gradientColors || ['#3B82F6', '#1E40AF'];
      if (settings.gradientType === 'radial') {
        style.background = `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 100%)`;
      } else {
        const direction = settings.gradientDirection || 'to right';
        style.background = `linear-gradient(${direction}, ${colors[0]} 0%, ${colors[1]} 100%)`;
      }
    } else if (settings.backgroundType === 'image' && settings.backgroundImage) {
      style.backgroundImage = `url(${settings.backgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    } else {
      style.backgroundColor = settings.backgroundColor || '#FFFFFF';
    }
    
    if (settings.width === 'custom' && settings.customWidth) {
      style.width = settings.customWidth;
    }
    
    if (settings.height === 'custom' && settings.customHeight) {
      style.height = settings.customHeight;
    }
    
    style.color = settings.textColor || '#1F2937';
    
    return style;
  };

  const getSectionContainerClass = (settings?: WebsiteSection['settings']) => {
    const classes = [];
    classes.push(getWidthClass(settings?.width));
    classes.push(getHeightClass(settings?.height));
    classes.push(getPaddingClass(settings?.padding));
    classes.push(getAlignmentClass(settings?.alignment));
    return classes.filter(Boolean).join(' ');
  };

  const getColumnWidthClass = (width: WebsiteColumn['width']) => {
    // Mobile-first responsive classes
    switch (width) {
      case '1/2': return 'w-full md:w-1/2';
      case '1/3': return 'w-full md:w-1/3';
      case '2/3': return 'w-full md:w-2/3';
      case '1/4': return 'w-full sm:w-1/2 lg:w-1/4';
      case '3/4': return 'w-full md:w-3/4';
      case 'auto': return 'w-full md:flex-1';
      default: return 'w-full md:flex-1';
    }
  };

  const getResponsiveGridClass = (columnCount: number) => {
    // Responsive grid classes based on column count
    if (columnCount === 1) return 'grid-cols-1';
    if (columnCount === 2) return 'grid-cols-1 md:grid-cols-2';
    if (columnCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (columnCount >= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2';
  };

  const renderElement = (element: WebsiteElement) => {
    const isMobile = window.innerWidth < 768;
    
    const style: React.CSSProperties = {
      fontSize: isMobile ? (element.settings?.mobileFontSize || element.settings?.fontSize) : element.settings?.fontSize,
      color: element.settings?.textColor,
      backgroundColor: element.settings?.backgroundColor,
      padding: element.settings?.padding,
      margin: element.settings?.margin,
      borderRadius: element.settings?.borderRadius,
      textAlign: isMobile ? (element.settings?.mobileTextAlign || element.settings?.textAlign) as any : element.settings?.textAlign as any,
      width: isMobile ? (element.settings?.mobileWidth || element.settings?.width) : element.settings?.width,
      height: isMobile && element.settings?.mobileHeight ? element.settings.mobileHeight : element.settings?.height,
      fontWeight: element.settings?.fontWeight,
      display: isMobile ? (element.settings?.mobileDisplay || element.settings?.display) : element.settings?.display,
      border: element.settings?.borderWidth ? `${element.settings.borderWidth} solid ${element.settings.borderColor || '#E5E7EB'}` : undefined,
      boxSizing: 'border-box'
    };

    // Hide element on mobile if mobileDisplay is 'none'
    if (isMobile && element.settings?.mobileDisplay === 'none') {
      return null;
    }

    const className = `transition-all duration-200 ${style.display === 'flex' ? 'flex' : ''} ${style.display === 'grid' ? 'grid' : ''}`;

    switch (element.type) {
      case 'text':
        return (
          <div style={style} className={`whitespace-pre-wrap ${className}`}>
            {element.content || 'Text element'}
          </div>
        );
      case 'button':
        return (
          <button 
            style={{
              ...style,
              backgroundColor: style.backgroundColor || '#3B82F6',
              color: style.color || '#FFFFFF',
              padding: style.padding || (isMobile ? '10px 20px' : '12px 24px'),
              borderRadius: style.borderRadius || '6px',
              border: style.border || 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} 
            className={`inline-block font-medium ${className}`}
            onMouseEnter={(e) => {
              if (element.settings?.hoverColor) {
                e.currentTarget.style.backgroundColor = element.settings.hoverColor;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = style.backgroundColor || '#3B82F6';
            }}
            onClick={(e) => {
              if (element.settings?.buttonLink) {
                e.preventDefault();
                if (element.settings.buttonLink.startsWith('http')) {
                  window.open(element.settings.buttonLink, '_blank');
                } else {
                  window.location.href = element.settings.buttonLink;
                }
              }
            }}
          >
            {element.content || 'Button'}
          </button>
        );
      case 'image':
        return element.settings?.imageUrl ? (
          <img 
            src={element.settings.imageUrl} 
            alt={element.settings?.altText || element.content || ''}
            style={{
              ...style,
              objectFit: element.settings?.objectFit as any || 'cover'
            }}
            className={`max-w-full h-auto ${className}`}
          />
        ) : (
          <div style={style} className={`bg-gray-200 rounded flex items-center justify-center min-h-[100px] ${className}`}>
            <div className="text-center text-gray-500">
              <Image className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Image</p>
              <p className="text-xs">Add URL in settings</p>
            </div>
          </div>
        );
      case 'spacer':
        return (
          <div 
            style={{ 
              ...style, 
              backgroundColor: style.backgroundColor || 'transparent',
              minHeight: isMobile && element.settings?.mobileHeight ? element.settings.mobileHeight : (style.height || '40px')
            }} 
            className={`w-full ${className}`}
          />
        );
      case 'reviews':
        return <ReviewsCarousel element={element} />;
      default:
        return <div style={style} className={className}>Unknown element</div>;
    }
  };

  // Add element rearrangement functions
  const moveElementUp = (sectionId: string, columnId: string, elementId: string) => {
    setWebsiteData(prev => {
      const newData = { ...prev };
      const section = newData.sections.find(s => s.id === sectionId);
      if (!section) return prev;
      
      const column = section.columns?.find(c => c.id === columnId);
      if (!column) return prev;
      
      const elementIndex = column.elements.findIndex(e => e.id === elementId);
      if (elementIndex <= 0) return prev;
      
      const elements = [...column.elements];
      [elements[elementIndex - 1], elements[elementIndex]] = [elements[elementIndex], elements[elementIndex - 1]];
      column.elements = elements;
      
      return newData;
    });
  };

  const moveElementDown = (sectionId: string, columnId: string, elementId: string) => {
    setWebsiteData(prev => {
      const newData = { ...prev };
      const section = newData.sections.find(s => s.id === sectionId);
      if (!section) return prev;
      
      const column = section.columns?.find(c => c.id === columnId);
      if (!column) return prev;
      
      const elementIndex = column.elements.findIndex(e => e.id === elementId);
      if (elementIndex >= column.elements.length - 1) return prev;
      
      const elements = [...column.elements];
      [elements[elementIndex], elements[elementIndex + 1]] = [elements[elementIndex + 1], elements[elementIndex]];
      column.elements = elements;
      
      return newData;
    });
  };



  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Section List & Editor */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation(`/client-dashboard?clientId=${clientId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">Website Builder</h2>
          </div>
          <p className="text-sm text-gray-600">Build your professional website</p>
        </div>

        {/* Website Settings */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Website Title</Label>
              <Input
                id="title"
                value={websiteData.title}
                onChange={(e) => setWebsiteData({...websiteData, title: e.target.value})}
                placeholder="Enter website title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={websiteData.description}
                onChange={(e) => setWebsiteData({...websiteData, description: e.target.value})}
                placeholder="Enter website description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={websiteData.primaryColor}
                  onChange={(e) => setWebsiteData({...websiteData, primaryColor: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <Input
                  id="secondaryColor"
                  type="color"
                  value={websiteData.secondaryColor}
                  onChange={(e) => setWebsiteData({...websiteData, secondaryColor: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Section */}
        <div className="p-4 border-b border-gray-200">
          <Label className="text-sm font-medium">Add New Section</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => addSection('hero')}>
              <Type className="h-3 w-3 mr-1" />
              Hero
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('about')}>
              <Layout className="h-3 w-3 mr-1" />
              About
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('columns')}>
              <Columns className="h-3 w-3 mr-1" />
              Columns
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('text')}>
              <Type className="h-3 w-3 mr-1" />
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('services')}>
              <Settings className="h-3 w-3 mr-1" />
              Services
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('contact-info')}>
              <Phone className="h-3 w-3 mr-1" />
              Contact
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('lead-form')}>
              <Mail className="h-3 w-3 mr-1" />
              Lead Form
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('image')}>
              <Image className="h-3 w-3 mr-1" />
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSection('spacer')}>
              <Square className="h-3 w-3 mr-1" />
              Spacer
            </Button>
          </div>
        </div>

        {/* Dynamic Editor Controls */}
        {selectedSection && (
          <div className="border-b border-gray-200 max-h-64 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant={editMode === 'section' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setEditMode('section')}
                  className="text-xs flex-1"
                >
                  Section
                </Button>
                {selectedColumn && (
                  <Button 
                    variant={editMode === 'column' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setEditMode('column')}
                    className="text-xs flex-1"
                  >
                    Column
                  </Button>
                )}
                {selectedElement && (
                  <Button 
                    variant={editMode === 'element' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setEditMode('element')}
                    className="text-xs flex-1"
                  >
                    Element
                  </Button>
                )}
              </div>

              {/* Section Controls */}
              {editMode === 'section' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sectionTitle">Title</Label>
                    <Input
                      id="sectionTitle"
                      value={getSelectedSection()?.title || ''}
                      onChange={(e) => updateSection(selectedSection!, 'title', e.target.value)}
                      placeholder="Section title"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label>Background</Label>
                    <Input
                      type="color"
                      value={getSelectedSection()?.settings?.backgroundColor || '#FFFFFF'}
                      onChange={(e) => updateSectionSettings(selectedSection!, { backgroundColor: e.target.value })}
                      className="h-8"
                    />
                  </div>
                </div>
              )}

              {/* Column Controls */}
              {editMode === 'column' && selectedColumn && (
                <div className="space-y-3">
                  <div>
                    <Label>Width</Label>
                    <Select
                      value={getSelectedColumn()?.width || 'auto'}
                      onValueChange={(value) => updateColumn(selectedSection!, selectedColumn, { width: value as WebsiteColumn['width'] })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="1/2">Half Width</SelectItem>
                        <SelectItem value="1/3">One Third</SelectItem>
                        <SelectItem value="2/3">Two Thirds</SelectItem>
                        <SelectItem value="1/4">Quarter</SelectItem>
                        <SelectItem value="3/4">Three Quarters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Element Controls */}
              {editMode === 'element' && selectedElement && (
                <div className="space-y-4">
                  {/* Content */}
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={getSelectedElement()?.content || ''}
                      onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, { content: e.target.value })}
                      placeholder="Element content"
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Typography & Colors */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium">Typography & Colors</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Font Size</Label>
                        <Input
                          value={getSelectedElement()?.settings?.fontSize || '16px'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, fontSize: e.target.value }
                          })}
                          placeholder="16px"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Font Weight</Label>
                        <Select
                          value={getSelectedElement()?.settings?.fontWeight || 'normal'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, fontWeight: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="semibold">Semi Bold</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Text Color</Label>
                        <Input
                          type="color"
                          value={getSelectedElement()?.settings?.textColor || '#1F2937'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, textColor: e.target.value }
                          })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Text Align</Label>
                        <Select
                          value={getSelectedElement()?.settings?.textAlign || 'left'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, textAlign: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justify">Justify</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Positioning */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium">Layout & Positioning</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Width</Label>
                        <Input
                          value={getSelectedElement()?.settings?.width || 'auto'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, width: e.target.value }
                          })}
                          placeholder="auto, 100px, 100%"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input
                          value={getSelectedElement()?.settings?.height || 'auto'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, height: e.target.value }
                          })}
                          placeholder="auto, 100px"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Margin</Label>
                        <Input
                          value={getSelectedElement()?.settings?.margin || '0'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, margin: e.target.value }
                          })}
                          placeholder="10px, 10px 20px"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Padding</Label>
                        <Input
                          value={getSelectedElement()?.settings?.padding || '0'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, padding: e.target.value }
                          })}
                          placeholder="10px, 10px 20px"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Display</Label>
                      <Select
                        value={getSelectedElement()?.settings?.display || 'block'}
                        onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                          settings: { ...getSelectedElement()?.settings, display: value }
                        })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="block">Block</SelectItem>
                          <SelectItem value="inline-block">Inline Block</SelectItem>
                          <SelectItem value="inline">Inline</SelectItem>
                          <SelectItem value="flex">Flex</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Background & Border */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium">Background & Border</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Background Color</Label>
                        <Input
                          type="color"
                          value={getSelectedElement()?.settings?.backgroundColor || (getSelectedElement()?.type === 'button' ? '#3B82F6' : 'transparent')}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, backgroundColor: e.target.value }
                          })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label>Border Radius</Label>
                        <Input
                          value={getSelectedElement()?.settings?.borderRadius || (getSelectedElement()?.type === 'button' ? '6px' : '0')}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, borderRadius: e.target.value }
                          })}
                          placeholder="0, 6px, 50%"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Border Width</Label>
                        <Input
                          value={getSelectedElement()?.settings?.borderWidth || '0'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, borderWidth: e.target.value }
                          })}
                          placeholder="0, 1px, 2px"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Border Color</Label>
                        <Input
                          type="color"
                          value={getSelectedElement()?.settings?.borderColor || '#E5E7EB'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, borderColor: e.target.value }
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Element Arrangement */}
                  <div className="space-y-3 p-3 bg-yellow-50 rounded">
                    <h4 className="text-sm font-medium">Element Position</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveElementUp(selectedSection!, selectedColumn!, selectedElement)}
                        disabled={!selectedSection || !selectedColumn || !selectedElement}
                        className="flex-1"
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Move Up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveElementDown(selectedSection!, selectedColumn!, selectedElement)}
                        disabled={!selectedSection || !selectedColumn || !selectedElement}
                        className="flex-1"
                      >
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Move Down
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Responsiveness */}
                  <div className="space-y-3 p-3 bg-gray-50 rounded">
                    <h4 className="text-sm font-medium">Mobile Responsive</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Mobile Font Size</Label>
                        <Input
                          value={getSelectedElement()?.settings?.mobileFontSize || getSelectedElement()?.settings?.fontSize || '14px'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, mobileFontSize: e.target.value }
                          })}
                          placeholder="14px"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Mobile Text Align</Label>
                        <Select
                          value={getSelectedElement()?.settings?.mobileTextAlign || getSelectedElement()?.settings?.textAlign || 'left'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, mobileTextAlign: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Mobile Width</Label>
                        <Input
                          value={getSelectedElement()?.settings?.mobileWidth || getSelectedElement()?.settings?.width || 'auto'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, mobileWidth: e.target.value }
                          })}
                          placeholder="100%, auto"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Mobile Display</Label>
                        <Select
                          value={getSelectedElement()?.settings?.mobileDisplay || getSelectedElement()?.settings?.display || 'block'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, mobileDisplay: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="inline-block">Inline Block</SelectItem>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="none">Hide on Mobile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Type-specific settings */}
                  {getSelectedElement()?.type === 'button' && (
                    <div className="space-y-3 p-3 bg-blue-50 rounded">
                      <h4 className="text-sm font-medium">Button Settings</h4>
                      <div>
                        <Label>Button Link</Label>
                        <Input
                          value={getSelectedElement()?.settings?.buttonLink || ''}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, buttonLink: e.target.value }
                          })}
                          placeholder="/contact or https://example.com"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Hover Color</Label>
                        <Input
                          type="color"
                          value={getSelectedElement()?.settings?.hoverColor || '#2563EB'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, hoverColor: e.target.value }
                          })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}

                  {getSelectedElement()?.type === 'image' && (
                    <div className="space-y-3 p-3 bg-green-50 rounded">
                      <h4 className="text-sm font-medium">Image Settings</h4>
                      <div>
                        <Label>Image URL</Label>
                        <Input
                          value={getSelectedElement()?.settings?.imageUrl || ''}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, imageUrl: e.target.value }
                          })}
                          placeholder="https://example.com/image.jpg"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Alt Text</Label>
                        <Input
                          value={getSelectedElement()?.settings?.altText || ''}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, altText: e.target.value }
                          })}
                          placeholder="Descriptive text for accessibility"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Object Fit</Label>
                        <Select
                          value={getSelectedElement()?.settings?.objectFit || 'cover'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, objectFit: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="contain">Contain</SelectItem>
                            <SelectItem value="fill">Fill</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="scale-down">Scale Down</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {getSelectedElement()?.type === 'spacer' && (
                    <div className="space-y-3 p-3 bg-gray-100 rounded">
                      <h4 className="text-sm font-medium">Spacer Settings</h4>
                      <div>
                        <Label>Desktop Height</Label>
                        <Input
                          value={getSelectedElement()?.settings?.height || '40px'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, height: e.target.value }
                          })}
                          placeholder="40px"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label>Mobile Height</Label>
                        <Input
                          value={getSelectedElement()?.settings?.mobileHeight || '20px'}
                          onChange={(e) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, mobileHeight: e.target.value }
                          })}
                          placeholder="20px"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {getSelectedElement()?.type === 'reviews' && (
                    <div className="space-y-3 p-3 bg-purple-50 rounded">
                      <h4 className="text-sm font-medium">Reviews Settings</h4>
                      <div>
                        <Label>Display Style</Label>
                        <Select
                          value={getSelectedElement()?.settings?.reviewStyle || 'carousel'}
                          onValueChange={(value) => updateElement(selectedSection, selectedColumn!, selectedElement, {
                            settings: { ...getSelectedElement()?.settings, reviewStyle: value as 'carousel' | 'grid' }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="carousel">Carousel</SelectItem>
                            <SelectItem value="grid">Grid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Customer Reviews</Label>
                          <Button
                            size="sm"
                            onClick={() => {
                              const currentReviews = getSelectedElement()?.settings?.reviews || [];
                              const newReview = {
                                id: `review_${Date.now()}`,
                                name: 'New Customer',
                                rating: 5,
                                text: 'Great service!',
                                date: new Date().toISOString().split('T')[0]
                              };
                              updateElement(selectedSection, selectedColumn!, selectedElement, {
                                settings: { 
                                  ...getSelectedElement()?.settings, 
                                  reviews: [...currentReviews, newReview] 
                                }
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Review
                          </Button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-3">
                          {(getSelectedElement()?.settings?.reviews || []).map((review, index) => (
                            <div key={review.id} className="p-3 bg-white rounded border">
                              <div className="flex items-center justify-between mb-2">
                                <Input
                                  value={review.name}
                                  onChange={(e) => {
                                    const updatedReviews = [...(getSelectedElement()?.settings?.reviews || [])];
                                    updatedReviews[index] = { ...review, name: e.target.value };
                                    updateElement(selectedSection, selectedColumn!, selectedElement, {
                                      settings: { ...getSelectedElement()?.settings, reviews: updatedReviews }
                                    });
                                  }}
                                  placeholder="Customer Name"
                                  className="text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const updatedReviews = (getSelectedElement()?.settings?.reviews || []).filter((_, i) => i !== index);
                                    updateElement(selectedSection, selectedColumn!, selectedElement, {
                                      settings: { ...getSelectedElement()?.settings, reviews: updatedReviews }
                                    });
                                  }}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <Select
                                  value={review.rating.toString()}
                                  onValueChange={(value) => {
                                    const updatedReviews = [...(getSelectedElement()?.settings?.reviews || [])];
                                    updatedReviews[index] = { ...review, rating: parseInt(value) };
                                    updateElement(selectedSection, selectedColumn!, selectedElement, {
                                      settings: { ...getSelectedElement()?.settings, reviews: updatedReviews }
                                    });
                                  }}
                                >
                                  <SelectTrigger className="text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">⭐ 1 Star</SelectItem>
                                    <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                                    <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                                    <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={review.date || ''}
                                  onChange={(e) => {
                                    const updatedReviews = [...(getSelectedElement()?.settings?.reviews || [])];
                                    updatedReviews[index] = { ...review, date: e.target.value };
                                    updateElement(selectedSection, selectedColumn!, selectedElement, {
                                      settings: { ...getSelectedElement()?.settings, reviews: updatedReviews }
                                    });
                                  }}
                                  type="date"
                                  className="text-xs"
                                />
                              </div>
                              <Textarea
                                value={review.text}
                                onChange={(e) => {
                                  const updatedReviews = [...(getSelectedElement()?.settings?.reviews || [])];
                                  updatedReviews[index] = { ...review, text: e.target.value };
                                  updateElement(selectedSection, selectedColumn!, selectedElement, {
                                    settings: { ...getSelectedElement()?.settings, reviews: updatedReviews }
                                  });
                                }}
                                placeholder="Review text..."
                                className="text-xs"
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Website Sections</h3>
            <div className="space-y-2">
              {websiteData.sections.map((section, index) => (
                <Card 
                  key={section.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedSection === section.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => {
                    setSelectedSection(section.id);
                    setEditMode('section');
                    setSelectedColumn(null);
                    setSelectedElement(null);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      <span className="text-sm font-medium truncate">{section.title || section.type}</span>
                      <span className="text-xs text-gray-500 capitalize ml-auto">{section.type}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(section.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Section Editor */}
        {selectedSectionData && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Edit Section</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSection(selectedSection!)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="sectionTitle">Section Title</Label>
                <Input
                  id="sectionTitle"
                  value={selectedSectionData.title}
                  onChange={(e) => updateSection(selectedSection!, 'title', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="sectionContent">Content</Label>
                <Textarea
                  id="sectionContent"
                  value={selectedSectionData.content}
                  onChange={(e) => updateSection(selectedSection!, 'content', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Section-specific data fields */}
              {selectedSectionData.type === 'contact-info' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-sm">Contact Details</h4>
                  <div>
                    <Label htmlFor="contact-phone">Phone Number</Label>
                    <Input
                      id="contact-phone"
                      value={selectedSectionData.data?.phone || ""}
                      onChange={(e) => updateSectionData(selectedSection!, { phone: e.target.value })}
                      placeholder="555-0101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Email Address</Label>
                    <Input
                      id="contact-email"
                      value={selectedSectionData.data?.email || ""}
                      onChange={(e) => updateSectionData(selectedSection!, { email: e.target.value })}
                      placeholder="info@business.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-address">Address</Label>
                    <Textarea
                      id="contact-address"
                      value={selectedSectionData.data?.address || ""}
                      onChange={(e) => updateSectionData(selectedSection!, { address: e.target.value })}
                      placeholder="123 Main St, City, State"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {selectedSectionData.type === 'hero' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded">
                  <h4 className="font-medium text-sm">Call-to-Action Button</h4>
                  <div>
                    <Label htmlFor="hero-button-text">Button Text</Label>
                    <Input
                      id="hero-button-text"
                      value={selectedSectionData.data?.buttonText || ""}
                      onChange={(e) => updateSectionData(selectedSection!, { buttonText: e.target.value })}
                      placeholder="Book Appointment"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-button-link">Button Link</Label>
                    <Input
                      id="hero-button-link"
                      value={selectedSectionData.data?.buttonLink || ""}
                      onChange={(e) => updateSectionData(selectedSection!, { buttonLink: e.target.value })}
                      placeholder="/booking"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Styling Options */}
              <div className="space-y-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium text-sm">Advanced Styling</h4>
                
                {/* Background Options */}
                <div className="space-y-3">
                  <Label>Background Type</Label>
                  <Select
                    value={selectedSectionData.settings?.backgroundType || 'color'}
                    onValueChange={(value) => updateSectionSettings(selectedSection!, { backgroundType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Background Image</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedSectionData.settings?.backgroundType === 'color' && (
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={selectedSectionData.settings?.backgroundColor || '#FFFFFF'}
                        onChange={(e) => updateSectionSettings(selectedSection!, { backgroundColor: e.target.value })}
                      />
                    </div>
                  )}

                  {selectedSectionData.settings?.backgroundType === 'gradient' && (
                    <div className="space-y-2">
                      <div>
                        <Label>Gradient Type</Label>
                        <Select
                          value={selectedSectionData.settings?.gradientType || 'linear'}
                          onValueChange={(value) => updateSectionSettings(selectedSection!, { gradientType: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="radial">Radial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedSectionData.settings?.gradientType === 'linear' && (
                        <div>
                          <Label>Direction</Label>
                          <Select
                            value={selectedSectionData.settings?.gradientDirection || 'to right'}
                            onValueChange={(value) => updateSectionSettings(selectedSection!, { gradientDirection: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="to right">Left to Right</SelectItem>
                              <SelectItem value="to left">Right to Left</SelectItem>
                              <SelectItem value="to bottom">Top to Bottom</SelectItem>
                              <SelectItem value="to top">Bottom to Top</SelectItem>
                              <SelectItem value="to bottom right">Top-Left to Bottom-Right</SelectItem>
                              <SelectItem value="to bottom left">Top-Right to Bottom-Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Start Color</Label>
                          <Input
                            type="color"
                            value={selectedSectionData.settings?.gradientColors?.[0] || '#3B82F6'}
                            onChange={(e) => {
                              const colors = selectedSectionData.settings?.gradientColors || ['#3B82F6', '#1E40AF'];
                              colors[0] = e.target.value;
                              updateSectionSettings(selectedSection!, { gradientColors: colors });
                            }}
                          />
                        </div>
                        <div>
                          <Label>End Color</Label>
                          <Input
                            type="color"
                            value={selectedSectionData.settings?.gradientColors?.[1] || '#1E40AF'}
                            onChange={(e) => {
                              const colors = selectedSectionData.settings?.gradientColors || ['#3B82F6', '#1E40AF'];
                              colors[1] = e.target.value;
                              updateSectionSettings(selectedSection!, { gradientColors: colors });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSectionData.settings?.backgroundType === 'image' && (
                    <div>
                      <Label>Background Image URL</Label>
                      <Input
                        value={selectedSectionData.settings?.backgroundImage || ''}
                        onChange={(e) => updateSectionSettings(selectedSection!, { backgroundImage: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={selectedSectionData.settings?.textColor || '#1F2937'}
                    onChange={(e) => updateSectionSettings(selectedSection!, { textColor: e.target.value })}
                  />
                </div>
                
                {/* Layout Options */}
                <div className="space-y-3">
                  <h5 className="font-medium text-xs text-gray-600">LAYOUT</h5>
                  
                  <div>
                    <Label>Width</Label>
                    <Select
                      value={selectedSectionData.settings?.width || 'container'}
                      onValueChange={(value) => updateSectionSettings(selectedSection!, { width: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="container">Container (1200px max)</SelectItem>
                        <SelectItem value="custom">Custom Width</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedSectionData.settings?.width === 'custom' && (
                      <Input
                        className="mt-2"
                        value={selectedSectionData.settings?.customWidth || ''}
                        onChange={(e) => updateSectionSettings(selectedSection!, { customWidth: e.target.value })}
                        placeholder="e.g., 800px, 80%, 50rem"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Height</Label>
                    <Select
                      value={selectedSectionData.settings?.height || 'auto'}
                      onValueChange={(value) => updateSectionSettings(selectedSection!, { height: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto Height</SelectItem>
                        <SelectItem value="screen">Full Screen</SelectItem>
                        <SelectItem value="custom">Custom Height</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedSectionData.settings?.height === 'custom' && (
                      <Input
                        className="mt-2"
                        value={selectedSectionData.settings?.customHeight || ''}
                        onChange={(e) => updateSectionSettings(selectedSection!, { customHeight: e.target.value })}
                        placeholder="e.g., 400px, 50vh, 20rem"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Text Alignment</Label>
                    <Select 
                      value={selectedSectionData.settings?.alignment || 'left'} 
                      onValueChange={(value) => updateSectionSettings(selectedSection!, { alignment: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Padding</Label>
                    <Select 
                      value={selectedSectionData.settings?.padding || 'medium'} 
                      onValueChange={(value) => updateSectionSettings(selectedSection!, { padding: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (1rem)</SelectItem>
                        <SelectItem value="medium">Medium (2rem)</SelectItem>
                        <SelectItem value="large">Large (4rem)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {clientData?.client?.businessName} Website Builder
              </h1>
            </div>
            
            {/* Device Preview Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                >
                  {getDeviceIcon(mode)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.open(`/client-website/${clientId}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} disabled={saveWebsiteMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveWebsiteMutation.isPending ? 'Saving...' : 'Save & Publish'}
              </Button>
            </div>
          </div>
        </div>

        {/* Website Preview - Hidden to show editable version */}
        <div className="hidden">
          <div 
            className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ width: getPreviewWidth(), maxWidth: '100%' }}
          >
            {/* Show the actual Figma designed website in the builder preview */}
            {clientId && <FigmaDesignedWebsite clientId={clientId} isBuilderPreview={true} />}
          </div>
        </div>

        {/* Section Editor Panel - Full editing capabilities enabled */}
        <div className="flex-1 p-6 overflow-auto bg-gray-50">
          <div 
            className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
            style={{ width: getPreviewWidth(), maxWidth: '100%' }}
          >
            {websiteData.sections.map((section) => (
              <div
                key={section.id}
                className={`${getSectionContainerClass(section.settings)} cursor-pointer border-2 border-transparent hover:border-blue-300 transition-colors ${
                  selectedSection === section.id ? 'border-blue-500' : ''
                }`}
                style={getBackgroundStyle(section.settings)}
                onClick={() => setSelectedSection(section.id)}
              >
                {/* Add Elements to Section */}
                <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <Button size="sm" variant="outline" onClick={() => addElementToSection(section.id, 'text')} className="text-xs">
                    <Type className="h-3 w-3 mr-1" />
                    Text
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElementToSection(section.id, 'button')} className="text-xs">
                    <MousePointer className="h-3 w-3 mr-1" />
                    Button
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElementToSection(section.id, 'image')} className="text-xs">
                    <Image className="h-3 w-3 mr-1" />
                    Image
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addElementToSection(section.id, 'spacer')} className="text-xs">
                    <Square className="h-3 w-3 mr-1" />
                    Spacer
                  </Button>
                </div>

                {/* Section-specific rendering */}
                {section.type === 'contact-info' ? (
                  <div>
                    <h2 className={`font-bold mb-4 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6 lg:justify-center mt-6">
                      <div className="text-center p-4 bg-white bg-opacity-10 rounded flex-1 lg:max-w-xs">
                        <Phone className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <h3 className="font-semibold text-sm sm:text-base">Call Us</h3>
                        <p className="text-xs sm:text-sm break-all">{section.data?.phone || clientData?.client?.phone || '555-0101'}</p>
                      </div>
                      <div className="text-center p-4 bg-white bg-opacity-10 rounded flex-1 lg:max-w-xs">
                        <Mail className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <h3 className="font-semibold text-sm sm:text-base">Email Us</h3>
                        <p className="text-xs sm:text-sm break-all">{section.data?.email || clientData?.client?.email || 'info@business.com'}</p>
                      </div>
                      <div className="text-center p-4 bg-white bg-opacity-10 rounded flex-1 lg:max-w-xs">
                        <Layout className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <h3 className="font-semibold text-sm sm:text-base">Visit Us</h3>
                        <p className="text-xs sm:text-sm break-words">{section.data?.address || clientData?.client?.businessAddress || 'Business Address'}</p>
                      </div>
                    </div>
                  </div>
                ) : section.type === 'services' ? (
                  <div>
                    <h2 className={`font-bold mb-4 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    <p className="mb-4">{section.content}</p>
                    <div className="text-center py-8 bg-white bg-opacity-10 rounded">
                      <p className="text-sm opacity-75">Services from your admin panel will display here</p>
                      <p className="text-xs opacity-50 mt-2">Add services in your dashboard to see them on the live website</p>
                    </div>
                  </div>
                ) : section.type === 'contact-form' ? (
                  <div>
                    <h2 className={`font-bold mb-4 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    <p className="mb-4">{section.content}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input className="p-3 rounded border text-sm" placeholder="Your Name" />
                      <input className="p-3 rounded border text-sm" placeholder="Your Email" />
                      <input className="p-3 rounded border text-sm sm:col-span-2" placeholder="Phone Number" />
                      <textarea className="p-3 rounded border sm:col-span-2 text-sm" placeholder="Your Message" rows={4}></textarea>
                      <button className="p-3 bg-blue-600 text-white rounded sm:col-span-2 text-sm font-medium hover:bg-blue-700 transition-colors">Send Message</button>
                    </div>
                  </div>
                ) : section.type === 'lead-form' ? (
                  <LeadForm
                    clientId={clientId || ''}
                    title={section.title}
                    description={section.content}
                    buttonText="Get My Quote"
                    buttonColor={websiteData.primaryColor}
                  />
                ) : section.type === 'testimonials' ? (
                  <div className="text-center">
                    <h2 className={`font-bold mb-8 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    {section.settings?.testimonials && section.settings.testimonials.length > 0 ? (
                      <div className="max-w-4xl mx-auto">
                        <div className="bg-white bg-opacity-20 rounded-xl p-8 text-center">
                          <div className="flex justify-center mb-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                          <blockquote className="text-xl text-white mb-6 italic leading-relaxed">
                            "{section.settings.testimonials[0].testimonialText}"
                          </blockquote>
                          <div className="flex items-center justify-center">
                            <img 
                              src={section.settings.testimonials[0].customerImage} 
                              alt={section.settings.testimonials[0].customerName}
                              className="w-16 h-16 rounded-full mr-4"
                            />
                            <div className="text-left">
                              <p className="font-bold text-white">{section.settings.testimonials[0].customerName}</p>
                              <p className="text-pink-300">{section.settings.testimonials[0].customerTitle}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white bg-opacity-10 rounded">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm opacity-75">Customer testimonials will display here</p>
                        <p className="text-xs opacity-50 mt-2">Add testimonials in the admin panel</p>
                      </div>
                    )}
                  </div>
                ) : section.type === 'header' ? (
                  <div className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                      <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {clientData?.client?.businessName || 'Graceful Hair'}
                        </h1>
                        <nav className="hidden md:flex space-x-8">
                          <a href="#home" className="text-gray-700 hover:text-gray-900">Home</a>
                          <a href="#staff" className="text-gray-700 hover:text-gray-900">Staff</a>
                          <a href="#pricing" className="text-gray-700 hover:text-gray-900">Pricing</a>
                          <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
                        </nav>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full">
                          Contact Us
                        </button>
                      </div>
                    </div>
                  </div>
                ) : section.type === 'staff' ? (
                  <div>
                    <h2 className={`font-bold mb-8 text-4xl text-center ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    {section.settings?.staffMembers && section.settings.staffMembers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {section.settings.staffMembers.map((member, index) => (
                          <div key={member.id} className="text-center">
                            <div className="relative w-48 h-48 mx-auto mb-6">
                              <img 
                                src={member.profileImage} 
                                alt={member.name}
                                className="w-full h-full rounded-full object-cover shadow-lg"
                              />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                            <p className="text-gray-600 mb-1">{member.title}</p>
                            <p className="text-sm text-gray-500">{member.experience}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white bg-opacity-10 rounded">
                        <p className="text-sm opacity-75">Staff members will display here</p>
                        <p className="text-xs opacity-50 mt-2">Add staff in the admin panel</p>
                      </div>
                    )}
                  </div>
                ) : section.type === 'pricing' ? (
                  <div>
                    <h2 className={`font-bold mb-4 text-4xl text-center ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    <p className="text-gray-600 text-center mb-16">{section.content}</p>
                    {section.settings?.pricingTiers && section.settings.pricingTiers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {section.settings.pricingTiers.map((tier, index) => (
                          <div 
                            key={tier.id} 
                            className={`relative p-6 text-center rounded-lg ${
                              tier.isPopular 
                                ? 'bg-purple-600 text-white scale-105 shadow-xl' 
                                : 'bg-white border'
                            }`}
                          >
                            {tier.isPopular && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                  Most Popular
                                </span>
                              </div>
                            )}
                            <h3 className={`text-xl font-bold mb-4 ${tier.isPopular ? 'text-white' : 'text-gray-900'}`}>
                              {tier.name}
                            </h3>
                            <div className="mb-6">
                              <span className={`text-4xl font-bold ${tier.isPopular ? 'text-white' : 'text-gray-900'}`}>
                                ${tier.price}
                              </span>
                            </div>
                            <ul className="space-y-3 mb-8">
                              {tier.features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-center">
                                  <CheckCircle className={`h-5 w-5 mr-3 ${tier.isPopular ? 'text-pink-300' : 'text-green-500'}`} />
                                  <span className={tier.isPopular ? 'text-white' : 'text-gray-600'}>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <button 
                              className={`w-full py-3 rounded-lg font-semibold ${
                                tier.isPopular 
                                  ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {tier.buttonText}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white bg-opacity-10 rounded">
                        <p className="text-sm opacity-75">Pricing tiers will display here</p>
                        <p className="text-xs opacity-50 mt-2">Add pricing in the admin panel</p>
                      </div>
                    )}
                  </div>
                ) : section.type === 'newsletter' ? (
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-4xl mx-auto">
                    <div className="w-20 h-20 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                      <span className="text-white text-2xl font-bold">HS</span>
                    </div>
                    <h2 className={`font-bold mb-4 text-3xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                      {section.title}
                    </h2>
                    <p className="text-gray-600 mb-8">{section.content}</p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-1 p-3 border rounded-lg"
                      />
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg">
                        Subscribe
                      </button>
                    </div>
                  </div>
                ) : section.type === 'booking' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                      <h2 className={`font-bold mb-6 text-4xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                        {section.title}
                      </h2>
                      <p className="text-gray-600 mb-8">{section.content}</p>
                      <div className="space-y-6">
                        <input className="w-full p-3 border rounded-lg" placeholder="Full Name" />
                        <input className="w-full p-3 border rounded-lg" placeholder="Email" />
                        <input className="w-full p-3 border rounded-lg" placeholder="Phone Number" />
                        <textarea className="w-full p-3 border rounded-lg" rows={4} placeholder="Tell us about your hair goals..."></textarea>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">
                          Request Booking
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div 
                        className="rounded-full w-96 h-96 mx-auto overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)'
                        }}
                      >
                        {section.settings?.heroImage ? (
                          <img 
                            src={section.settings.heroImage} 
                            alt="Hair styling" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xl">
                            Hair Image
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : section.type === 'footer' ? (
                  <div className="text-white py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div>
                        <h3 className="text-xl font-bold mb-4">
                          {clientData?.client?.businessName || 'Graceful Hair'}
                        </h3>
                        <p className="text-purple-200 mb-4">
                          Your trusted partner for beautiful, healthy hair
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{section.data?.phone || clientData?.client?.phone || '(555) 123-4567'}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{section.data?.email || clientData?.client?.email || 'info@gracefulhair.com'}</span>
                          </div>
                          <div className="flex items-center">
                            <Layout className="h-4 w-4 mr-2" />
                            <span>{section.data?.address || clientData?.client?.businessAddress || '123 Beauty St, Hair City'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Services</h4>
                        <ul className="space-y-2 text-purple-200">
                          <li>Hair Cutting</li>
                          <li>Hair Coloring</li>
                          <li>Hair Styling</li>
                          <li>Hair Treatments</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                        <div className="flex space-x-4">
                          <div className="text-purple-200 hover:text-white cursor-pointer">Facebook</div>
                          <div className="text-purple-200 hover:text-white cursor-pointer">Instagram</div>
                          <div className="text-purple-200 hover:text-white cursor-pointer">Twitter</div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-purple-800 mt-12 pt-8 text-center">
                      <p className="text-purple-200">
                        © 2024 {clientData?.client?.businessName || 'Graceful Hair'}. All rights reserved.
                      </p>
                    </div>
                  </div>
                ) : section.type === 'columns' ? (
                  <div>
                    {section.title && (
                      <h2 className={`font-bold mb-4 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                        {section.title}
                      </h2>
                    )}
                    <div className={`grid gap-4 ${getResponsiveGridClass(section.columns?.length || 2)}`}>
                      {section.columns?.map((column, columnIndex) => (
                        <div
                          key={column.id}
                          className={`min-h-[120px] cursor-pointer border-2 border-dashed border-gray-200 hover:border-gray-400 p-4 rounded-lg transition-all duration-200 ${
                            selectedColumn === column.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:bg-gray-50'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedColumn(column.id);
                            setSelectedSection(section.id);
                            setEditMode('column');
                          }}
                          style={{ 
                            backgroundColor: column.settings?.backgroundColor,
                            padding: column.settings?.padding 
                          }}
                        >
                          {/* Column Header */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                            <span className="text-xs font-medium text-gray-600">
                              Column {columnIndex + 1} ({column.width})
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteColumn(section.id, column.id);
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Elements in Column */}
                          <div className="space-y-2 mb-4">
                            {column.elements.map((element, elementIndex) => (
                              <div
                                key={element.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedElement({
                                    sectionId: section.id,
                                    columnId: column.id,
                                    elementId: element.id,
                                    index: elementIndex
                                  });
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (draggedElement && 
                                      (draggedElement.columnId !== column.id || draggedElement.index !== elementIndex)) {
                                    // Move element within same column or to different column
                                    moveElement(draggedElement, section.id, column.id, elementIndex);
                                  }
                                  setDraggedElement(null);
                                }}
                                className={`group relative cursor-pointer border border-dashed border-transparent hover:border-blue-300 p-2 rounded transition-colors ${
                                  selectedElement === element.id ? 'border-blue-500 bg-blue-50' : ''
                                } ${draggedElement?.elementId === element.id ? 'opacity-50' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedElement(element.id);
                                  setSelectedColumn(column.id);
                                  setSelectedSection(section.id);
                                  setEditMode('element');
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab" />
                                  <div className="flex-1">
                                    {renderElement(element)}
                                  </div>
                                </div>
                                
                                {/* Element Controls */}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteElement(section.id, column.id, element.id);
                                    }}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Add Element Buttons */}
                          <div className="grid grid-cols-2 gap-1">
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              addElement(column.id, 'text');
                            }} className="text-xs">
                              <Type className="h-3 w-3 mr-1" />
                              Text
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              addElement(column.id, 'button');
                            }} className="text-xs">
                              <MousePointer className="h-3 w-3 mr-1" />
                              Button
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              addElement(column.id, 'image');
                            }} className="text-xs">
                              <Image className="h-3 w-3 mr-1" />
                              Image
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              addElement(column.id, 'spacer');
                            }} className="text-xs">
                              <Square className="h-3 w-3 mr-1" />
                              Space
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation();
                              addElement(column.id, 'reviews');
                            }} className="text-xs col-span-2">
                              <Star className="h-3 w-3 mr-1" />
                              Reviews
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add Column Controls */}
                    <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-3">Add more columns to this section</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={() => addColumn(section.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Column
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => addColumnRow(section.id)}>
                            <Layout className="h-4 w-4 mr-1" />
                            Add Row
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : section.type === 'spacer' ? (
                  <div 
                    className="w-full bg-gray-100" 
                    style={{ 
                      height: section.settings?.customHeight || '40px',
                      backgroundColor: section.settings?.backgroundColor || 'transparent'
                    }}
                  />
                ) : section.type === 'image' ? (
                  <div className="text-center">
                    {section.title && (
                      <h2 className={`font-bold mb-4 text-2xl ${getFontSizeClass(section.settings?.fontSize)}`}>
                        {section.title}
                      </h2>
                    )}
                    <div className="bg-gray-200 rounded-lg p-8 text-gray-500">
                      <Image className="h-16 w-16 mx-auto mb-2" />
                      <p>Image placeholder</p>
                      <p className="text-sm">Add image URL in settings</p>
                    </div>
                  </div>
                ) : (
                  // Default rendering for other section types
                  <div>
                    {section.title && (
                      <h2 className={`font-bold mb-4 ${section.type === 'hero' ? 'text-3xl' : 'text-2xl'} ${getFontSizeClass(section.settings?.fontSize)}`}>
                        {section.title}
                      </h2>
                    )}
                    {section.content && (
                      <div className={`${getFontSizeClass(section.settings?.fontSize)} whitespace-pre-wrap`}>
                        {section.content}
                      </div>
                    )}
                    {section.type === 'hero' && section.data?.buttonText && (
                      <div className="mt-6">
                        <button className="px-6 py-3 bg-white bg-opacity-20 rounded-lg font-semibold hover:bg-opacity-30 transition-colors">
                          {section.data.buttonText}
                        </button>
                      </div>
                    )}
                    
                    {/* Render section elements */}
                    {section.columns && section.columns.length > 0 && (
                      <div className="space-y-4 mt-6">
                        {section.columns.map((column) => (
                          <div key={column.id} className="space-y-3">
                            {column.elements.map((element) => (
                              <div
                                key={element.id}
                                className={`relative group cursor-pointer border-2 border-dashed border-transparent hover:border-blue-300 p-2 rounded transition-all ${
                                  selectedElement === element.id ? 'border-blue-500 bg-blue-50' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedElement(element.id);
                                  setSelectedColumn(column.id);
                                  setSelectedSection(section.id);
                                  setEditMode('element');
                                }}
                              >
                                {renderElement(element)}
                                
                                {/* Element delete button */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteElement(section.id, column.id, element.id);
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Footer */}
            <div 
              className="p-8 text-center"
              style={{ 
                backgroundColor: websiteData.secondaryColor || '#F3F4F6',
                color: '#6B7280'
              }}
            >
              <p>&copy; 2024 {clientData?.client?.businessName}. All rights reserved.</p>
              <p className="text-sm mt-2">
                {clientData?.client?.businessAddress} | {clientData?.client?.phone} | {clientData?.client?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}