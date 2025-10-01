'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-gray-300 text-sm mt-1">Last Updated: October 1, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-8 text-white">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 leading-relaxed">
              Seat Jumper Entertainment, Inc. ("SeatJumper," "we," "us," or "our") values your trust and respects your privacy. This Privacy Policy ("Policy") describes how we collect, use, protect, and share information when you access our websites, mobile applications, services, sweepstakes, and any other interactions you have with us (collectively, the "Services").
            </p>
            <p className="text-gray-200 leading-relaxed">
              By using the Services, you consent to the practices described in this Policy. If you do not agree, please do not use the Services.
            </p>
          </div>

          <hr className="border-white/20" />

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-200 mb-4">We collect information from you and about you in the following ways:</p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Personal Information:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
                  <li>Name, email address, phone number, postal address, date of birth, and profile photo (if provided).</li>
                  <li>Payment and transaction details (via third-party processors).</li>
                  <li>Social features: usernames, public posts, or shared "jumps."</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Financial and Tax Information:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
                  <li>If you win prizes valued at $600 or more, we are required by law to collect your Social Security Number (SSN) or Taxpayer Identification Number for IRS Form 1099-MISC reporting.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Device and Browser Data:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
                  <li>IP address, geolocation (to restrict entry from states requiring bonding/registration), cookies, and device/browser identifiers.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Sweepstakes Entry Data:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
                  <li>Ticket preferences, jump selections, filters, and entry history.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Social Media Data:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
                  <li>If you connect SeatJumper with social media accounts, we may collect associated identifiers and shared content.</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-white/20" />

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-200 mb-4">We use the information we collect to:</p>
            <ol className="list-decimal list-inside text-gray-200 space-y-2 ml-4">
              <li>Provide and personalize your experience (e.g., filter seats, remember preferences).</li>
              <li>Process orders, payments, and fulfill sweepstakes entries.</li>
              <li>Communicate with you about winnings, promotions, updates, or customer support.</li>
              <li>Verify eligibility (e.g., 18+ requirement, state restrictions).</li>
              <li>Prevent fraud and enforce compliance with laws and sweepstakes rules.</li>
              <li>Enable social features and allow users to share jumps and wins.</li>
              <li>Conduct analytics, research, and improve our Services.</li>
              <li>Provide advertising and referral incentives (not third-party remarketing ads).</li>
              <li>Comply with legal obligations, including tax reporting and dispute resolution.</li>
            </ol>
          </section>

          <hr className="border-white/20" />

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Sharing of Information</h2>
            <p className="text-gray-200 mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Service Providers (e.g., payment processors, ticketing partners, fulfillment, geolocation tools).</li>
              <li>Business Partners (for joint promotions, referral programs, and sweepstakes administration).</li>
              <li>Successors in Business Transactions (e.g., merger, acquisition, or sale).</li>
              <li>Law Enforcement/Legal Obligations (when required by law, subpoena, or investigation).</li>
            </ul>
            <p className="text-gray-200 mt-4 font-semibold">We do not sell your information to third parties.</p>
          </section>

          <hr className="border-white/20" />

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
            <p className="text-gray-200 mb-4">
              Depending on your state of residence (California, Virginia, Colorado, Connecticut, and others), you may have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li><strong>Access:</strong> Request the categories or specific pieces of personal information we have collected.</li>
              <li><strong>Delete:</strong> Request deletion of your information (subject to legal/tax record-keeping exceptions).</li>
              <li><strong>Correct:</strong> Request correction of inaccurate personal information.</li>
              <li><strong>Opt-Out:</strong> Opt-out of sale or sharing of personal information for targeted advertising (not currently practiced by SeatJumper).</li>
              <li><strong>Non-Discrimination:</strong> We will not deny services or charge different rates because you exercised your privacy rights.</li>
            </ul>
            <p className="text-gray-200 mt-4">
              You may exercise these rights by contacting us at: <a href="mailto:support@seatjumper.com" className="text-yellow-400 hover:text-yellow-300">support@seatjumper.com</a>
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Financial Incentives</h2>
            <p className="text-gray-200">
              If we offer referral bonuses, discounts, or promotions tied to providing your information (e.g., "Invite a friend and get $20 credit"), the value of your data is reasonably related to the value of the incentive provided. You may opt out at any time.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Children's Privacy</h2>
            <p className="text-gray-200">
              SeatJumper is for individuals 18 years or older. We do not knowingly collect information from anyone under 18. If we learn we have collected information from a minor, we will delete it promptly.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Retention of Information</h2>
            <p className="text-gray-200">
              We retain your information for as long as necessary to provide the Services, comply with our legal obligations (e.g., IRS 1099 reporting), resolve disputes, and enforce agreements. This may include indefinite retention of ticket purchase history and sweepstakes entry records.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-200 mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Maintain sessions and logins.</li>
              <li>Enforce geolocation restrictions.</li>
              <li>Track sweepstakes entries and site usage.</li>
            </ul>
            <p className="text-gray-200 mt-4">
              You can manage cookies via browser or device settings, but some features may not function without them.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Data Security</h2>
            <p className="text-gray-200">
              We use industry-standard safeguards to protect your information. However, no method of transmission or storage is 100% secure. You use the Services at your own risk.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to this Policy</h2>
            <p className="text-gray-200">
              We may update this Policy at any time. Changes are effective immediately upon posting. If we make material changes, we will notify you by email, push notification, or website notice. Continued use of the Services constitutes acceptance of the updated Policy.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
            <p className="text-gray-200 mb-4">
              If you have questions or requests regarding this Policy, please contact us at:
            </p>
            <div className="bg-white/5 border border-white/20 rounded-lg p-6 space-y-2">
              <p className="text-white">
                <span className="text-yellow-400">📧</span> <a href="mailto:support@seatjumper.com" className="text-yellow-400 hover:text-yellow-300">support@seatjumper.com</a>
              </p>
              <p className="text-white">
                <span className="text-yellow-400">📍</span> SeatJumper, Inc.<br />
                <span className="ml-6">1810 E Sahara Ave STE 75115</span><br />
                <span className="ml-6">Las Vegas, NV 89104 US</span>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
