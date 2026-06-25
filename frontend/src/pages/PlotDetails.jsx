import { useState } from "react";
import { motion } from "framer-motion";
import { FaMapMarkerAlt, FaRulerCombined, FaPhone, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const PlotDetails = () => {
  // Dummy plot data
  const plot = {
    id: 1,
    title: "Green Valley Premium Plot",
    location: "Delhi, India",
    area: "1200 sq.ft",
    price: "₹15,00,000",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop",
    description:
      "A stunning residential plot in the heart of Delhi with excellent connectivity to metro stations and shopping centers. This prime property offers a peaceful neighborhood with modern amenities and lush green surroundings. Perfect for building your dream home.",
    features: [
      "24/7 Security",
      "Paved Roads",
      "Electricity Connection",
      "Water Supply",
      "Green Spaces",
      "Community Hall",
    ],
    amenities: [
      { title: "Park Nearby", description: "500m away" },
      { title: "School", description: "1km away" },
      { title: "Hospital", description: "2km away" },
      { title: "Shopping Mall", description: "1.5km away" },
    ],
  };

  const [bookingModal, setBookingModal] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-md py-4 px-6 sticky top-0 z-10"
      >
        <Link
          to="/listings"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
        >
          <FaArrowLeft size={18} />
          Back to Listings
        </Link>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 py-12"
      >
        {/* Hero Image Section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={plot.image}
              alt={plot.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end">
              <div className="text-white p-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  {plot.title}
                </h1>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Key Info Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-4"
            >
              {/* Location Card */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaMapMarkerAlt className="text-green-600" size={24} />
                  <span className="text-gray-600 font-semibold text-sm">
                    LOCATION
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {plot.location}
                </p>
              </div>

              {/* Area Card */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <FaRulerCombined className="text-blue-600" size={24} />
                  <span className="text-gray-600 font-semibold text-sm">
                    AREA
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-800">{plot.area}</p>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-md text-white">
                <span className="font-semibold text-sm block mb-2">PRICE</span>
                <p className="text-lg font-bold">{plot.price}</p>
              </div>
            </motion.div>

            {/* Description Section */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                About this Plot
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {plot.description}
              </p>
            </motion.div>

            {/* Features Grid */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Key Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {plot.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 hover:border-green-400 transition-colors"
                  >
                    <p className="text-gray-800 font-semibold text-center">
                      {feature}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Amenities Section */}
            <motion.div variants={itemVariants} className="bg-white p-8 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Nearby Amenities
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {plot.amenities.map((amenity, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">
                        {amenity.title}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {amenity.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Booking Card */}
          <motion.div variants={itemVariants}>
            <div className="bg-white p-8 rounded-xl shadow-lg sticky top-24">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">TOTAL PRICE</p>
                <p className="text-4xl font-bold text-green-600 mb-4">
                  {plot.price}
                </p>
                <p className="text-gray-600 text-sm">
                  Ready to move property with all amenities
                </p>
              </div>

              {/* Book Now Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBookingModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg mb-4"
              >
                Book Now
              </motion.button>

              {/* Contact Section */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-800 font-bold mb-4">
                  Need more information?
                </p>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold">
                    <FaPhone size={18} />
                    Call Agent
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                    <FaEnvelope size={18} />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Booking Modal */}
      {bookingModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setBookingModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Schedule a Visit
            </h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
              <input
                type="tel"
                placeholder="Your Phone"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                Schedule Visit
              </button>
            </form>
            <button
              onClick={() => setBookingModal(false)}
              className="mt-4 w-full text-gray-600 hover:text-gray-800 font-semibold"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PlotDetails;
