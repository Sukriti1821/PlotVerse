import { useEffect, useState } from "react";
import axios from "axios";

function Plots() {
  const [plots, setPlots] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/plots")
      .then((response) => {
        setPlots(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const filteredPlots = plots.filter((plot) =>
    plot.title.toLowerCase().includes(search.toLowerCase()) ||
    plot.location.toLowerCase().includes(search.toLowerCase())
  );

  const plotImages = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    "https://images.unsplash.com/photo-1494526585095-c41746248156",
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <h1 className="text-5xl font-bold text-center mb-10">
          Available Plots
        </h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-12">
          <input
            type="text"
            placeholder="Search by plot name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 px-5 py-4 rounded-2xl border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-10">

          {filteredPlots.map((plot, index) => (
            <div
              key={plot.id}
              className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition duration-300"
            >

              <img
                src={plotImages[index % plotImages.length]}
                alt="plot"
                className="h-60 w-full object-cover"
              />

              <div className="p-6">

                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {plot.title}
                  </h2>

                  <span className="bg-green-400 text-black px-3 py-1 rounded-full font-semibold">
                    {plot.price}
                  </span>
                </div>

                <p className="text-gray-600 mt-4">
                  📍 {plot.location}
                </p>

                <button className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-green-500 hover:text-black transition font-semibold">
                  Book Now
                </button>

              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}

export default Plots;