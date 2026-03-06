import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Star, Sparkles, Home, Lock, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import StripePaymentWrapper from '@/components/payment/StripePaymentWrapper';

interface Plan {
  id: string;
  name: string;
  price?: number; // Old schema format
  billing?: string; // Old schema format
  monthlyPrice?: number | null; // New schema format
  monthlyDiscount?: number;
  monthlyEnabled?: boolean;
  yearlyPrice?: number | null; // New schema format
  yearlyDiscount?: number;
  yearlyEnabled?: boolean;
  features: string[];
  maxUsers: number;
  storageGB: number;
  isActive: boolean;
  isFreeTrial: boolean;
  trialDays: number;
  monthlyStripePriceId?: string | null;
  yearlyStripePriceId?: string | null;
}

interface OnboardingData {
  planId: string;
  businessName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  businessAddress: string;
  industry: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
  businessDescription: string;
  timeZone: string;
  operatingHours: any;
  logoUrl?: string;
}

const STEPS = [
  { number: 1, title: 'Plan Selection', icon: CheckCircle },
  { number: 2, title: 'Business Information', icon: Clock },
  { number: 3, title: 'Account Creation', icon: Star },
  { number: 4, title: 'Payment', icon: Sparkles },
  { number: 5, title: 'Business Setup', icon: CheckCircle },
  { number: 6, title: 'Welcome', icon: Sparkles }
];

const INDUSTRIES = [
  'Beauty & Wellness',
  'Home Services',
  'Pet Care',
  'Creative Services',
  'Consulting',
  'Healthcare',
  'Fitness',
  'Education',
  'Other'
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu'
];

export default function OnboardingFlow() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateName = (name: string): boolean => {
    // Allows letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) return false;

    // Must have at least 2 words (first and last name) or be at least 3 characters with a space
    const words = name.trim().split(/\s+/);
    return words.length >= 2 && words.every(word => word.length >= 2);
  };

  const validateBusinessName = (name: string): boolean => {
    // Must contain at least one letter (not just numbers)
    const hasLetter = /[a-zA-Z]/.test(name);
    return hasLetter && name.trim().length >= 2;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const validateBusinessInfo = (): boolean => {
    const errors: Record<string, string> = {};

    if (!onboardingData.businessName || onboardingData.businessName.trim().length < 2) {
      errors.businessName = 'Business name must be at least 2 characters';
    } else if (!validateBusinessName(onboardingData.businessName)) {
      errors.businessName = 'Business name must contain at least one letter';
    }

    if (!onboardingData.contactPerson || onboardingData.contactPerson.trim().length < 2) {
      errors.contactPerson = 'Contact person name must be at least 2 characters';
    } else if (!validateName(onboardingData.contactPerson)) {
      errors.contactPerson = 'Please enter full name (first and last name with letters only)';
    }

    if (!onboardingData.businessEmail) {
      errors.businessEmail = 'Business email is required';
    } else if (!validateEmail(onboardingData.businessEmail)) {
      errors.businessEmail = 'Please enter a valid email address';
    }

    if (onboardingData.phone && !validatePhone(onboardingData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!onboardingData.industry) {
      errors.industry = 'Please select an industry';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAccountInfo = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    if (!onboardingData.adminEmail) {
      errors.adminEmail = 'Admin email is required';
    } else if (!validateEmail(onboardingData.adminEmail)) {
      errors.adminEmail = 'Please enter a valid email address';
    } else {
      // Check if email already exists
      const emailExists = await checkEmailExists(onboardingData.adminEmail);
      if (emailExists) {
        errors.adminEmail = 'This email is already registered. Please use a different email or login.';
      }
    }

    if (!onboardingData.password) {
      errors.password = 'Password is required';
    } else if (onboardingData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!onboardingData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (onboardingData.password !== onboardingData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper functions for backwards compatibility with pricing data
  const getDisplayPrice = (plan: Plan | any, period: 'monthly' | 'yearly' = billingPeriod) => {
    // Handle new schema format
    if (plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined) {
      const price = period === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      const discount = period === 'monthly' ? (plan.monthlyDiscount || 0) : (plan.yearlyDiscount || 0);
      const enabled = period === 'monthly' ? (plan.monthlyEnabled !== false) : (plan.yearlyEnabled !== false);

      if (!enabled || !price) return null;

      if (discount > 0) {
        return price * (1 - discount / 100);
      }
      return price;
    }

    // Handle old schema format (backwards compatibility)
    if (plan.price !== undefined) {
      // For old format, simulate yearly pricing as monthly price * 10 (with discount)
      if (period === 'yearly') {
        return plan.price * 10;
      }
      return plan.price;
    }

    return null;
  };

  const getBillingPeriodText = (plan: Plan | any, period: 'monthly' | 'yearly' = billingPeriod) => {
    // Handle new schema format
    if (plan.monthlyPrice !== undefined || plan.yearlyPrice !== undefined) {
      return period === 'monthly' ? 'month' : 'year';
    }

    // Handle old schema format - respect the current period selection
    if (plan.billing) {
      return period === 'monthly' ? 'month' : 'year';
    }

    return 'month';
  };

  // Get URL params for plan selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');
    const session = urlParams.get('session');

    if (planId) {
      setOnboardingData(prev => ({ ...prev, planId }));
    }

    if (session) {
      setSessionId(session);
      // Load existing session data
      loadOnboardingSession(session);
    }
  }, []);

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['/api/public/plans']
  });

  const { data: sessionData } = useQuery({
    queryKey: [`/api/onboarding/${sessionId}`],
    enabled: !!sessionId
  });

  const startOnboardingMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch('/api/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      if (!response.ok) throw new Error('Failed to start onboarding');
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCurrentStep(2);
    }
  });

  const saveStepMutation = useMutation({
    mutationFn: async ({ step, data }: { step: number; data: any }) => {
      const response = await fetch(`/api/onboarding/${sessionId}/step/${step}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save step data');
      return response.json();
    }
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/onboarding/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to complete onboarding');
      return response.json();
    },
    onSuccess: (data) => {
      // Store client login info and redirect to client dashboard
      localStorage.setItem('clientUser', JSON.stringify(data.user));
      localStorage.setItem('clientData', JSON.stringify(data.client));
      setLocation('/client-dashboard');
    }
  });

  const loadOnboardingSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/onboarding/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentStep(data.currentStep || 1);
        setOnboardingData(data.businessData || {});
        if (data.plan) {
          setSelectedPlan(data.plan);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding session:', error);
    }
  };

  const handlePlanSelection = async (plan: Plan) => {
    setSelectedPlan(plan);
    setOnboardingData(prev => ({ ...prev, planId: plan.id }));

    if (plan.isFreeTrial) {
      // For free trial, start onboarding immediately
      startOnboardingMutation.mutate(plan.id);
    } else {
      // For paid plans, continue with regular flow
      startOnboardingMutation.mutate(plan.id);
    }
  };

  const handleNextStep = async () => {
    if (!sessionId) return;

    // Validate based on current step
    if (currentStep === 2) {
      if (!validateBusinessInfo()) {
        return;
      }
    } else if (currentStep === 3) {
      const isValid = await validateAccountInfo();
      if (!isValid) {
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Save current step data
      let stepData = {};

      switch (currentStep) {
        case 2:
          stepData = {
            businessName: onboardingData.businessName,
            contactPerson: onboardingData.contactPerson,
            businessEmail: onboardingData.businessEmail,
            phone: onboardingData.phone,
            businessAddress: onboardingData.businessAddress,
            industry: onboardingData.industry
          };
          break;
        case 3:
          stepData = {
            adminEmail: onboardingData.adminEmail,
            password: onboardingData.password
          };
          break;
        case 4:
          // Payment step - for free trial, skip payment
          if (selectedPlan?.isFreeTrial) {
            setCurrentStep(5);
            setIsProcessing(false);
            return;
          }
          stepData = { paymentCompleted: true };
          break;
        case 5:
          stepData = {
            businessDescription: onboardingData.businessDescription,
            timeZone: onboardingData.timeZone,
            operatingHours: onboardingData.operatingHours
          };
          break;
      }

      await saveStepMutation.mutateAsync({ step: currentStep, data: stepData });

      if (currentStep === 5) {
        // Complete onboarding
        await completeOnboardingMutation.mutateAsync();
      } else {
        // If moving to step 3 (Account Info), autofill admin email from business email if not set
        if (currentStep === 2 && onboardingData.businessEmail && !onboardingData.adminEmail) {
          setOnboardingData(prev => ({
            ...prev,
            adminEmail: prev.businessEmail
          }));
        }
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-gray-600 text-base md:text-lg">Select the plan that best fits your business needs</p>
            </div>

            {/* Billing Period Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  data-testid="toggle-monthly"
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  data-testid="toggle-yearly"
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500 shadow-xl' : ''
                      } ${plan.isFreeTrial ? 'border-green-200 bg-green-50' : ''} h-full flex flex-col`}
                    onClick={() => handlePlanSelection(plan)}
                  >
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                        {plan.isFreeTrial && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                            FREE
                          </Badge>
                        )}
                      </div>
                      <div className="text-4xl font-bold text-gray-900">
                        ${getDisplayPrice(plan, billingPeriod) || 0}
                        <span className="text-base font-normal text-gray-600">/{getBillingPeriodText(plan, billingPeriod)}</span>
                      </div>
                      {plan.isFreeTrial && (
                        <p className="text-sm text-green-700 font-medium mt-1">{plan.trialDays} days free trial</p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Business Information</h2>
              <p className="text-gray-600">Tell us about your business</p>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={onboardingData.businessName || ''}
                  onChange={(e) => {
                    setOnboardingData(prev => ({ ...prev, businessName: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, businessName: '' }));
                  }}
                  placeholder="Your Business Name"
                  required
                  className={validationErrors.businessName ? 'border-red-500' : ''}
                />
                {validationErrors.businessName && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.businessName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={onboardingData.contactPerson || ''}
                  onChange={(e) => {
                    setOnboardingData(prev => ({ ...prev, contactPerson: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, contactPerson: '' }));
                  }}
                  placeholder="Your Name"
                  required
                  className={validationErrors.contactPerson ? 'border-red-500' : ''}
                />
                {validationErrors.contactPerson && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.contactPerson}</p>
                )}
              </div>
              <div>
                <Label htmlFor="businessEmail">Business Email *</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={onboardingData.businessEmail || ''}
                  onChange={(e) => {
                    setOnboardingData(prev => ({ ...prev, businessEmail: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, businessEmail: '' }));
                  }}
                  placeholder="business@example.com"
                  required
                  className={validationErrors.businessEmail ? 'border-red-500' : ''}
                />
                {validationErrors.businessEmail && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.businessEmail}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={onboardingData.phone || ''}
                  onChange={(e) => {
                    setOnboardingData(prev => ({ ...prev, phone: e.target.value }));
                    setValidationErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="(555) 123-4567"
                  className={validationErrors.phone ? 'border-red-500' : ''}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="businessAddress">Business Address</Label>
                <Input
                  id="businessAddress"
                  value={onboardingData.businessAddress || ''}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, businessAddress: e.target.value }))}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={onboardingData.industry || ''} onValueChange={(value) => setOnboardingData(prev => ({ ...prev, industry: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        const passwordsMatch = onboardingData.password && onboardingData.confirmPassword &&
          onboardingData.password === onboardingData.confirmPassword;
        const hasPasswordMismatch = onboardingData.password && onboardingData.confirmPassword &&
          onboardingData.password !== onboardingData.confirmPassword;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
              <p className="text-gray-600">Set up your admin login credentials</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <div className="relative">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <div className="relative">
                    <Input
                      id="adminEmail"
                      type="email"
                      value={onboardingData.businessEmail || ''}
                      readOnly
                      disabled
                      className="bg-gray-100 text-gray-500 cursor-not-allowed pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your admin email matches your business email.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={onboardingData.password || ''}
                    onChange={(e) => {
                      setOnboardingData(prev => ({ ...prev, password: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder="Enter a secure password (min 8 characters)"
                    required
                    className={`pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={onboardingData.confirmPassword || ''}
                    onChange={(e) => {
                      setOnboardingData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="Confirm your password"
                    required
                    className={`pr-10 ${(hasPasswordMismatch || validationErrors.confirmPassword) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                )}
                {hasPasswordMismatch && !validationErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
                {passwordsMatch && !validationErrors.confirmPassword && (
                  <p className="text-green-500 text-sm mt-1">Passwords match ✓</p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        if (selectedPlan?.isFreeTrial) {
          return (
            <div className="text-center space-y-6">
              <div>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Free Trial Activated!</h2>
                <p className="text-gray-600">
                  You're all set with your {selectedPlan.trialDays}-day free trial of {selectedPlan.name}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  No payment required. You can upgrade to a paid plan at any time during your trial.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Payment Information</h2>
              <p className="text-gray-600">Complete your subscription to {selectedPlan?.name}</p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span>{selectedPlan?.name} Plan</span>
                  <span className="font-bold">${selectedPlan ? getDisplayPrice(selectedPlan) : 0}/{selectedPlan ? getBillingPeriodText(selectedPlan) : 'month'}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total</span>
                    <span>${selectedPlan ? getDisplayPrice(selectedPlan) : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {import.meta.env.VITE_STRIPE_PUBLIC_KEY ? (
              <div className="max-w-md mx-auto">
                <StripePaymentWrapper
                  plan={selectedPlan}
                  billingPeriod={billingPeriod}
                  customerEmail={onboardingData.adminEmail || onboardingData.businessEmail || ''}
                  onSuccess={() => setCurrentStep(5)}
                />
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 max-w-md mx-auto text-left">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <span className="font-bold">Stripe Integration Not Configured</span>
                        <br />
                        To activate real payments, you must add your <code>VITE_STRIPE_PUBLIC_KEY</code> and <code>STRIPE_SECRET_KEY</code> to the <code>.env</code> file.
                        <br />
                        Currently running in simulation mode.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Payment processing will be implemented with Stripe integration
                </p>
                <Button onClick={() => setCurrentStep(5)}>
                  Simulate Payment Complete
                </Button>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Business Setup</h2>
              <p className="text-gray-600">Final setup for your business profile</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="businessDescription">Business Description</Label>
                <Textarea
                  id="businessDescription"
                  value={onboardingData.businessDescription || ''}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, businessDescription: e.target.value }))}
                  placeholder="Brief description of your business and services..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select value={onboardingData.timeZone || ''} onValueChange={(value) => setOnboardingData(prev => ({ ...prev, timeZone: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace('_', ' ').replace('America/', '').replace('Pacific/', '')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div>
              <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">Welcome to Your Dashboard!</h2>
              <p className="text-gray-600 mb-6">
                Your account has been successfully created. You're ready to start managing your business!
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Set up your services and pricing</li>
                <li>• Configure your appointment hours</li>
                <li>• Create your client website</li>
                <li>• Start tracking leads and bookings</li>
              </ul>
            </div>

            <Button
              onClick={() => setLocation('/client-dashboard')}
              size="lg"
              className="mt-6"
            >
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPlan !== null;
      case 2:
        return onboardingData.businessName &&
          onboardingData.contactPerson &&
          onboardingData.businessEmail &&
          onboardingData.industry;
      case 3:
        return (onboardingData.adminEmail || onboardingData.businessEmail) &&
          onboardingData.password &&
          onboardingData.password.length >= 6 &&
          onboardingData.confirmPassword &&
          onboardingData.password === onboardingData.confirmPassword;
      case 4:
        return true; // Payment step
      case 5:
        return true; // Business setup
      case 6:
        return false; // Final step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            {/* Desktop Progress Steps */}
            <div className="hidden md:flex items-center space-x-4">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.number;
                const isComplete = currentStep > step.number;
                const Icon = step.icon;

                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isComplete ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`ml-2 text-sm ${isActive ? 'font-semibold text-blue-600' :
                      isComplete ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                      {step.title}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div className={`w-8 h-px mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Progress Indicator */}
            <div className="md:hidden text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white`}>
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
              </div>
              <div className="text-sm font-semibold text-blue-600">
                {STEPS[currentStep - 1].title}
              </div>
            </div>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="max-w-2xl mx-auto" />
          <p className="text-center text-sm text-gray-600 mt-2">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>

        {/* Step Content */}
        <Card className="max-w-4xl mx-auto mx-4 sm:mx-auto">
          <CardContent className="p-4 md:p-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep !== 6 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1 || isProcessing}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={handleNextStep}
                  disabled={!canProceed() || isProcessing}
                >
                  {isProcessing ? 'Processing...' :
                    currentStep === 5 ? 'Complete Setup' : 'Next'}
                  {!isProcessing && currentStep !== 5 && (
                    <ArrowRight className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}