import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaCreditCard,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Last updated: September 2026 • Transparent disclosures on how your data is collected, protected, and used across the Thikana mountain stay network.
            </p>

            {/* Legal Navigation Tabs */}
            <div className="mt-8 inline-flex flex-wrap justify-center rounded-full bg-slate-900 p-1.5 border border-slate-800 gap-1">
              <Link
                to="/privacy-policy"
                className="rounded-full px-5 py-2 text-sm font-semibold transition bg-emerald-600 text-white shadow"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="rounded-full px-5 py-2 text-sm font-semibold transition text-slate-400 hover:text-white"
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
          <div className="mb-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl flex-shrink-0">
              <FaShieldAlt />
            </div>
            <div className="text-sm text-emerald-950 leading-relaxed">
              <span className="font-bold">Our Core Privacy Commitment: </span>
              Thikana is committed to protecting your personal privacy. We never sell your personal data to third-party advertisers, and we never store your payment card numbers or banking passwords on our servers.
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm text-slate-700 leading-relaxed space-y-10">
            {/* Section 1 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Information We Collect</h2>
              </div>
              <p className="text-slate-600 mb-4">
                To facilitate verified scenic land reservations, host communication, and safe stays across Himalayan destinations, Thikana collects the following categories of information:
              </p>
              <ul className="space-y-3 pl-2">
                <li className="flex items-start gap-2.5 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Account Credentials:</strong> Full name, verified email address, phone number, and an encrypted password hash (salted using industry-standard bcrypt hashing; plain-text passwords are never accessible or stored).
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Booking & Reservation Data:</strong> Spot selections, check-in and check-out dates and times, guest headcount, optional food and beverage orders, custom requests submitted to plot hosts, and booking status histories (pending, approved, confirmed, cancelled).
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Host & Spot Listing Details:</strong> For users registering as Plot Owners/Hosts, we collect plot titles, descriptions, address details, GPS coordinates, amenity pricing, and uploaded spot photographs.
                  </span>
                </li>
                <li className="flex items-start gap-2.5 text-sm">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Technical & Device Metadata:</strong> IP address, device type, browser specifications, and server access timestamps used strictly for platform security, fraud prevention, and network diagnostics.
                  </span>
                </li>
              </ul>

              {/* Payment Clarification Callout */}
              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
                <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm mb-2">
                  <FaCreditCard className="text-lg" />
                  <span>Important Notice on Payment Information</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Thikana <strong className="text-white">DOES NOT</strong> directly store, process, or have access to your sensitive financial data such as credit/debit card numbers, CVVs, expiry dates, net banking passwords, or UPI PINs. All payments are tokenized and processed through our RBI-authorized payment partner, <strong className="text-emerald-300">Razorpay Software Private Limited</strong>. Thikana only retains non-sensitive transaction identifiers (Razorpay Order ID, Payment ID, amount, and payment timestamp) to confirm reservations and issue receipts.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h2 className="text-2xl font-bold text-slate-900">How We Use Your Data</h2>
              </div>
              <p className="text-slate-600 mb-4">
                We process your personal information only for legitimate business and operational purposes:
              </p>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <strong className="text-slate-900 block mb-1">Reservation Execution</strong>
                  Transmitting reservation requests to plot hosts under our Pay-After-Approval model and confirming reservations upon successful payment.
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <strong className="text-slate-900 block mb-1">Payment Verification</strong>
                  Validating cryptographic payment signatures received from Razorpay to activate confirmed bookings and prevent double-booking conflicts.
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <strong className="text-slate-900 block mb-1">Transactional Communication</strong>
                  Sending booking status updates, host approval notices, payment receipts, check-in directions, and account password reset links.
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <strong className="text-slate-900 block mb-1">Guest Safety & Support</strong>
                  Providing route guidance, mountain weather advisories, and 24/7 concierge assistance during your Himalayan trip.
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Third-Party Service Providers</h2>
              </div>
              <p className="text-slate-600 mb-4">
                To maintain a modern, reliable platform, we share limited necessary information with trusted third-party service providers bound by strict confidentiality:
              </p>
              <ul className="space-y-3 pl-2 text-sm">
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Razorpay Software Private Limited:</strong> For secure payment gateway checkout, order creation, transaction verification, and manual refund execution.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Cloud Media Storage:</strong> Secure cloud infrastructure (such as Cloudinary or high-availability object storage) used to deliver high-resolution plot images.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Transactional Email & SMS Gateways:</strong> Services utilized solely to dispatch reservation notices, OTP verification, and customer service replies.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-800">Assigned Hosts & Guests:</strong> When a reservation is approved and paid, check-in contact information (guest name, contact number, arrival time) is exchanged with the host solely for on-site arrival coordination.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-xs text-slate-500 italic">
                We will never sell, lease, or monetize your contact or booking information to marketing networks or data brokers.
              </p>
            </div>

            {/* Section 4 */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  4
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Cookies & Local Storage</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Thikana keeps client tracking minimal and transparent:
              </p>
              <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/60 text-sm space-y-3">
                <p>
                  <strong className="text-slate-800">Browser Local Storage (localStorage):</strong> We use browser localStorage solely to preserve your active session. When you log in, your JSON Web Token (JWT) and basic session metadata (user name, email, role) are stored locally on your device to keep you authenticated as you browse.
                </p>
                <p>
                  <strong className="text-slate-800">No Advertising Trackers:</strong> We do not inject behavioral advertising cookies, Facebook Pixel, or cross-platform tracking pixels to profile your web activity outside of Thikana.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  5
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Data Retention & Deletion Requests</h2>
              </div>
              <p className="text-slate-600 mb-4">
                We retain user account data for as long as your account remains active. Completed transaction records and booking invoices are preserved in compliance with applicable Indian tax and financial auditing mandates.
              </p>
              <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-5 text-sm">
                <h4 className="font-bold text-emerald-950 mb-2">How to Request Account or Data Deletion</h4>
                <p className="text-emerald-900 leading-relaxed mb-3">
                  You have the right to request the permanent deletion of your Thikana account and associated personal data. To initiate deletion:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-emerald-950">
                  <li>Send an email from your registered email address to <strong className="text-emerald-700">support@thikana.com</strong>.</li>
                  <li>Use the subject line: <code className="bg-white/80 px-2 py-0.5 rounded border border-emerald-300 text-emerald-900 font-mono text-xs">Data Deletion Request - [Your Name]</code>.</li>
                  <li>Our compliance team will verify your identity, ensure all pending reservations and transactions are completed or resolved, and permanently anonymize or purge your account data within 30 days.</li>
                </ol>
              </div>
            </div>

            {/* Section 6 */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  6
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Contact & Privacy Grievances</h2>
              </div>
              <p className="text-slate-600 mb-6">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our dedicated support team:
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
                    <span className="text-xs text-slate-400 block font-medium">Privacy Desk Email</span>
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
                    <span className="text-xs text-slate-400 block font-medium">Phone Support</span>
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
