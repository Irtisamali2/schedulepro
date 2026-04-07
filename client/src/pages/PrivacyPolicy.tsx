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
            <p className="text-center text-gray-600 mt-2">Last updated: April 7, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <p>
                  Scheduled Pro, LLC ("Scheduled Pro," "we," "us," or "our") respects your privacy and is committed to
                  protecting the personal information you share with us. This Privacy Policy describes how we collect,
                  use, disclose, and safeguard your information when you use our mobile application (the "App"),
                  website, and related services (collectively, the "Service"). By using the Service, you agree to the
                  collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
                <h3 className="text-lg font-semibold mt-4 mb-2">1.1 Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Account information:</strong> Name, email address, phone number, and password when you create an account.</li>
                  <li><strong>Business information:</strong> Business name, address, industry type, operating hours, and logo.</li>
                  <li><strong>Client and appointment data:</strong> Names, contact details, appointment schedules, and service preferences of your clients.</li>
                  <li><strong>Payment information:</strong> When you subscribe to a paid plan, payment is processed by Apple (via In-App Purchase) or Stripe. We do not directly collect or store your credit card number. We may receive transaction confirmations, receipt data, and subscription status from these processors.</li>
                  <li><strong>Communications:</strong> Messages, feedback, and support requests you send to us.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">1.2 Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Device information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
                  <li><strong>Usage data:</strong> Pages visited, features used, time spent on the Service, and interaction data.</li>
                  <li><strong>Log data:</strong> IP address, browser type, access times, and referring URLs.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">1.3 Information from Third Parties</h3>
                <p>
                  We may receive transaction and subscription status information from Apple (App Store) and Stripe
                  to verify your subscription and process payments.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Provide, operate, maintain, and improve the Service.</li>
                  <li>Process subscriptions and payments, including In-App Purchases via Apple and payments via Stripe, PayPal, Zelle, or Venmo.</li>
                  <li>Verify subscription status and manage your account.</li>
                  <li>Send transactional communications such as receipts, subscription confirmations, renewal reminders, and support messages.</li>
                  <li>Respond to your comments, questions, and support requests.</li>
                  <li>Monitor and analyze usage trends and activities to improve user experience.</li>
                  <li>Detect, investigate, and prevent fraudulent or unauthorized transactions.</li>
                  <li>Comply with legal obligations and enforce our terms.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Subscriptions, Payments & Auto-Renewal</h2>
                <p>
                  Scheduled Pro offers subscription plans that may be purchased through the Apple App Store
                  (In-App Purchase) or via Stripe on the web.
                </p>
                <h3 className="text-lg font-semibold mt-4 mb-2">3.1 Apple In-App Purchases</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Payment is charged to your Apple ID account at confirmation of purchase.</li>
                  <li>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current billing period.</li>
                  <li>Your account will be charged for renewal within 24 hours prior to the end of the current period at the same rate.</li>
                  <li>You can manage and cancel subscriptions by going to your Account Settings in the App Store after purchase.</li>
                  <li>Any unused portion of a free trial period, if offered, will be forfeited when you purchase a subscription.</li>
                  <li>Apple processes all In-App Purchase payments. We do not have access to your Apple payment credentials.</li>
                </ul>
                <h3 className="text-lg font-semibold mt-4 mb-2">3.2 Stripe & Other Payment Processors</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>When subscribing via the web, payments are processed securely through Stripe. We do not store your full credit card details.</li>
                  <li>Additional payment options (PayPal, Zelle, Venmo) may be available for service-related transactions within the platform.</li>
                  <li>Each payment processor has its own privacy policy governing the handling of your payment information.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Information Sharing and Disclosure</h2>
                <p>
                  We do not sell, trade, or rent your personal information to third parties. We may share your
                  information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Service providers:</strong> With trusted third-party vendors who assist in operating our platform (e.g., hosting, analytics, email delivery via Resend).</li>
                  <li><strong>Payment processors:</strong> With Apple, Stripe, PayPal, and other processors to handle transactions securely.</li>
                  <li><strong>Legal requirements:</strong> When required by law, subpoena, or legal process, or to protect our rights, property, or safety.</li>
                  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Encryption of sensitive data in transit (TLS/SSL) and at rest.</li>
                  <li>Regular security assessments and updates.</li>
                  <li>Access controls and authentication requirements for all personnel.</li>
                  <li>Secure cloud infrastructure and data storage.</li>
                </ul>
                <p className="mt-2">
                  While we strive to protect your information, no method of electronic transmission or storage is
                  100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
                <p>
                  We retain your personal information for as long as your account is active or as needed to provide
                  the Service, comply with legal obligations, resolve disputes, and enforce our agreements. When your
                  information is no longer needed, we securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Your Rights and Choices</h2>
                <p>Depending on your jurisdiction, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information.</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service in a machine-readable format.</li>
                  <li><strong>Objection:</strong> Object to the processing of your personal information.</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances.</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time using the link in our emails.</li>
                </ul>
                <p className="mt-2">
                  To exercise any of these rights, contact us at <strong>privacy@scheduledpro.com</strong>. We will
                  respond within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Third-Party Services</h2>
                <p>
                  Our Service integrates with third-party services. Each has its own privacy policy:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Apple:</strong> In-App Purchase processing &mdash; <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">apple.com/legal/privacy</a></li>
                  <li><strong>Stripe:</strong> Payment processing &mdash; <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">stripe.com/privacy</a></li>
                  <li><strong>PayPal:</strong> Payment processing &mdash; <a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">paypal.com/privacy</a></li>
                  <li><strong>Resend:</strong> Email delivery &mdash; <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com/privacy</a></li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure
                  appropriate safeguards (such as standard contractual clauses) are in place to protect your
                  information during international transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Children's Privacy</h2>
                <p>
                  The Service is not intended for use by anyone under the age of 13 (or the applicable age of
                  digital consent in your jurisdiction). We do not knowingly collect personal information from
                  children. If we learn that we have collected information from a child, we will promptly delete it.
                  If you believe a child has provided us with personal data, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. California Privacy Rights (CCPA)</h2>
                <p>
                  If you are a California resident, you have additional rights under the California Consumer Privacy
                  Act (CCPA), including the right to know what personal information we collect, the right to request
                  deletion, and the right to opt out of the sale of personal information. We do not sell personal
                  information. To exercise your rights, contact us at <strong>privacy@scheduledpro.com</strong>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of material changes by
                  posting the updated policy on this page and updating the "Last updated" date. For significant
                  changes, we may also notify you via email or in-app notification. Your continued use of the
                  Service after changes constitutes acceptance of the updated policy. We encourage you to review
                  this Privacy Policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
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
              &copy; {new Date().getFullYear()} Scheduled Pro. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-3 md:mt-0">
              <Link href="/">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Home</span>
              </Link>
              <Link href="/terms-and-conditions">
                <span className="text-gray-600 hover:text-primary text-sm cursor-pointer">Terms and Conditions</span>
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
