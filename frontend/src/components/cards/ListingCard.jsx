import { FaMapMarkerAlt, FaRulerCombined, FaArrowRight } from "react-icons/fa";

const ListingCard = ({ plot }) => {
  // Fallback values if plot is undefined or missing properties
  if (!plot) {
    return null;
  }

  const {
    id,
    title = "Plot",
    location = "Location Unknown",
    area = "N/A",
    price = "Price on Request",
    image = null,
  } = plot;

  // Placeholder image URL (real estate themed)
  const placeholderImage =
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=400&fit=crop";
  const imageUrl = image || placeholderImage;

  return (
    <div
      key={id}
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative h-56 md:h-64 overflow-hidden bg-gray-200">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <button className="hidden group-hover:flex items-center gap-2 bg-green-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors">
            View Details <FaArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 md:p-6 flex flex-col gap-3">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 line-clamp-2 hover:text-green-600 transition-colors">
          {title}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-600">
          <FaMapMarkerAlt className="text-green-500 flex-shrink-0" size={18} />
          <span className="text-sm md:text-base">{location}</span>
        </div>

        {/* Area & Price Row */}
        <div className="flex items-center justify-between gap-4 py-3 border-t border-b border-gray-200">
          {/* Area */}
          <div className="flex items-center gap-2">
            <FaRulerCombined className="text-blue-500 flex-shrink-0" size={16} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Area</p>
              <p className="text-sm md:text-base font-bold text-gray-800">
                {area}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
            <p className="text-sm md:text-lg font-bold text-green-600">
              {price}
            </p>
          </div>
        </div>

        {/* View Details Button (visible on small screens) */}
        <button className="md:hidden w-full bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 mt-2">
          View Details <FaArrowRight size={16} />
        </button>

        {/* Desktop button alternative (if needed) */}
        <button className="hidden md:block w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2 mt-2">
          View Details <FaArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ListingCard;