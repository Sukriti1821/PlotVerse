import { Link } from "react-router-dom";
import {
  FaMountain,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Header Banner */}
        <section className="bg-slate-950 px-6 py-16 text-white text-center">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Thikana Legal Center
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Last updated: September 2026 • Rules, obligations, and safety framework governing your use of Thikana's marketplace and mountain plot reservations.
            </p>

            {/* Legal Navigation Tabs */}
            <div className="mt-8 inline-flex flex-wrap justify-center rounded-full bg-slate-900 p-1.5 border border-slate-800 gap-1">
              <Link
                to="/privacy-policy"
                className="rounded-full px-5 py-2 text-sm font-semibold transition text-slate-400 hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="rounded-full px-5 py-2 text-sm font-semibold transition bg-emerald-600 text-white shadow"
              >
                Terms of Service
              </Link>
              <Link
                to="/cancellation-policy"
                className="rounded-full px-5 py-2 text-sm font-semibold transition text-slate-400 hover:text-white"
              >
                Cancellation Policy
              </Link>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="px-6 py-12 max-w-4xl mx-auto">
          {/* Quick Notice Card */}
          <div className="mb-10 rounded-2xl bg-amber-50 border border-amber-200/80 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl flex-shrink-0">
              <FaMountain />
            </div>
            <div className="text-sm text-amber-950 leading-relaxed">
              <span className="font-bold">Outdoor & Mountain Safety Acknowledgment: </span>
              Thikana connects travelers with private scenic land and outdoor campsites. Outdoor stays involve natural terrain, changing mountain weather, and remote locations. By booking, guests agree to take outdoor precautions and respect leave-no-trace nature etiquette.
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm text-slate-700 leading-relaxed space-y-10">
            {/* Section 1: Platform Role */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Platform's Role & Marketplace Model</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Thikana provides an online marketplace platform that enables registered plot owners and land hosts (&quot;Hosts&quot;) to showcase scenic outdoor plots, camp decks, orchards, and stargazing viewpoints, and enables registered travelers (&quot;Customers&quot; or &quot;Guests&quot;) to discover and reserve temporary access to those locations.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm space-y-2">
                <p>
                  <strong className="text-slate-900">Intermediary Status: </strong>
                  Thikana operates solely as a technology intermediary and booking facilitator. Thikana does not own, operate, manage, lease, or physically maintain the private plots listed on the platform.
                </p>
                <p>
                  When a reservation is confirmed, the legal contract for access, stay, and land usage is created directly between the Guest and the Host. Thikana is not a party to the rental agreement or license between Guests and Hosts.
                </p>
              </div>
            </div>

            {/* Section 2: Pay-After-Approval Booking Flow */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h2 className="text-2xl font-bold text-slate-900">The Booking Process (Pay-After-Approval)</h2>
              </div>
              <p className="text-slate-600 mb-4">
                To protect both travelers and landowners in remote destinations, Thikana enforces a transparent Pay-After-Approval reservation lifecycle:
              </p>
              <ol className="space-y-4 pl-2 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold items-center justify-center flex-shrink-0 mt-0.5">
                    A
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Step 1: Reservation Request (Pending Status)</strong>
                    The Customer selects a verified spot, specifies dates, time windows, guest count, and optional amenities (e.g., bonfire setup, camping tents, barbecue grill, stargazing telescope), and submits a request. <span className="text-emerald-700 font-semibold">No payment is charged at this stage.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold items-center justify-center flex-shrink-0 mt-0.5">
                    B
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Step 2: Host Review & Approval (Approved Status)</strong>
                    The plot Host evaluates the booking details, terrain accessibility, and group size. The Host may accept or reject the reservation. If approved, the reservation enters the <span className="font-semibold text-sky-700">&quot;Approved&quot;</span> state.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 rounded-full bg-emerald-600 text-white text-xs font-bold items-center justify-center flex-shrink-0 mt-0.5">
                    C
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Step 3: Payment & Instant Confirmation (Confirmed Status)</strong>
                    Once approved, the Customer receives notification and must complete payment via our integrated Razorpay checkout. Upon cryptographic signature verification, the spot is locked to prevent double-booking, and status updates to <span className="font-semibold text-emerald-700">&quot;Confirmed&quot;</span>.
                  </div>
                </li>
              </ol>
            </div>

            {/* Section 3: Host Obligations */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Plot Owner / Host Obligations</h2>
              </div>
              <p className="text-slate-600 mb-3">
                Hosts who list properties on Thikana warrant and agree to the following standards:
              </p>
              <ul className="space-y-2.5 pl-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Legal Right to Host:</strong> The Host possesses lawful ownership, leasehold title, or explicit authorization to permit guest entry onto the listed parcel.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Accurate Listing Details:</strong> Photos, boundary demarcations, road accessibility notes (e.g. 4x4 required, walking distance from parking), and amenity prices must reflect true ground conditions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Booking Commitment:</strong> Once a reservation is approved and paid, the Host must honor the reservation and provide timely arrival instructions. Unjustified cancellations by Hosts incur penalties or account de-listing.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Safety & Sanitation:</strong> Fire pits, camping decks, and basic sanitary amenities provided by the host must meet safe operational standards.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 4: Customer Obligations */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  4
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Customer & Guest Obligations</h2>
              </div>
              <p className="text-slate-600 mb-3">
                Guests booking plots agree to maintain the highest standards of outdoor responsibility:
              </p>
              <ul className="space-y-2.5 pl-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Leave-No-Trace Principles:</strong> Pack out all trash, food scraps, and plastic waste. Do not pollute nearby mountain streams or natural water sources.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Campfire & Wildfire Safety:</strong> Fires may only be ignited in host-designated stone pits or metal fire rings. Campfires must be completely extinguished with water before sleeping or vacating the plot.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Noise Limits & Curfews:</strong> Loud amplified music, car stereos, and disruptive noise are strictly prohibited after 10:00 PM to respect neighboring Himalayan villages and wildlife.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Payment Fulfillment:</strong> Once an owner approves a submitted booking, the customer agrees to finalize payment promptly or cancel before the slot expires to release the dates for other travelers.
                  </span>
                </li>
              </ul>
            </div>

            {/* Section 5: Prohibited Activities */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
                  5
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Prohibited Conduct</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Engaging in any of the following will result in immediate reservation cancellation without refund and account termination:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 flex items-start gap-2.5">
                  <FaBan className="text-red-500 mt-1 flex-shrink-0" />
                  <span><strong>Off-Platform Circumvention:</strong> Attempting to negotiate cash payments to bypass platform protections and fees.</span>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 flex items-start gap-2.5">
                  <FaBan className="text-red-500 mt-1 flex-shrink-0" />
                  <span><strong>Fraudulent Activity:</strong> Submitting fake photos, fictitious land parcels, stolen cards, or forged identity credentials.</span>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 flex items-start gap-2.5">
                  <FaBan className="text-red-500 mt-1 flex-shrink-0" />
                  <span><strong>Hazardous Conduct:</strong> Discharging firearms, fireworks, or hazardous fuels in fragile mountain forest zones.</span>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 flex items-start gap-2.5">
                  <FaBan className="text-red-500 mt-1 flex-shrink-0" />
                  <span><strong>Property Damage or Trespass:</strong> Crossing demarcated boundary stones onto neighboring agricultural orchards or reserve forest land.</span>
                </div>
              </div>
            </div>

            {/* Section 6: Limitation of Liability */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                  6
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Limitation of Liability & Outdoor Risk Assumption</h2>
              </div>
              <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 text-sm space-y-3 text-amber-950">
                <p className="font-bold">
                  Please read this section carefully, as it limits Thikana&apos;s legal liability regarding physical properties and mountain terrain.
                </p>
                <p>
                  <strong>Assumption of Outdoor Risk:</strong> You acknowledge that visiting outdoor plots, remote hill stations, high-altitude vantage points, and rural farmland carries inherent natural risks. These include, but are not limited to: uneven terrain, steep drop-offs, loose rock, weather variations (rain, cold waves, fog, landslides), insects, wildlife encounters, and variable cellular reception. You voluntarily assume full responsibility for all risks associated with your stay.
                </p>
                <p>
                  <strong>No Platform Liability for Physical Premises:</strong> Under no circumstances shall Thikana, its founders, officers, or affiliates be held liable for:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Any bodily injury, illness, allergic reaction, or death occurring on or en route to any listed plot.</li>
                  <li>Loss, theft, or damage to vehicles, camping equipment, or personal belongings.</li>
                  <li>Disputes, disagreements, or misconduct between Guests and Hosts.</li>
                  <li>Disruptions caused by acts of God, extreme mountain weather, road blockades, or government route advisories (Force Majeure).</li>
                </ul>
                <p className="text-xs text-amber-900 font-semibold pt-1">
                  To the maximum extent permitted by applicable law, Thikana&apos;s cumulative liability to any user for any claim arising from a booking shall not exceed the total platform fee received by Thikana for that specific booking.
                </p>
              </div>
            </div>

            {/* Section 7: Account Suspension & Termination */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  7
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Account Suspension & Termination</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Thikana reserves the right, at its sole discretion, to temporarily restrict, suspend, or permanently terminate any user account (Host or Customer) without prior notice if we identify violations of these Terms, non-payment, fraudulent booking attempts, verified physical property damage reports, or abusive behavior towards hosts, guests, or staff.
              </p>
            </div>

            {/* Section 8: Governing Law */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  8
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Governing Law & Dispute Resolution</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, action, or proceeding arising out of or related to these Terms or platform usage shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
            </div>

            {/* Contact Box */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Questions Regarding Our Terms?</h3>
              <p className="text-slate-600 text-sm mb-5">
                Our support team is available to assist you with clarifications regarding host onboarding, guest responsibilities, or reservation policies.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="mailto:support@thikana.com"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                    <FaEnvelope />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Email Support</span>
                    <span className="text-sm font-bold text-slate-800">support@thikana.com</span>
                  </div>
                </a>

                <a
                  href="tel:+918278819226"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50/50 transition group"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Concierge Hotline</span>
                    <span className="text-sm font-bold text-slate-800">+91 82788 19226</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
