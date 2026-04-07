import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img src="/scheduled-pro-logo.png" alt="Scheduled Pro" className="h-8 w-auto" />
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms and Conditions</CardTitle>
            <p className="text-center text-gray-600 mt-2">Last updated: April 7, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
                <p>
                  By accessing or using Scheduled Pro ("Service"), including our mobile application and website,
                  you accept and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree
                  to these Terms, you must not access or use the Service. These Terms constitute a legally binding
                  agreement between you and Scheduled Pro, LLC ("Scheduled Pro," "we," "us," or "our").
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
                <p>
                  Scheduled Pro is a comprehensive business management platform designed for service-based
                  entrepreneurs. Our platform provides appointment scheduling, client management, payment
                  processing, team management, and business tools to help you manage and grow your service-based
                  business.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
                <p>
                  When you create an account, you must provide accurate, complete, and current information.
                  You are responsible for safeguarding your password and for all activities that occur under your
                  account. You must immediately notify us of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Subscriptions and Payment Terms</h2>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Subscription Plans</h3>
                <p>
                  Scheduled Pro offers subscription-based access to premium features. Plans are available on
                  monthly and yearly billing cycles. Plan details, pricing, and features are presented at the time
                  of purchase and may vary by platform.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Apple In-App Purchase Subscriptions</h3>
                <p>
                  When you subscribe through the Apple App Store (In-App Purchase), the following terms apply:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Payment is charged to your Apple ID account at the time of purchase confirmation.</li>
                  <li>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before
                    the end of the current billing period.</li>
                  <li>Your account will be charged for renewal within 24 hours prior to the end of the current
                    period at the subscription rate for your selected plan.</li>
                  <li>You can manage and cancel your subscription at any time through your Apple ID Account
                    Settings in the App Store. Cancellation takes effect at the end of the current billing period.</li>
                  <li>Any unused portion of a free trial period, if offered, will be forfeited when you purchase
                    a subscription to that publication.</li>
                  <li>Refunds for In-App Purchases are handled by Apple according to Apple's refund policies.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Stripe and Web Payments</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>When subscribing via the web, payments are securely processed through Stripe.</li>
                  <li>Subscription fees are billed in advance on a recurring monthly or annual basis.</li>
                  <li>You may cancel your subscription at any time from your account dashboard. Cancellation takes
                    effect at the end of the current billing period.</li>
                  <li>Refunds for web subscriptions are handled on a case-by-case basis. Contact support@scheduledpro.com for assistance.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.4 Additional Payment Methods</h3>
                <p>
                  For service-related transactions within the platform (e.g., client payments for appointments),
                  additional payment options including PayPal, Zelle, and Venmo may be available. Each payment
                  processor has its own terms of service.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">4.5 Price Changes</h3>
                <p>
                  We reserve the right to change subscription pricing. For existing subscribers, price changes will
                  take effect at the start of the next billing period following notice of the change. Continued use
                  of the Service after a price change constitutes agreement to the new price.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Free Trials</h2>
                <p>
                  We may offer free trial periods for certain subscription plans. At the end of the free trial,
                  your subscription will automatically convert to a paid subscription unless you cancel before
                  the trial ends. Trial eligibility is determined at our sole discretion and may be limited to
                  one trial per user.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Data and Privacy</h2>
                <p>
                  Your privacy is important to us. Our collection and use of personal information is described in
                  our{" "}
                  <Link href="/privacy-policy">
                    <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                  </Link>
                  . By using our Service, you consent to the collection and use of your information as described
                  therein.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Prohibited Uses</h2>
                <p>You agree not to use the Service:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts.</li>
                  <li>To violate any applicable laws, regulations, or rules.</li>
                  <li>To infringe upon the intellectual property rights of others.</li>
                  <li>To harass, abuse, insult, harm, defame, or discriminate against others.</li>
                  <li>To submit false, misleading, or fraudulent information.</li>
                  <li>To interfere with the Service's security features or proper functioning.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Intellectual Property</h2>
                <p>
                  The Service and its original content, features, and functionality are owned by Scheduled Pro,
                  LLC and are protected by copyright, trademark, and other intellectual property laws. You may not
                  copy, modify, distribute, or create derivative works based on the Service without our express
                  written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Service Availability</h2>
                <p>
                  We strive to maintain high service availability but cannot guarantee 100% uptime. We may
                  perform maintenance or updates that could temporarily affect availability. We will provide
                  advance notice of planned maintenance when possible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, Scheduled Pro, its directors, employees, partners,
                  agents, suppliers, or affiliates shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including without limitation loss of profits, data, use,
                  goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Disclaimer of Warranties</h2>
                <p>
                  The Service is provided "as is" and "as available" without warranties of any kind, whether
                  express or implied, including but not limited to implied warranties of merchantability, fitness
                  for a particular purpose, and non-infringement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. Termination</h2>
                <p>
                  We may terminate or suspend your account and access to the Service at our sole discretion,
                  without prior notice, for conduct that we believe violates these Terms or is harmful to other
                  users, us, or third parties. Upon termination, your right to use the Service ceases immediately.
                  Active subscription cancellation and refund are subject to the payment terms above.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">13. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United States,
                  without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">14. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. Material changes will be communicated
                  at least 30 days in advance via email or in-app notification. Your continued use of the Service
                  after changes take effect constitutes acceptance of the revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">15. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-3">
                  <p><strong>Email:</strong> support@scheduledpro.com</p>
                  <p><strong>Address:</strong> Scheduled Pro, LLC</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Scheduled Pro. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-3 md:mt-0">
              <Link href="/">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Home</span>
              </Link>
              <Link href="/privacy-policy">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Privacy Policy</span>
              </Link>
              <Link href="/eula">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">EULA</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
