'use client';

import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-gray-300 text-sm mt-1">Last Updated: October 1, 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-8 text-white">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 leading-relaxed">
              These Terms of Service ("Terms") form a legally binding agreement between you and SeatJumper, Inc. ("SeatJumper," "we," "us," or "our") and govern your access to and use of our websites, mobile applications, and services (collectively, the "Services").
            </p>
            <p className="text-gray-200 leading-relaxed">
              By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use the Services.
            </p>
          </div>

          <hr className="border-white/20" />

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Eligibility</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>You must be at least 18 years old to use SeatJumper.</li>
              <li>The Services are available only to U.S. residents.</li>
              <li>Residents of certain states (e.g., New York, Florida, Rhode Island) may be excluded from Grail sweepstakes prizes unless and until SeatJumper complies with those states' registration or bonding requirements.</li>
              <li>By using the Services, you represent that you meet these requirements.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. The SeatJumper Bundles</h2>
            <p className="text-gray-200 mb-4">When you purchase a SeatJumper "Bundle," you are buying a package of merchandise that includes:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Guaranteed memorabilia items (fulfilled directly by us or through third-party partners); and</li>
              <li>Randomly allocated event tickets that may vary significantly in seating location and fair market value.</li>
            </ul>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-8 mt-4">
              <li>Ticket allocation within Bundles is random and may range from standard seating to premium seating.</li>
              <li>All Bundle purchases are product sales, not sweepstakes prizes.</li>
              <li>Sales tax may apply depending on the laws of the state where the memorabilia is delivered or where the event occurs.</li>
              <li>All Bundle purchases are final and non-refundable, except as otherwise stated in Section 6 (Refunds & Cancellations).</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Grail Sweepstakes</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>In addition to Bundles, SeatJumper may run sweepstakes for designated "Grail" prizes (for example, Super Bowl tickets, World Series tickets, or other premium event access).</li>
              <li>Entry into Grail sweepstakes may occur automatically with each eligible Bundle purchase, but no purchase is necessary to enter.</li>
              <li>An Alternate Method of Entry ("AMOE") is always available; full details are provided in the official sweepstakes rules posted on our site for each Grail promotion.</li>
              <li>Only Grail prizes are considered sweepstakes prizes.</li>
              <li>Odds of winning depend on the number of eligible entries received.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Taxes</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Grail winners must provide a completed IRS Form W-9 and any other required documentation before receiving their prize.</li>
              <li>If your total Grail prize value in a calendar year is $600 or more, SeatJumper will issue an IRS Form 1099-MISC to you and file it with the IRS.</li>
              <li>Winners are solely responsible for all federal, state, and local taxes associated with Grail prizes.</li>
              <li>You are also responsible for any applicable sales or admissions taxes related to your Bundle purchases.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. User Accounts</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>You may be required to create an account to use certain features.</li>
              <li>You must provide accurate, complete, and current information, and you agree to update your account details as needed.</li>
              <li>You are responsible for safeguarding your login credentials and all activity under your account.</li>
              <li>SeatJumper may suspend or terminate accounts that provide false information, engage in fraud, or otherwise violate these Terms.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Refunds & Cancellations</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>All Bundle purchases are final.</li>
              <li>If an event associated with allocated tickets is canceled, SeatJumper or its ticketing partners may provide:
                <ul className="list-disc list-inside space-y-2 ml-8 mt-2">
                  <li>Substitute tickets of comparable value, or</li>
                  <li>A refund, at our sole discretion and consistent with applicable venue and ticketing partner policies.</li>
                </ul>
              </li>
              <li>SeatJumper is not responsible for travel costs or other expenses incurred in connection with events.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Conduct</h2>
            <p className="text-gray-200 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Use the Services for unlawful purposes or in violation of these Terms.</li>
              <li>Circumvent geolocation restrictions or eligibility requirements.</li>
              <li>Interfere with the operation of the Services, including attempting to manipulate sweepstakes outcomes.</li>
              <li>Resell or transfer tickets obtained through SeatJumper except as permitted by applicable laws and venue policies.</li>
              <li>Post or share content that is fraudulent, defamatory, infringing, obscene, or otherwise harmful.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Intellectual Property</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>All content, branding, and technology on the Services are owned by SeatJumper or its licensors.</li>
              <li>You may not copy, distribute, or create derivative works without our prior written consent.</li>
              <li>You retain rights to any content you submit to SeatJumper (e.g., user reviews, social posts), but you grant SeatJumper a nonexclusive license to use, display, and share that content in connection with operating and promoting the Services.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer of Warranties</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>The Services are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind.</li>
              <li>SeatJumper disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.</li>
              <li>We do not guarantee that tickets allocated through Bundles will meet your expectations, or that events will occur as scheduled.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>To the maximum extent permitted by law, SeatJumper shall not be liable for indirect, incidental, consequential, or punitive damages arising out of your use of the Services.</li>
              <li>Our total liability to you for all claims in aggregate shall not exceed the total amount you paid to SeatJumper in the 12 months prior to the claim.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Indemnification</h2>
            <p className="text-gray-200">
              You agree to indemnify, defend, and hold harmless SeatJumper and its officers, employees, partners, and affiliates from any claims, damages, or expenses arising out of your use of the Services, your violation of these Terms, or your violation of any rights of third parties.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Dispute Resolution</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>All disputes shall be resolved by binding arbitration on an individual basis.</li>
              <li>You waive the right to participate in class actions or jury trials.</li>
              <li>Arbitration shall be conducted under the rules of [AAA/JAMS], seated in [Governing State].</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Governing Law</h2>
            <p className="text-gray-200">
              These Terms shall be governed by and construed in accordance with the laws of the State of [Insert State], without regard to conflict of laws principles.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">14. Changes</h2>
            <p className="text-gray-200">
              We may update these Terms at any time. The updated Terms will be posted on the Services with a new effective date. Your continued use after posting means you accept the changes.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 15 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">15. Contact Us</h2>
            <p className="text-gray-200 mb-4">
              If you have questions about these Terms, contact us at:
            </p>
            <div className="bg-white/5 border border-white/20 rounded-lg p-6 space-y-2">
              <p className="text-white">
                <span className="text-yellow-400">📧</span> <a href="mailto:support@seatjumper.com" className="text-yellow-400 hover:text-yellow-300">support@seatjumper.com</a>
              </p>
              <p className="text-white">
                <span className="text-yellow-400">📍</span> Seat Jumper Entertainment, Inc.<br />
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
