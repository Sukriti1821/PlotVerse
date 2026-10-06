import { Link } from "react-router-dom";
import {
  FaUndo,
  FaCloudSunRain,
  FaClock,
  FaCheckCircle,
  FaCreditCard,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function CancellationPolicy() {
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
              Cancellation & Refund Policy
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
              Last updated: September 2026 • Clear, fair, and transparent cancellation guidelines tailored for outdoor escapes and mountain plot reservations.
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
                className="rounded-full px-5 py-2 text-sm font-semibold transition text-slate-400 hover:text-white"
              >
                Terms of Service
              </Link>
              <Link
                to="/cancellation-policy"
                className="rounded-full px-5 py-2 text-sm font-semibold transition bg-emerald-600 text-white shadow"
              >
                Cancellation Policy
              </Link>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="px-6 py-12 max-w-5xl mx-auto space-y-10">
          {/* Policy Pillars */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-xl mb-4">
                <FaUndo />
              </div>
              <h3 className="font-bold text-lg text-slate-900">100% Free Pre-Approval</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Zero charges while your booking request is pending host review or awaiting payment. Cancel anytime with no fee.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/15 text-sky-600 flex items-center justify-center text-xl mb-4">
                <FaClock />
              </div>
              <h3 className="font-bold text-lg text-slate-900">48-Hour Full Refund</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Receive a full 100% refund of your confirmed booking when cancelling at least 48 hours prior to your scheduled check-in.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 border border-slate-200 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center text-xl mb-4">
                <FaCloudSunRain />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Himalayan Weather Shield</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                If verified landslides or government severe weather warnings block plot access, reschedule for free or receive a full refund review.
              </p>
            </div>
          </div>

          {/* Detailed Policy Card */}
          <div className="rounded-3xl bg-white p-8 sm:p-12 border border-slate-200 shadow-sm text-slate-700 leading-relaxed space-y-10">
            {/* Section 1: Pre-payment cancellation */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Cancellation Before Payment (Pending or Approved)</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Thikana operates on a transparent <strong>Pay-After-Approval</strong> model. When you request a plot, your booking starts in <span className="font-semibold text-amber-600">&quot;Pending&quot;</span> review. Once the host approves, the status becomes <span className="font-semibold text-sky-600">&quot;Approved&quot;</span> awaiting your payment checkout.
              </p>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950 flex items-start gap-3">
                <FaCheckCircle className="text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <strong>Zero Financial Obligation: </strong>
                  If you cancel your booking while it is in &quot;Pending&quot; or &quot;Approved&quot; status (before initiating payment), you will never be charged. The reservation request will simply be closed immediately.
                </div>
              </div>
            </div>

            {/* Section 2: Post-payment Timeline Breakdown */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Customer Cancellation After Payment (Confirmed)</h2>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Once payment has been completed via Razorpay and your booking is &quot;Confirmed&quot;, refunds are calculated based on how far in advance of your check-in time you submit the cancellation:
              </p>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/80 text-xs uppercase tracking-wider text-slate-700 font-bold">
                    <tr>
                      <th className="px-5 py-4">Cancellation Window</th>
                      <th className="px-5 py-4">Refund Amount</th>
                      <th className="px-5 py-4">Terms & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        48+ Hours Prior to Check-in
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                          100% Full Refund
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        Full 100% refund of the total booking amount paid (plot reservation + all optional amenities).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        24 to 48 Hours Prior to Check-in
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                          50% Partial Refund
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        50% refund of base plot fee, plus 100% refund of any unused addon amenities (bonfire, tent setups, etc.). The remaining 50% base fee compensates the host for holding the spot.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        Less Than 24 Hours or No-Show
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                          Non-Refundable
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        No refund. The host has already blocked the calendar, prepped the land, and cannot re-book on short notice.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Owner-initiated cancellations */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Owner-Initiated Cancellations (Host Cancellation)</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Plot hosts are expected to honor every confirmed booking. If a host must cancel a confirmed reservation due to emergency or property unavailability:
              </p>
              <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-950 space-y-2">
                <p>
                  <strong className="text-sky-900">Mandatory 100% Full Refund: </strong>
                  The customer will receive an immediate full 100% refund of all amounts paid, including taxes and amenity fees.
                </p>
                <p className="text-xs text-sky-800">
                  Our concierge team will also assist you in finding an equivalent alternate scenic plot nearby. Hosts who cancel confirmed bookings without verified force majeure cause will face listing de-ranking or platform penalties.
                </p>
              </div>
            </div>

            {/* Section 4: Refund Processing & Turnaround (Honest Disclosure) */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  4
                </div>
                <h2 className="text-2xl font-bold text-slate-900">How Refunds Are Processed & Timelines</h2>
              </div>
              <div className="rounded-2xl bg-slate-900 p-6 text-white text-sm space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 font-bold text-base">
                  <FaCreditCard className="text-xl" />
                  <span>Processing Method & Verification</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  In our current production phase, all cancellation refund requests are verified by our support team and initiated through our <strong className="text-white">Razorpay Merchant Gateway</strong> within <strong className="text-emerald-300">5 to 7 business days</strong> of approval.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                    <strong className="text-white block mb-1">Original Payment Method</strong>
                    Refunds are routed back directly to your original source (UPI VPA, Debit/Credit Card, or Net Banking).
                  </div>
                  <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700">
                    <strong className="text-white block mb-1">Bank Clearing Windows</strong>
                    Depending on your issuing bank or UPI app, funds usually reflect within 2 to 5 banking days after Razorpay initiates the transfer.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Himalayan Weather & Landslide Exception */}
            <div className="border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                  5
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Severe Mountain Weather & Force Majeure</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Mountain safety is our top priority. We recognize that high-altitude travel in Himachal, Uttarakhand, and Jammu & Kashmir can be affected by unpredictable mountain phenomena:
              </p>
              <ul className="space-y-2 pl-2 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    If official government authorities issue road closures, red-alert cloudburst warnings, or active landslide blocks preventing safe transit to your reserved spot, standard cancellation penalties are waived.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <FaCheckCircle className="text-emerald-500 mt-1 flex-shrink-0" />
                  <span>
                    You may choose to <strong>reschedule your booking dates for free</strong> within a 6-month validity period or request an expedited 100% full refund review.
                  </span>
                </li>
              </ul>
            </div>

            {/* How to cancel CTA */}
            <div className="border-t border-slate-100 pt-8">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">Need to Cancel or Reschedule?</h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    You can manage reservations directly from your <Link to="/my-bookings" className="underline font-semibold hover:text-emerald-900">My Bookings</Link> dashboard or reach our 24/7 concierge.
                  </p>
                </div>
                <Link
                  to="/contact#customer-care"
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition whitespace-nowrap"
                >
                  Contact Concierge
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
