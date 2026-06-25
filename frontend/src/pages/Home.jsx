import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaMapMarkedAlt,
  FaShieldAlt,
  FaHome,
} from "react-icons/fa";
import ListingCard from "../components/cards/ListingCard";
function Home() {
 const featuredPlots = [
  {
    id: 1,
    title: "Green Valley Plot",
    location: "Delhi",
    price: "₹15,00,000",
    area: "1200 sq.ft"
  },
  {
    id: 2,
    title: "Sunrise Residency",
    location: "Kolkata",
    price: "₹12,50,000",
    area: "1000 sq.ft"
  },
  {
    id: 3,
    title: "Lake View Estate",
    location: "Bangalore",
    price: "₹20,00,000",
    area: "1500 sq.ft"
  }
];
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Hero Section */}
      <section className="bg-black text-white py-24 px-6 overflow-hidden">

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">

          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Find Your Dream
              <span className="text-green-400"> Plot </span>
              With Confidence
            </h1>

            <p className="mt-6 text-lg text-gray-300">
              Buy verified residential, commercial,
              and farmland properties with a seamless
              booking experience.
            </p>

            <Link
              to="/listings"
              className="mt-8 inline-block bg-green-400 text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 hover:bg-green-300 transition duration-300"
            >
              Explore Plots
            </Link>
          </motion.div>

          {/* Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >

            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
              alt="plot"
              className="rounded-3xl shadow-2xl hover:scale-105 transition duration-500"
            />
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">

        <div className="max-w-6xl mx-auto">

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16"
          >
            Why Choose Us?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-10">

            {/* Card 1 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-10 rounded-3xl shadow-lg"
            >
              <FaShieldAlt className="text-5xl text-green-500 mb-6" />

              <h3 className="text-2xl font-bold mb-4">
                Trusted Listings
              </h3>

              <p className="text-gray-600">
                Verified plots with complete legal
                documentation and secure transactions.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-10 rounded-3xl shadow-lg"
            >
              <FaHome className="text-5xl text-green-500 mb-6" />

              <h3 className="text-2xl font-bold mb-4">
                Affordable Prices
              </h3>

              <p className="text-gray-600">
                Find the best residential and commercial
                properties at competitive rates.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white p-10 rounded-3xl shadow-lg"
            >
              <FaMapMarkedAlt className="text-5xl text-green-500 mb-6" />

              <h3 className="text-2xl font-bold mb-4">
                Prime Locations
              </h3>

              <p className="text-gray-600">
                Explore premium plots in fast-growing
                and highly connected areas.
              </p>
            </motion.div>

          </div>
        </div>
      </section>
      <section className="py-24 px-6 bg-white">

  <div className="max-w-6xl mx-auto">

    <motion.h2
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-4xl font-bold text-center mb-16"
    >
      Featured Plots
    </motion.h2>

    <div className="grid md:grid-cols-3 gap-8">

      {featuredPlots.map((plot) => (
        <ListingCard
          key={plot.id}
          plot={plot}
        />
      ))}

    </div>

  </div>

</section>
    </div>
  );
}

export default Home;