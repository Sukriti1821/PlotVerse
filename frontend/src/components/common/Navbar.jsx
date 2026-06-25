import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo */}
        <h1 className="text-2xl font-bold text-green-400">
          PlotBooking
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-lg">
          <Link to="/" className="hover:text-green-400 transition">
            Home
          </Link>

          <Link to="/plots" className="hover:text-green-400 transition">
            Plots
          </Link>

          <Link to="/booking" className="hover:text-green-400 transition">
            Booking
          </Link>

          <Link to="/contact" className="hover:text-green-400 transition">
            Contact
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col bg-gray-900 px-6 py-4 gap-4 text-lg">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="hover:text-green-400"
          >
            Home
          </Link>

          <Link
            to="/plots"
            onClick={() => setMenuOpen(false)}
            className="hover:text-green-400"
          >
            Plots
          </Link>

          <Link
            to="/booking"
            onClick={() => setMenuOpen(false)}
            className="hover:text-green-400"
          >
            Booking
          </Link>

          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="hover:text-green-400"
          >
            Contact
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;