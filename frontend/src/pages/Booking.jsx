import { useState } from "react";
import axios from "axios";

function Booking() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    plot: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/booking",
        formData
      );

      alert(response.data.message);

      setFormData({
        name: "",
        email: "",
        plot: "",
      });
    } catch (error) {
      console.log(error);
      alert("Booking Failed");
    }
  };

  return (
   <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-20">
      
      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden grid md:grid-cols-2 max-w-5xl w-full">
        
        {/* Left Side */}
        <div className="bg-black text-white p-12 flex flex-col justify-center">
          
          <h1 className="text-5xl font-bold leading-tight">
            Book Your Dream Plot
          </h1>

          <p className="mt-6 text-gray-300 text-lg">
            Secure your future with verified residential,
            commercial, and farmland properties.
          </p>

          <div className="mt-10 space-y-4">
            <p>✅ Trusted Listings</p>
            <p>✅ Easy Booking Process</p>
            <p>✅ Affordable Prices</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-12">
          
          <h2 className="text-3xl font-bold mb-8">
            Booking Form
          </h2>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            
            <input
              type="text"
              name="name"
              placeholder="Enter Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <input
              type="text"
              name="plot"
              placeholder="Enter Plot Name"
              value={formData.plot}
              onChange={handleChange}
              required
              className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <button
              type="submit"
              className="bg-green-400 text-black py-3 rounded-xl font-bold hover:bg-green-300 transition"
            >
              Book Now
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;
{/* Footer */}
<footer className="bg-black text-white py-10 px-6 mt-16 w-full absolute bottom-0 left-0">
  <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

    {/* Brand */}
    <div>
      <h2 className="text-2xl font-bold text-green-400">
        PlotBooking
      </h2>

      <p className="mt-4 text-gray-400">
        Your trusted platform for booking residential,
        commercial, and farmland plots securely.
      </p>
    </div>

    {/* Quick Links */}
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Quick Links
      </h3>

      <ul className="space-y-2 text-gray-400">
        <li>Home</li>
        <li>Plots</li>
        <li>Booking</li>
        <li>Contact</li>
      </ul>
    </div>

    {/* Contact */}
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Contact
      </h3>

      <p className="text-gray-400">
        📍 India
      </p>

      <p className="text-gray-400 mt-2">
        📧 support@plotbooking.com
      </p>

      <p className="text-gray-400 mt-2">
        📞 +91 9876543210
      </p>
    </div>

  </div>

  <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500">
    © 2026 PlotBooking. All rights reserved.
  </div>
</footer>