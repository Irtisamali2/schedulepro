import { Link } from "wouter";
import { useIndustry, getTerminology } from "@/lib/industryContext";

// Define hero data for each industry
const heroContent = {
  hairstylist: {
    background: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Your Perfect Hair Awaits",
    subheading: "Professional styling services tailored to your unique look",
    buttonText: "Book Appointment"
  },
  carpenter: {
    background: "https://images.unsplash.com/photo-1594717527389-a590b56e331d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Craftsmanship That Lasts",
    subheading: "Custom woodworking from expert carpenters who care about the details",
    buttonText: "Request a Job"
  },
  massage: {
    background: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Relaxation & Rejuvenation",
    subheading: "Therapeutic massage treatments to restore balance to your body and mind",
    buttonText: "Book a Session"
  },
  nails: {
    background: "https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Beautiful Nails, Confident You",
    subheading: "Express yourself with professional nail art and impeccable service",
    buttonText: "Book Appointment"
  },
  plumber: {
    background: "https://images.unsplash.com/photo-1580398562556-d33864b1ad5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Reliable Plumbing Solutions",
    subheading: "Professional plumbing services with guaranteed quality and timely response",
    buttonText: "Schedule Service"
  },
  electrician: {
    background: "https://images.unsplash.com/photo-1558520871-9c508f147e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Powering Your World Safely",
    subheading: "Licensed electricians for all your electrical needs, big or small",
    buttonText: "Schedule Service"
  },
  influencer: {
    background: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Elevate Your Digital Presence",
    subheading: "Professional content creation and social strategy for modern creators",
    buttonText: "Book a Session"
  },
  custom: {
    background: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    heading: "Excellence in Every Detail",
    subheading: "Premium professional services customized to your specific requirements",
    buttonText: "Book Now"
  }
};

export default function Hero() {
  const { selectedIndustry } = useIndustry();
  const terms = getTerminology(selectedIndustry);
  
  // Get the content for the selected industry
  const content = heroContent[selectedIndustry.id as keyof typeof heroContent] || heroContent.custom;
  
  // Create a button text based on terminology
  const buttonText = terms.appointment === "appointment" ? "Book Appointment" :
                     terms.appointment === "job" ? "Schedule a Job" :
                     terms.appointment === "session" ? "Book a Session" :
                     `Book ${terms.appointment.charAt(0).toUpperCase() + terms.appointment.slice(1)}`;
  
  return (
    <section 
      className="relative h-[500px] bg-cover bg-center" 
      style={{ backgroundImage: `url('${content.background}')` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10 text-center">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4"
          style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.5)" }}
        >
          {content.heading}
        </h1>
        <p 
          className="text-xl text-white mb-8 max-w-2xl"
          style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
        >
          {content.subheading}
        </p>
        <Link href="/booking">
          <div 
            className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-8 rounded-full transition duration-300 text-lg cursor-pointer shadow-lg hover:scale-105"
            style={{ 
              backgroundColor: selectedIndustry.primaryColor, 
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)" 
            }}
          >
            {buttonText}
          </div>
        </Link>
      </div>
    </section>
  );
}
