import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function EULA() {
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
            <CardTitle className="text-3xl font-bold text-center">End User License Agreement (EULA)</CardTitle>
            <p className="text-center text-gray-600 mt-2">Last updated: April 7, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <p>
                  This End User License Agreement ("EULA") is a legal agreement between you ("User" or "you")
                  and Scheduled Pro, LLC ("Scheduled Pro," "we," "us," or "our") for the use of the Scheduled Pro
                  mobile application and related services (the "App"). By downloading, installing, or using the
                  App, you agree to be bound by this EULA. If you do not agree, do not download, install, or use
                  the App.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">1. License Grant</h2>
                <p>
                  Subject to your compliance with this EULA, Scheduled Pro grants you a limited, non-exclusive,
                  non-transferable, revocable license to download, install, and use the App on devices that you
                  own or control, solely for your personal or internal business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. License Restrictions</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Copy, modify, or distribute the App or any part thereof.</li>
                  <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the App.</li>
                  <li>Rent, lease, lend, sell, sublicense, or transfer the App to any third party.</li>
                  <li>Remove, alter, or obscure any proprietary notices, labels, or marks on the App.</li>
                  <li>Use the App for any unlawful purpose or in violation of any applicable laws.</li>
                  <li>Use the App to transmit viruses, malware, or other harmful code.</li>
                  <li>Interfere with or disrupt the integrity or performance of the App or its servers.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Subscriptions and In-App Purchases</h2>
                <p>
                  The App offers auto-renewing subscription plans that unlock premium features:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Basic Monthly</strong> and <strong>Basic Yearly</strong> plans for individual professionals.</li>
                  <li><strong>Team Monthly</strong> and <strong>Team Yearly</strong> plans for businesses with team members.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">3.1 Auto-Renewal Terms</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Payment is charged to your Apple ID account at confirmation of purchase.</li>
                  <li>Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before
                    the end of the current billing period.</li>
                  <li>Your account will be charged for renewal within 24 hours prior to the end of the current
                    period.</li>
                  <li>The renewal cost equals the price of the plan you selected, unless we provide advance
                    notice of a price change.</li>
                </ul>

                <h3 className="text-lg font-semibold mt-4 mb-2">3.2 Managing and Canceling Subscriptions</h3>
                <p>
                  You can manage or cancel your subscription at any time through your Apple ID Account Settings
                  (Settings &gt; [Your Name] &gt; Subscriptions). Cancellation takes effect at the end of the
                  current billing period. You will continue to have access to premium features until the end of
                  the paid period.
                </p>

                <h3 className="text-lg font-semibold mt-4 mb-2">3.3 Free Trials</h3>
                <p>
                  If a free trial is offered, it will be clearly identified in the App along with its duration.
                  At the end of the free trial, your subscription will automatically convert to a paid subscription
                  at the stated price unless you cancel before the trial period ends. Any unused portion of a free
                  trial will be forfeited upon purchasing a subscription.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Intellectual Property</h2>
                <p>
                  The App, including all content, features, functionality, design, graphics, and software, is
                  owned by Scheduled Pro, LLC and is protected by copyright, trademark, patent, and other
                  intellectual property laws. This EULA does not grant you any ownership interest in the App.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Privacy</h2>
                <p>
                  Your use of the App is also governed by our{" "}
                  <Link href="/privacy-policy">
                    <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                  </Link>
                  , which describes how we collect, use, and protect your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
                <p>
                  THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
                  OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE
                  UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SCHEDULED PRO, ITS
                  AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING
                  OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR
                  ANY OTHER LEGAL THEORY.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Termination</h2>
                <p>
                  This EULA is effective until terminated. We may terminate or suspend your license at any time
                  without prior notice if you breach any provision of this EULA. Upon termination, you must cease
                  all use of the App and delete all copies from your devices. Termination does not affect any
                  accrued rights or obligations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Apple-Specific Terms</h2>
                <p>
                  If you downloaded the App from the Apple App Store, the following additional terms apply:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>This EULA is between you and Scheduled Pro, LLC only, and not with Apple Inc. ("Apple").
                    Apple is not responsible for the App or its content.</li>
                  <li>Apple has no obligation to provide maintenance or support services for the App.</li>
                  <li>In the event of any failure of the App to conform to any applicable warranty, you may notify
                    Apple, and Apple will refund the purchase price (if applicable). To the maximum extent permitted
                    by law, Apple has no other warranty obligation with respect to the App.</li>
                  <li>Apple is not responsible for addressing any claims relating to the App, including product
                    liability claims, consumer protection claims, or intellectual property infringement claims.</li>
                  <li>In the event of any third-party claim that the App infringes a third party's intellectual
                    property rights, Scheduled Pro, not Apple, is solely responsible for the investigation,
                    defense, settlement, and discharge of such claim.</li>
                  <li>Apple and its subsidiaries are third-party beneficiaries of this EULA and, upon your
                    acceptance, Apple will have the right to enforce this EULA against you as a third-party
                    beneficiary.</li>
                  <li>You represent and warrant that (i) you are not located in a country subject to a U.S.
                    Government embargo or designated as a "terrorist supporting" country, and (ii) you are not
                    listed on any U.S. Government list of prohibited or restricted parties.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Governing Law</h2>
                <p>
                  This EULA shall be governed by and construed in accordance with the laws of the United States,
                  without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Changes to This EULA</h2>
                <p>
                  We may update this EULA from time to time. Material changes will be communicated via the App
                  or by email. Your continued use of the App after changes take effect constitutes acceptance of
                  the revised EULA.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
                <p>
                  If you have any questions about this EULA, please contact us:
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
