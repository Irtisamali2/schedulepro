import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the industry data structure
export interface Industry {
  id: string;
  name: string;
  description: string;
  services: string[];
  icon: string;
  primaryColor: string;
  accentColor: string;
  benefits: string[];
  features: string[];
  // Professional terms
  professionalName: string;  // e.g., "stylist", "carpenter", "technician"
  professionalPlural: string; // e.g., "stylists", "carpenters"
  clientName: string;         // e.g., "client", "customer", "patient"
  appointmentTerm: string;    // e.g., "appointment", "booking", "session", "job"
  serviceTerm: string;        // e.g., "service", "job", "treatment"
  // Image paths
  heroImage: string;
  galleryImages: string[];
}

// Default industry templates
export const industryTemplates: Industry[] = [
  {
    id: "beauty",
    name: "Beauty Professional",
    description: "Premium template for hair stylists, nail techs, aestheticians and beauty salons",
    services: ["Haircut & Styling", "Color Treatment", "Manicure & Pedicure", "Facial Treatment", "Waxing Services", "Lash Extensions"],
    icon: "✨",
    primaryColor: "#d16ba5", // Gradient pink/purple
    accentColor: "#b76e79",
    benefits: [
      "Track client style preferences and color formulas",
      "Send before & after photos to clients",
      "Automated appointment reminders & confirmations",
      "Build client loyalty with personalized experiences"
    ],
    features: ["Client history tracking", "Product preferences", "Service gallery", "Digital portfolio"],
    professionalName: "specialist",
    professionalPlural: "specialists",
    clientName: "client",
    appointmentTerm: "appointment",
    serviceTerm: "service",
    heroImage: "https://images.unsplash.com/photo-1562322140-8b2e83e36768?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1560869713-7d0a29430803?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  },
  {
    id: "wellness",
    name: "Wellness Provider",
    description: "Elegant scheduling for massage therapists, fitness trainers and wellness professionals",
    services: ["Massage Therapy", "Personal Training", "Yoga Class", "Nutrition Consultation", "Physical Therapy", "Meditation Session"],
    icon: "🧘",
    primaryColor: "#5e8b7e", 
    accentColor: "#2C7873",
    benefits: [
      "Maintain client health records securely",
      "Track progress and preferences",
      "Send gentle appointment reminders",
      "Build wellness programs for regular clients"
    ],
    features: ["Health intake forms", "Session notes", "Treatment plans", "Progress tracking"],
    professionalName: "practitioner",
    professionalPlural: "practitioners",
    clientName: "client",
    appointmentTerm: "session",
    serviceTerm: "treatment",
    heroImage: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1588680382665-cd934bb0452c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  },
  {
    id: "home_services",
    name: "Skilled-Trades",
    description: "Professional system for carpenters, plumbers, electricians and home improvement specialists",
    services: ["Bathroom Remodel", "Built-in Cabinets", "Replace Electrical Panel", "Kitchen Renovation", "Leak Repair", "Deck Construction"],
    icon: "🔧",
    primaryColor: "#3a86ff",
    accentColor: "#0077b6",
    benefits: [
      "Organize service calls efficiently by location",
      "Manage customer property details",
      "Track job history and recurring maintenance",
      "Provide professional quotes and invoices"
    ],
    features: ["Service area mapping", "Parts inventory", "Job history records", "Quote generator"],
    professionalName: "technician",
    professionalPlural: "technicians",
    clientName: "customer",
    appointmentTerm: "service call",
    serviceTerm: "job",
    heroImage: "https://images.unsplash.com/photo-1581612129334-559ed4229c9e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1558618666-c397890ae041?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1558520871-9c508f147e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  },
  {
    id: "pet_care",
    name: "Pet Care Professional",
    description: "Premium booking system for dog groomers, trainers, sitters and veterinary services",
    services: ["Pet Grooming", "Dog Training", "Pet Sitting", "Dog Walking", "Basic Veterinary Care", "Pet Photography"],
    icon: "🐾",
    primaryColor: "#4daa57",
    accentColor: "#2a9d8f",
    benefits: [
      "Track pet details and breed-specific needs",
      "Maintain health and behavior records",
      "Send appointment reminders to pet owners",
      "Share photos of pets during and after services"
    ],
    features: ["Pet profiles", "Breed database", "Service history", "Photo sharing"],
    professionalName: "caretaker",
    professionalPlural: "caretakers",
    clientName: "pet owner",
    appointmentTerm: "visit",
    serviceTerm: "service",
    heroImage: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1541599468348-e96984315921?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  },
  {
    id: "creative",
    name: "Creative Professional",
    description: "Modern booking system for photographers, designers, artists and creative professionals",
    services: ["Photo Session", "Design Consultation", "Custom Artwork", "Portfolio Review", "Creative Direction", "Wedding Photography"],
    icon: "🎨",
    primaryColor: "#fb5607",
    accentColor: "#ff8811",
    benefits: [
      "Showcase your portfolio to potential clients",
      "Manage creative project schedules efficiently",
      "Track project deliverables and milestones",
      "Collect payments for creative services"
    ],
    features: ["Portfolio showcase", "Project timeline", "Client collaboration tools", "Digital delivery"],
    professionalName: "artist",
    professionalPlural: "artists",
    clientName: "client",
    appointmentTerm: "booking",
    serviceTerm: "project",
    heroImage: "https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1532372576444-dda954194ad0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1507499739999-097f9693f783?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  },
  {
    id: "custom",
    name: "Custom Business",
    description: "Fully customizable premium booking system for any professional service business",
    services: ["Custom Service 1", "Custom Service 2", "Custom Service 3", "Custom Service 4", "Custom Service 5"],
    icon: "💼",
    primaryColor: "#3d405b",
    accentColor: "#81b29a",
    benefits: [
      "Create a completely customized booking experience",
      "Design your own service offerings and pricing",
      "Build client relationships with personalized communications",
      "Track business metrics that matter to you"
    ],
    features: ["Customizable calendar", "Flexible service menu", "Client database", "Business analytics"],
    professionalName: "professional",
    professionalPlural: "professionals",
    clientName: "client",
    appointmentTerm: "appointment",
    serviceTerm: "service",
    heroImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    ]
  }
];

// Default industry if none is selected
const defaultIndustry = industryTemplates[0];

// Define context types
interface IndustryContextType {
  selectedIndustry: Industry;
  setSelectedIndustry: (industry: Industry) => void;
  selectIndustryById: (id: string) => void;
}

// Create context
const IndustryContext = createContext<IndustryContextType>({
  selectedIndustry: defaultIndustry,
  setSelectedIndustry: () => {},
  selectIndustryById: () => {}
});

// Provider component
export const IndustryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(() => {
    // Check if we have a stored selection in localStorage
    const storedIndustry = localStorage.getItem('selectedIndustry');
    if (storedIndustry) {
      try {
        const industry = JSON.parse(storedIndustry);
        return industry;
      } catch (e) {
        console.error('Failed to parse stored industry:', e);
      }
    }
    return defaultIndustry;
  });

  // Save to localStorage when industry changes
  useEffect(() => {
    localStorage.setItem('selectedIndustry', JSON.stringify(selectedIndustry));
  }, [selectedIndustry]);

  // Select industry by ID
  const selectIndustryById = (id: string) => {
    const industry = industryTemplates.find(ind => ind.id === id);
    if (industry) {
      setSelectedIndustry(industry);
      
      // Notify the backend about the industry change
      // This will update services and professionals on the server side
      fetch('/api/set-industry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industryId: id }),
      })
      .then(response => response.json())
      .then(() => {
        // Force reload services after industry change
        window.location.reload();
      })
      .catch(error => {
        console.error('Error setting industry on server:', error);
      });
    }
  };

  return (
    <IndustryContext.Provider
      value={{
        selectedIndustry,
        setSelectedIndustry,
        selectIndustryById
      }}
    >
      {children}
    </IndustryContext.Provider>
  );
};

// Hook for using the industry context
export const useIndustry = () => useContext(IndustryContext);

// Helper function to get appropriate terminology
export const getTerminology = (industry: Industry) => {
  return {
    professional: industry.professionalName,
    professionals: industry.professionalPlural,
    client: industry.clientName,
    appointment: industry.appointmentTerm,
    service: industry.serviceTerm,
  };
};