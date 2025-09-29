import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-gray-600 mt-2">Last updated: September 29, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
                <p>
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support.
                </p>
                <h3 className="text-lg font-semibold mt-4 mb-2">Information you provide to us:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Account information (name, email address, phone number)</li>
                  <li>Business information (business name, address, industry type)</li>
                  <li>Client and appointment data</li>
                  <li>Payment information (processed securely by third-party providers)</li>
                  <li>Communications with us (support requests, feedback)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Communicate with you about products, services, and events</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Information Sharing and Disclosure</h2>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                  except as described in this policy:
                </p>
                <h3 className="text-lg font-semibold mt-4 mb-2">We may share your information:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>With service providers who assist us in operating our platform</li>
                  <li>With payment processors to handle transactions securely</li>
                  <li>When required by law or to respond to legal process</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
                <p>
                  We implement appropriate security measures to protect your personal information against unauthorized access, 
                  alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Encryption of sensitive data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers and infrastructure</li>
                  <li>Employee training on data protection practices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to provide our services, 
                  comply with legal obligations, resolve disputes, and enforce our agreements. 
                  When we no longer need your information, we securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Your Rights and Choices</h2>
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                  <li><strong>Restriction:</strong> Request restriction of processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Third-Party Services</h2>
                <p>
                  Our service integrates with third-party services for payment processing, email delivery, 
                  and other functionality. These services have their own privacy policies:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Stripe:</strong> Payment processing (stripe.com/privacy)</li>
                  <li><strong>PayPal:</strong> Payment processing (paypal.com/privacy)</li>
                  <li><strong>Resend:</strong> Email delivery (resend.com/privacy)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your information when it is transferred internationally.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Children's Privacy</h2>
                <p>
                  Our service is not intended for children under 13 years of age. 
                  We do not knowingly collect personal information from children under 13. 
                  If we become aware that we have collected personal information from a child under 13, 
                  we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Updates to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                  Privacy Policy on this page and updating the "Last updated" date. 
                  We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-3">
                  <p><strong>Email:</strong> privacy@scheduledpro.com</p>
                  <p><strong>Address:</strong> Scheduled Pro, LLC</p>
                  <p><strong>Data Protection Officer:</strong> privacy@scheduledpro.com</p>
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
              <Link href="/terms-and-conditions">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Terms and Conditions</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}