'use client';

import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function OfficialRulesPage() {
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
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">HOLY GRAIL PACKAGE Sweepstakes</h1>
              <p className="text-gray-300 text-sm mt-1">Official Rules</p>
            </div>
          </div>
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm font-semibold mb-2">
              IMPORTANT NOTICE
            </p>
            <p className="text-yellow-200/90 text-sm leading-relaxed">
              THESE OFFICIAL RULES ARE SUBJECT TO A BINDING ARBITRATION PROVISION AND CLASS ACTION WAIVER SET FORTH IN SPONSOR'S TERMS OF SERVICE, WHICH ARE INCORPORATED HEREIN. PLEASE READ CAREFULLY, AS THEY AFFECT YOUR LEGAL RIGHTS.
            </p>
          </div>
          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm font-bold">
              NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING. VOID WHERE PROHIBITED OR RESTRICTED BY LAW.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-8 text-white">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. SPONSOR</h2>
            <p className="text-gray-200">
              The Sweepstakes is sponsored by Seat Jumper Entertainment, Inc. ("SeatJumper," "we," "our," or "Sponsor"), 1810 E Sahara Ave, STE 75115, Las Vegas, NV 89104 USA.
            </p>
            <p className="text-gray-200 mt-2">
              Contact: <a href="mailto:support@seatjumper.com" className="text-yellow-400 hover:text-yellow-300">support@seatjumper.com</a>
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. SWEEPSTAKES OVERVIEW</h2>
            <p className="text-gray-200 mb-4">
              This promotion is the SeatJumper HOLY GRAIL PACKAGE Sweepstakes (the "Sweepstakes").
            </p>
            <p className="text-gray-200 mb-2">The Grail Prize available to be won consists of:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Two (2) tickets to the Super Bowl scheduled for February 2026; and</li>
              <li>One (1) Grail Card valued at approximately $10,000.</li>
            </ul>
            <p className="text-gray-200 mt-4">
              Together, these items constitute the HOLY GRAIL PACKAGE.
            </p>
            <p className="text-gray-200 mt-4 text-sm">
              If the Holy Grail Package is won through regular SeatJumper Jump activity before the Sweepstakes drawing, Sponsor will replace it with another Holy Grail Package of equal or greater value to serve as the Sweepstakes Prize.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. SWEEPSTAKES PERIOD</h2>
            <p className="text-gray-200 mb-4">
              The Sweepstakes begins on <strong>October 1, 2025 at 12:00:00 AM Pacific Time</strong> and ends on <strong>January 1, 2026 at 11:59:59 PM Pacific Time</strong> (the "Sweepstakes Period").
            </p>
            <p className="text-gray-200 text-sm">
              Sponsor's database clock will be the official timekeeper. Sponsor may, in its sole discretion, extend, shorten, suspend, or modify the Sweepstakes Period for any reason, including technical issues or insufficient entries.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. ELIGIBILITY</h2>
            <div className="text-gray-200 space-y-3">
              <p>The Sweepstakes is open only to legal residents of the fifty (50) United States and the District of Columbia who are at least eighteen (18) years of age at the time of entry.</p>
              <p>Employees, officers, directors, and agents of Sponsor and their immediate family members are not eligible.</p>
              <p>The Sweepstakes is void where prohibited by law and is void in states requiring registration or bonding (e.g., New York, Florida, Rhode Island) unless Sponsor has complied with such requirements.</p>
            </div>
          </section>

          <hr className="border-white/20" />

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. ACCEPTANCE OF RULES</h2>
            <p className="text-gray-200">
              By entering, participants agree to these Official Rules, SeatJumper's{' '}
              <Link href="/terms" className="text-yellow-400 hover:text-yellow-300 underline">Terms of Service</Link>, and{' '}
              <Link href="/privacy" className="text-yellow-400 hover:text-yellow-300 underline">Privacy Policy</Link>. In case of conflict, these Rules will govern.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. HOW TO ENTER</h2>
            <p className="text-gray-200 mb-4">
              Entrants may receive a Prize, as defined below, by (i) purchasing Eligible Products or (ii) by submitting a mailed entry (an "Entry") via the no purchase necessary method below. <strong>There is no purchase necessary to enter or win a Prize and any purchase of the Eligible Products will not increase Entrant's chance of winning a Prize.</strong>
            </p>

            <h3 className="text-lg font-semibold text-yellow-400 mb-2 mt-6">Purchase Entry:</h3>
            <p className="text-gray-200">
              Eligible customers who purchase a SeatJumper Jump Bundle during the Sweepstakes Period will automatically receive entry into the Sweepstakes.
            </p>

            <h3 className="text-lg font-semibold text-yellow-400 mb-2 mt-6">No Purchase Necessary (AMOE):</h3>
            <p className="text-gray-200 mb-4">
              For a chance to obtain Grail Cards, at the same odds, while supplies last, an Entrant must hand-print in ink on a piece of paper their full name, complete mailing address, telephone number and age, insert into a standard business size stamped envelope, and mail to:
            </p>
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-gray-200">
              <p className="font-semibold">SeatJumper HOLY GRAIL PACKAGE Sweepstakes Entry</p>
              <p>1810 E Sahara Ave, STE 75115</p>
              <p>Las Vegas, NV 89104 USA</p>
            </div>
            <p className="text-gray-200 mt-4 text-sm">
              Mail-in entries must be postmarked by January 1, 2026 and received no later than January 7, 2026. Upon Sponsor's receipt of an Entry, an Entrant's name will be entered to win a Prize.
            </p>
            <p className="text-gray-200 mt-4 text-sm">
              <strong>Limit one entry per household per calendar quarter</strong> during the Sweepstakes Period. For clarity, eligible calendar quarters are: April 1, 2025 – June 30, 2025; July 1, 2025 – September 30, 2025; and October 1, 2025 – December 31, 2025.
            </p>

            <h3 className="text-lg font-semibold text-yellow-400 mb-2 mt-6">AMOE Processing:</h3>
            <p className="text-gray-200">
              Each AMOE entry received will be individually processed through the same computer-generated random number generator (RNG) methodology used for paid entries. This ensures that mail-in entrants have the exact same statistical odds of winning as purchase entrants.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. CONSENT TO COMMUNICATIONS</h2>
            <p className="text-gray-200">
              Each Entrant who submits an Entry thereby consents to receive communications from the Sponsor for the purpose of administering this Sweepstakes.
            </p>
            <p className="text-gray-200 mt-3">
              An Entrant who submits an Entry will not receive communications from the Sponsor about other offers and communications that may interest the Entrant unless the Entrant agrees to receive such communications independent of their participation in the Sweepstakes.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. PRIZES</h2>
            <p className="text-gray-200 mb-4">One (1) HOLY GRAIL PACKAGE, consisting of:</p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Two (2) Super Bowl tickets (February 2026); and</li>
              <li>One (1) Grail Card valued at approximately $10,000.</li>
            </ul>
            <p className="text-gray-200 mt-4">
              A Winner will receive one (1) card from the list of Grail Cards included in the Eligible Product or a substitute Grail Card of similar rarity and value to those listed for the Eligible Product ("Prize(s)"). The specific Grail Card awarded will depend on the Eligible Product selected when submitting an Entry.
            </p>
            <p className="text-gray-200 mt-4 font-semibold">
              Approximate Retail Value ("ARV"): $30,000.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. ODDS</h2>
            <p className="text-gray-200">
              Odds of winning are approximately 1 in 5,000 (0.02%). Actual odds depend on the total number of eligible entries received during the Sweepstakes Period.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. WINNER SELECTION</h2>
            <p className="text-gray-200 mb-4">
              Each eligible Entry, whether submitted through a purchase or via AMOE, will be evaluated using a computer-generated random number generator (RNG) to ensure fairness and compliance.
            </p>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>For each eligible Entry received, a random number between 0 and 1 will be generated.</li>
              <li>If the randomly generated number is less than 0.0002, that Entry will be deemed the Winner.</li>
              <li>This process reflects the official 1-in-5,000 (0.02%) chance of winning.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. WINNER NOTIFICATION</h2>
            <ul className="list-disc list-inside text-gray-200 space-y-2 ml-4">
              <li>Potential winners will be notified via email and/or phone within three (3) business days.</li>
              <li>To claim the prize, winners must complete and return, within three (3) business days of notification:
                <ul className="list-disc list-inside space-y-2 ml-8 mt-2">
                  <li>An Affidavit of Eligibility and Liability/Publicity Release; and</li>
                  <li>A completed IRS Form W-9 (since prize ARV exceeds $600).</li>
                </ul>
              </li>
              <li>Failure to timely respond or provide required documentation will result in forfeiture, and Sponsor may award the prize to an alternate winner.</li>
            </ul>
          </section>

          <hr className="border-white/20" />

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. TAXES</h2>
            <p className="text-gray-200">
              The winner is solely responsible for all federal, state, and local taxes associated with acceptance and use of the prize.
            </p>
            <p className="text-gray-200 mt-3">
              Sponsor will issue an IRS Form 1099-MISC for the prize value, as required by law.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. PUBLICITY RELEASE</h2>
            <p className="text-gray-200">
              Except where prohibited, winners grant SeatJumper and its affiliates the right to use their name, likeness, biographical info, and city/state of residence for advertising and promotional purposes worldwide, without further compensation.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">14. GENERAL CONDITIONS</h2>
            <p className="text-gray-200">
              Sponsor may disqualify any entries that are incomplete, fraudulent, forged, or tampered with.
            </p>
            <p className="text-gray-200 mt-3">
              Sponsor reserves the right to cancel, suspend, or modify the Sweepstakes if fraud, technical failures, or other causes compromise its integrity. Any attempt to deliberately undermine the Sweepstakes is unlawful and may result in disqualification and legal action.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 15 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">15. LIMITATION OF LIABILITY</h2>
            <p className="text-gray-200">
              By participating, entrants release SeatJumper, its affiliates, officers, employees, and partners from any liability for claims arising from participation, prize acceptance or use, or attendance at associated events.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 16 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">16. DISPUTES</h2>
            <p className="text-gray-200">
              This Sweepstakes is governed by the laws of the State of Nevada. All disputes will be resolved exclusively by binding arbitration on an individual basis, pursuant to SeatJumper's Terms of Service. Entrants waive the right to participate in class actions or jury trials.
            </p>
          </section>

          <hr className="border-white/20" />

          {/* Section 17 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">17. WINNERS LIST</h2>
            <p className="text-gray-200 mb-4">
              For the name of the winner, send a self-addressed, stamped envelope to:
            </p>
            <div className="bg-white/5 border border-white/20 rounded-lg p-4 text-gray-200">
              <p className="font-semibold">SeatJumper HOLY GRAIL PACKAGE Sweepstakes Winners List</p>
              <p>1810 E Sahara Ave, STE 75115</p>
              <p>Las Vegas, NV 89104 USA</p>
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
