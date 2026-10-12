import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCompass, FaHome, FaMapMarkedAlt, FaLifeRing } from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-navy text-snow">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-saffron/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-dusk/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-dusk/80 border border-white/10 text-saffron text-4xl mb-8 shadow-2xl backdrop-blur-xl"
          >
            <FaCompass className="animate-spin-slow" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-saffron/15 border border-saffron/30 text-saffron text-xs font-bold tracking-widest uppercase mb-4">
              Error 404 • Destination Not Found
            </span>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-snow mb-4">
              Lost in the Mountains?
            </h1>

            <p className="text-light-slate text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
              The scenic plot, trail, or page you are looking for doesn't exist, has been moved, or is temporarily resting under mountain snow.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-saffron hover:bg-saffron-hover px-8 py-3.5 text-sm font-bold text-navy transition-all duration-200 shadow-lg active:scale-95"
              >
                <FaHome size={16} /> Return to Home
              </Link>

              <Link
                to="/listings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-dusk hover:bg-white/10 border border-white/20 px-8 py-3.5 text-sm font-bold text-snow transition-all duration-200 shadow-md active:scale-95"
              >
                <FaMapMarkedAlt size={16} /> Browse Destinations
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-light-slate">
              <FaLifeRing className="text-saffron" />
              <span>Need help finding your retreat?</span>
              <Link to="/contact" className="text-saffron hover:underline font-semibold ml-1">
                Contact Concierge
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
