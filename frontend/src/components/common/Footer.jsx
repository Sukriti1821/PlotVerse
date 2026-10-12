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
    <footer className="bg-navy-deep px-6 pt-16 pb-12 text-light-slate border-t border-white/10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column */}
        <div>
          <Link
            to="/"
            onClick={(e) => handleScrollLink(e, "/", null)}
            className="inline-block transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label="Thikana Home"
          >
            <img
              src="/logo-white.svg"
              alt="Thikana - Your Place. Your Escape."
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </Link>
          <p className="mt-5 text-sm leading-7 text-light-slate max-w-sm">
            Discover scenic stays, book unforgettable nature escapes, and travel with confidence across the Himalayas.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-light-slate/80 font-medium">
            <span>Verified Scenic Plots</span>
            <span>•</span>
            <span>Himachal, Uttarakhand & J&K</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-snow">Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                to="/"
                onClick={(e) => handleScrollLink(e, "/", null)}
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/listings"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Explore Stays
              </Link>
            </li>
            <li>
              <Link
                to="/experiences"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Curated Experiences
              </Link>
            </li>
            <li>
              <Link
                to="/become-a-host"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Become a Host
              </Link>
            </li>
            <li>
              <Link
                to="/corporate"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Corporate Retreats
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Contact Concierge
              </Link>
            </li>
          </ul>
        </div>

        {/* Support & Legal Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-snow">Support & Trust</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link
                to="/contact"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                24/7 Customer Care
              </Link>
            </li>
            <li>
              <Link
                to="/refund-policy"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Refund Policy
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-light-slate hover:text-saffron transition inline-block"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>

        {/* Follow Us Column */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wider text-snow">Connect</h3>
          <div className="mt-4 flex gap-3 text-lg">
            <a
              href="https://facebook.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusk text-light-slate hover:bg-saffron hover:text-navy transition shadow-sm border border-white/10"
            >
              <FaFacebook />
            </a>
            <a
              href="https://instagram.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusk text-light-slate hover:bg-saffron hover:text-navy transition shadow-sm border border-white/10"
            >
              <FaInstagram />
            </a>
            <a
              href="https://x.com/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusk text-light-slate hover:bg-saffron hover:text-navy transition shadow-sm border border-white/10"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com/company/thikana"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-dusk text-light-slate hover:bg-saffron hover:text-navy transition shadow-sm border border-white/10"
            >
              <FaLinkedin />
            </a>
          </div>

          <div className="mt-6 space-y-2">
            <a
              href="mailto:support@thikana.com"
              className="flex items-center gap-2.5 text-sm font-medium text-light-slate hover:text-saffron transition"
            >
              <FaEnvelope className="text-saffron text-xs flex-shrink-0" />
              <span>support@thikana.com</span>
            </a>
            <a
              href="tel:+918278819226"
              className="flex items-center gap-2.5 text-sm font-medium text-light-slate hover:text-saffron transition"
            >
              <FaPhoneAlt className="text-saffron text-xs flex-shrink-0" />
              <span>+91 82788 19226</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar with Copyright & Legal Links */}
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-8 text-xs text-light-slate/80 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Thikana. All rights reserved.</p>

        <div className="flex flex-wrap items-center gap-4 text-light-slate">
          <Link to="/privacy" className="hover:text-saffron transition">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-saffron transition">
            Terms of Service
          </Link>
          <span>•</span>
          <Link to="/refund-policy" className="hover:text-saffron transition">
            Refund Policy
          </Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-saffron transition">
            Contact
          </Link>
        </div>

        <p className="text-light-slate/70 flex items-center gap-1">
          Crafted for scenic stays and unforgettable mountain escapes.
        </p>
      </div>
    </footer>
  );
}

export default Footer;