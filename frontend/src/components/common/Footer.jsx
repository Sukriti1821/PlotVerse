import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-black text-white py-14 px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <h1 className="text-3xl font-bold text-green-400">
            PlotBooking
          </h1>

          <p className="mt-4 text-gray-400">
            Your trusted platform for booking premium
            residential and commercial plots securely.
          </p>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Quick Links
          </h2>

          <ul className="space-y-3 text-gray-400">
            <li className="hover:text-green-400 cursor-pointer">
              Home
            </li>

            <li className="hover:text-green-400 cursor-pointer">
              Plots
            </li>

            <li className="hover:text-green-400 cursor-pointer">
              Booking
            </li>

            <li className="hover:text-green-400 cursor-pointer">
              Contact
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Contact
          </h2>

          <div className="space-y-3 text-gray-400">
            <p>📍 India</p>
            <p>📧 support@plotbooking.com</p>
            <p>📞 +91 9876543210</p>
          </div>
        </div>

        {/* Socials */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Follow Us
          </h2>

          <div className="flex gap-5 text-2xl">

            <FaFacebook className="hover:text-green-400 cursor-pointer transition" />

            <FaInstagram className="hover:text-green-400 cursor-pointer transition" />

            <FaTwitter className="hover:text-green-400 cursor-pointer transition" />

            <FaLinkedin className="hover:text-green-400 cursor-pointer transition" />

          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-500">
        © 2026 PlotBooking. All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;