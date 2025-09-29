import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, Calendar, CreditCard, User, FileText, DollarSign, CheckCircle } from "lucide-react";
import { type ClientService, type Stylist, type Appointment, type BookingData } from "@shared/schema";

// Step Components
import ServiceSelection from "@/components/booking/steps/ServiceSelection";
import AppointmentDetails from "@/components/booking/steps/AppointmentDetails";
import AdditionalDetails from "@/components/booking/steps/AdditionalDetails";
import PaymentMethod from "@/components/booking/steps/PaymentMethod";
import PaymentProcessing from "@/components/booking/steps/PaymentProcessing";
import BookingConfirmation from "@/components/booking/steps/BookingConfirmation";


const TOTAL_STEPS = 6;

const stepConfig = [
  {
    id: 1,
    title: "Service Selection",
    description: "Choose your service",
    icon: User,
    required: ["serviceId"]
  },
  {
    id: 2,
    title: "Appointment Details",
    description: "Select date, time and your info",
    icon: Calendar,
    required: ["appointmentDate", "timeSlot", "clientName", "clientEmail", "clientPhone"]
  },
  {
    id: 3,
    title: "Additional Details",
    description: "Special requests and preferences",
    icon: FileText,
    required: []
  },
  {
    id: 4,
    title: "Payment Method",
    description: "Choose how you'd like to pay",
    icon: DollarSign,
    required: ["paymentMethod"]
  },
  {
    id: 5,
    title: "Payment Processing",
    description: "Complete your payment",
    icon: CreditCard,
    required: []
  },
  {
    id: 6,
    title: "Confirmation",
    description: "Your booking is confirmed!",
    icon: CheckCircle,
    required: []
  }
];

export default function MultiStepBooking() {
  const { clientId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: null,
    stylistId: null,
    appointmentDate: null,
    timeSlot: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    specialRequests: "",
    howHeardAboutUs: "",
    emailConfirmation: true,
    smsConfirmation: false,
    paymentMethod: null,
    paymentIntentId: null,
    paymentStatus: null,
    appointmentId: null,
    confirmationNumber: null,
  });

  // Fetch services and stylists data
  const { data: services, isLoading: servicesLoading } = useQuery<ClientService[]>({
    queryKey: [`/api/public/client/${clientId}/services`],
    enabled: !!clientId
  });
  
  const { data: stylists, isLoading: stylistsLoading } = useQuery<Stylist[]>({
    queryKey: [`/api/public/clients/${clientId}/website-staff`],
    enabled: !!clientId
  });

  // Update booking data helper
  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  // Check if current step can proceed
  const canProceedFromStep = (step: number): boolean => {
    const config = stepConfig.find(s => s.id === step);
    if (!config) return false;

    return config.required.every(field => {
      const value = bookingData[field as keyof BookingData];
      return value !== null && value !== "";
    });
  };

  // Check if step is completed
  const isStepCompleted = (step: number): boolean => {
    if (step > currentStep) return false;
    if (step < currentStep) return true;
    return canProceedFromStep(step);
  };

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < TOTAL_STEPS && canProceedFromStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || isStepCompleted(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Calculate progress percentage
  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  // Get selected service and stylist for display
  const selectedService = services?.find(service => service.id === bookingData.serviceId);
  const selectedStylist = stylists?.find(stylist => stylist.id === bookingData.stylistId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Appointment</h1>
          <p className="text-lg text-gray-600">Follow the steps below to schedule your perfect appointment</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3 bg-gray-200" />
        </div>

        {/* Step Indicators - Desktop */}
        <div className="hidden lg:flex justify-between items-center mb-8 relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
              style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
          
          {stepConfig.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = isStepCompleted(step.id);
            const isAccessible = step.id <= currentStep || isStepCompleted(step.id - 1);
            
            return (
              <div
                key={step.id}
                className={`relative z-10 flex flex-col items-center cursor-pointer transition-all duration-200 ${
                  isAccessible ? 'hover:scale-105' : 'cursor-not-allowed opacity-50'
                }`}
                onClick={() => isAccessible && goToStep(step.id)}
                data-testid={`step-indicator-${step.id}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center mt-2 max-w-32">
                  <p className={`text-xs font-semibold ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 hidden xl:block">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Indicators - Mobile */}
        <div className="lg:hidden flex justify-center mb-6">
          <div className="flex space-x-2">
            {stepConfig.map((step) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentStep === step.id
                    ? 'bg-blue-600'
                    : isStepCompleted(step.id)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
                data-testid={`mobile-step-indicator-${step.id}`}
              />
            ))}
          </div>
        </div>

        {/* Current Step Title - Mobile */}
        <div className="lg:hidden text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {stepConfig[currentStep - 1]?.title}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {stepConfig[currentStep - 1]?.description}
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Step Content */}
            <div className="min-h-[600px]">
              {currentStep === 1 && (
                <ServiceSelection
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                  services={services || []}
                  stylists={stylists || []}
                  isLoading={servicesLoading || stylistsLoading}
                />
              )}
              
              {currentStep === 2 && (
                <AppointmentDetails
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                  selectedService={selectedService}
                  selectedStylist={selectedStylist}
                />
              )}
              
              {currentStep === 3 && (
                <AdditionalDetails
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                />
              )}
              
              {currentStep === 4 && (
                <PaymentMethod
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                  selectedService={selectedService}
                />
              )}
              
              {currentStep === 5 && bookingData.paymentMethod === "ONLINE" && (
                <PaymentProcessing
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                  selectedService={selectedService}
                  selectedStylist={selectedStylist}
                />
              )}
              
              {(currentStep === 6 || (currentStep === 5 && bookingData.paymentMethod === "CASH")) && (
                <BookingConfirmation
                  bookingData={bookingData}
                  updateBookingData={updateBookingData}
                  selectedService={selectedService}
                  selectedStylist={selectedStylist}
                  onNavigateBack={() => goToStep(2)}
                />
              )}
            </div>

            {/* Navigation Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                  data-testid="button-previous-step"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  {/* Step completion badges */}
                  {currentStep < TOTAL_STEPS && (
                    <Badge variant={canProceedFromStep(currentStep) ? "default" : "secondary"}>
                      {canProceedFromStep(currentStep) ? "Ready to Continue" : "Complete This Step"}
                    </Badge>
                  )}
                </div>

                {currentStep < TOTAL_STEPS && (
                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceedFromStep(currentStep)}
                    className="flex items-center gap-2"
                    data-testid="button-next-step"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Summary Sidebar - Desktop */}
        {currentStep > 1 && (
          <div className="hidden xl:block fixed right-8 top-1/2 transform -translate-y-1/2 w-80">
            <Card className="bg-white shadow-lg border border-gray-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                
                {selectedService && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium">{selectedService.name}</p>
                    <p className="text-sm text-green-600">{selectedService.price}</p>
                  </div>
                )}
                
                {selectedStylist && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Stylist</p>
                    <p className="font-medium">{selectedStylist.name}</p>
                  </div>
                )}
                
                {bookingData.appointmentDate && bookingData.timeSlot && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="font-medium">
                      {bookingData.appointmentDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{bookingData.timeSlot}</p>
                  </div>
                )}
                
                {bookingData.clientName && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-medium">{bookingData.clientName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}