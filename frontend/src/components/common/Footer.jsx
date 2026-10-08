import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

function Footer() {
  const location = useLocation();

  // Smooth scroll handler for in-page anchors and top scrolling
  const handleScrollLink = (e, targetPath, hashId) => {
    const isCurrentPage =
      location.pathname === targetPath ||
      (targetPath === "/" && location.pathname === "/") ||
      (targetPath === "/contact" && location.pathname === "/contact");

    if (isCurrentPage) {
      if (hashId) {
        e.preventDefault();
        const element = document.getElementById(hashId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState(null, "", `#${hashId}`);
        }
      } else {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", targetPath);
      }
    }
  };

  return (
    <footer className="bg-slate-950 px-6 pt-16 pb-12 text-slate-300 border-t border-slate-900">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column */}
        <div>
          <Link
            to="/"
            onClick={(e) => handleScrollLink(e, "/", null)}
            className="inline-block transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label="Thikana Home"
          >
            <img src="/logo-full.svg" alt="Thikana" className="h-10 sm:h-11 w-auto object-contain" />
          </Link>
          <p className="mt-5 text-sm leading-7 text-slate-400 max-w-sm">
            Discover scenic stays, book unforgettable nature escapes, and travel with confidence across the Himalayas.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Verified Scenic Plots</span>
            <span>•</span>
            <span>Himachal, Uttarakhand & J&K</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-white">Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                to="/"
                onClick={(e) => handleScrollLink(e, "/", null)}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/listings"
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Explore Stays
              </Link>
            </li>
            <li>
              <Link
                to="/become-a-host"
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Become a Host
              </Link>
            </li>
            <li>
              <Link
                to="/#about"
                onClick={(e) => handleScrollLink(e, "/", "about")}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                About Thikana
              </Link>
            </li>
            <li>
              <Link
                to="/#how-it-works"
                onClick={(e) => handleScrollLink(e, "/", "how-it-works")}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                How It Works
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Contact Concierge
              </Link>
            </li>
          </ul>
        </div>

        {/* Support Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-white">Support</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                to="/contact#customer-care"
                onClick={(e) => handleScrollLink(e, "/contact", "customer-care")}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                24/7 Customer Care
              </Link>
            </li>
            <li>
              <Link
                to="/cancellation-policy"
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Flexible Cancellations
              </Link>
            </li>
            <li>
              <Link
                to="/contact#assistance"
                onClick={(e) => handleScrollLink(e, "/contact", "assistance")}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Travel Assistance
              </Link>
            </li>
            <li>
              <Link
                to="/contact#support"
                onClick={(e) => handleScrollLink(e, "/contact", "support")}
                className="text-slate-400 hover:text-emerald-400 transition inline-block"
              >
                Send Support Message
              </Link>
            </li>
          </ul>
        </div>

        {/* Follow Us Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-white">Follow Us</h3>
          <div className="mt-4 flex gap-3 text-lg">
            <a
              href="https://facebook.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-emerald-600 hover:text-white transition shadow-sm border border-slate-800"
            >
              <FaFacebook />
            </a>
            <a
              href="https://instagram.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-emerald-600 hover:text-white transition shadow-sm border border-slate-800"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-emerald-600 hover:text-white transition shadow-sm border border-slate-800"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com/company/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 hover:bg-emerald-600 hover:text-white transition shadow-sm border border-slate-800"
            >
              <FaLinkedin />
            </a>
          </div>

          <div className="mt-6 space-y-2">
            <a
              href="mailto:support@thikana.com"
              className="flex items-center gap-2.5 text-sm font-medium text-slate-300 hover:text-emerald-400 transition"
            >
              <FaEnvelope className="text-emerald-500 text-xs flex-shrink-0" />
              <span>support@thikana.com</span>
            </a>
            <a
              href="tel:+918278819226"
              className="flex items-center gap-2.5 text-sm font-medium text-slate-300 hover:text-emerald-400 transition"
            >
              <FaPhoneAlt className="text-emerald-500 text-xs flex-shrink-0" />
              <span>+91 82788 19226</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Copyright & Legal Links */}
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-slate-900 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Thikana. All rights reserved.</p>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <Link to="/privacy-policy" className="hover:text-emerald-400 transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms-of-service" className="hover:text-emerald-400 transition">
            Terms of Service
          </Link>
          <span>•</span>
          <Link to="/cancellation-policy" className="hover:text-emerald-400 transition">
            Cancellation Policy
          </Link>
        </div>

        <p className="text-slate-500 flex items-center gap-1">
          Crafted for scenic stays and unforgettable escapes.
        </p>
      </div>
    </footer>
  );
}

export default Footer;