import { useState } from "react";
import { toast } from "react-toastify";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaHeadset,
  FaCompass,
  FaCheckCircle,
  FaPaperPlane,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Thank you! Your message has been sent to our 24/7 support team.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pb-20">
        {/* Hero Header */}
        <section className="relative bg-slate-950 px-6 py-20 text-white lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-emerald-950/40 to-slate-950 pointer-events-none" />
          <div className="relative mx-auto max-w-5xl text-center">
            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300 backdrop-blur">
              Support & Inquiries
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              We’re Here for Your Journey
            </h1>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Have questions about booking a scenic plot, hosting your land, or need on-the-road travel assistance? Our team is available 24/7.
            </p>
          </div>
        </section>

        {/* 3 Core Support Pillars */}
        <section className="px-6 -mt-10 lg:px-8">
          <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-3">
            {/* 24/7 Customer Care */}
            <div
              id="customer-care"
              className="scroll-mt-24 rounded-3xl bg-white p-8 shadow-xl border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-600 mb-6">
                  <FaHeadset />
                </div>
                <h2 className="text-xl font-bold text-slate-900">24/7 Customer Care</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Real-time assistance for ongoing bookings, check-in instructions, and payment inquiries.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <a
                  href="tel:+918278819226"
                  className="flex items-center gap-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition"
                >
                  <FaPhoneAlt className="text-xs" /> +91 82788 19226
                </a>
                <a
                  href="mailto:support@thikana.com"
                  className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
                >
                  <FaEnvelope className="text-xs" /> support@thikana.com
                </a>
              </div>
            </div>

            {/* Travel Assistance */}
            <div
              id="assistance"
              className="scroll-mt-24 rounded-3xl bg-white p-8 shadow-xl border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-2xl text-sky-600 mb-6">
                  <FaCompass />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Travel Assistance</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Scenic route navigation, weather alerts for mountain terrain, and local plot coordinator contacts.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <FaClock className="text-xs text-sky-500" /> Active 24/7 On-Trip Support
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <FaMapMarkerAlt className="text-xs text-sky-500" /> Himachal, Uttarakhand & Jammu
                </div>
              </div>
            </div>

            {/* Host Partner Support */}
            <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-2xl text-teal-600 mb-6">
                  <FaCheckCircle />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Host Relations</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Support for landowners, listing approvals, payout schedules, and plot safety guidelines.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <a
                  href="mailto:hosts@thikana.com"
                  className="flex items-center gap-3 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
                >
                  <FaEnvelope className="text-xs" /> hosts@thikana.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Office Info */}
        <section id="support" className="scroll-mt-24 px-6 pt-20 lg:px-8">
          <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-12 items-start">
            {/* Left: Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Get in touch</span>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Send Us a Direct Message</h2>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  Fill out the form and our concierge team will respond within 2 hours. For emergency trip guidance, please call our 24/7 care hotline.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Mountain HQ</h4>
                    <p className="text-sm text-slate-500">The Mall Road, Old Manali, Himachal Pradesh 175131, India</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Support Inbox</h4>
                    <p className="text-sm text-slate-500">support@thikana.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl mb-4">
                    <FaCheckCircle />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Delivered!</h3>
                  <p className="mt-2 text-slate-600 max-w-md mx-auto text-sm">
                    Thank you for reaching out. One of our support guides will reply to <strong>{formData.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
                    }}
                    className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sukriti Sharma"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Topic / Department
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Booking Help">Reservation & Booking Help</option>
                      <option value="Host Inquiry">Landowner & Host Inquiries</option>
                      <option value="Travel Assistance">Roadside & Travel Assistance</option>
                      <option value="Cancellations & Refunds">Cancellations & Refunds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we assist your scenic plot journey?"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-[0.99] transition cursor-pointer"
                  >
                    {submitting ? (
                      <span>Sending Message...</span>
                    ) : (
                      <>
                        <FaPaperPlane size={14} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}