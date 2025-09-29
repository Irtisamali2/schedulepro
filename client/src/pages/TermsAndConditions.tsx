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
                <span className="text-xl font-bold text-primary">Scheduled Pro</span>
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
            <p className="text-center text-gray-600 mt-2">Last updated: September 29, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
                <p>
                  By accessing and using Scheduled Pro ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
                <p>
                  Scheduled Pro is a comprehensive business management platform designed for service-based entrepreneurs. 
                  Our platform provides appointment management, client management, payment processing, and business tools 
                  to help you grow and manage your service-based business.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
                <p>
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                  You are responsible for safeguarding the password and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Payment Terms</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Payment processing is handled through secure third-party providers including Stripe and PayPal</li>
                  <li>All payments are processed securely and we do not store your payment information</li>
                  <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                  <li>Refunds are handled on a case-by-case basis according to our refund policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data and Privacy</h2>
                <p>
                  Your privacy is important to us. Our collection and use of personal information is described in our Privacy Policy. 
                  By using our service, you consent to the collection and use of your information as outlined in our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Prohibited Uses</h2>
                <p>You may not use our service:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Service Availability</h2>
                <p>
                  We strive to maintain high service availability but cannot guarantee 100% uptime. 
                  We may need to perform maintenance or updates that could temporarily affect service availability. 
                  We will provide advance notice of planned maintenance when possible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p>
                  In no event shall Scheduled Pro, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                  loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
                <p>
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                  under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
                <p>
                  If you have any questions about these Terms and Conditions, please contact us at:
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
              © 2025 Scheduled Pro. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-3 md:mt-0">
              <Link href="/">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Home</span>
              </Link>
              <Link href="/privacy-policy">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Privacy Policy</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}