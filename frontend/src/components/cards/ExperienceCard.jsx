import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaClock,
  FaMapMarkerAlt,
  FaCheck,
  FaStar,
  FaArrowRight,
  FaHeart,
  FaUsers,
  FaFire,
  FaCompass,
} from "react-icons/fa";
import { getOptimizedImageUrl } from "../../utils/imageHelper";

const CATEGORY_ICONS = {
  "Romantic Date": FaHeart,
  "Group Gathering": FaUsers,
  "Friends' Escape": FaUsers,
  "Stargazing Retreat": FaCompass,
  "Sunset Campfire": FaFire,
  "Mountain Wellness": FaCompass,
};

const ExperienceCard = ({ experience }) => {
  if (!experience) return null;

  const {
    _id,
    title,
    category,
    durationHours,
    price,
    includedAmenities = [],
    optionalAddOns = [],
    image,
    spot,
    rating = 4.9,
    reviewsCount = 0,
  } = experience;

  const CategoryIcon = CATEGORY_ICONS[category] || FaCompass;
  const displayImage = getOptimizedImageUrl(
    image || spot?.image || (spot?.images && spot.images[0]),
    category,
    640
  );
  const spotLocation = spot?.location || "Scenic Private Nature Plot";

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-mist bg-white shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Top Banner Image & Badges */}
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist">
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-transparent to-navy/30" />

          {/* Top Category Badge */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-dusk/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-snow shadow-md border border-white/10">
            <CategoryIcon className="text-saffron text-xs" />
            <span>{category}</span>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-navy/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-snow shadow-md border border-white/10">
            <FaClock size={10} className="text-saffron" />
            <span>{durationHours} Hours Package</span>
          </div>

          {/* Bottom Overlay Info inside Image */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-snow text-xs">
            <span className="flex items-center gap-1 font-medium truncate max-w-[70%]">
              <FaMapMarkerAlt className="text-saffron shrink-0" size={11} />
              <span className="truncate">{spotLocation}</span>
            </span>

            {reviewsCount > 0 && (
              <span className="flex items-center gap-1 bg-navy-deep/70 backdrop-blur-sm px-2 py-0.5 rounded-full font-bold border border-white/10">
                <FaStar className="text-saffron text-[10px]" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-light-slate">({reviewsCount})</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-navy group-hover:text-saffron-text transition-colors line-clamp-1">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-brand line-clamp-2 leading-relaxed">
            {experience.description}
          </p>

          {/* Included Amenities Highlights */}
          <div className="mt-4 pt-3 border-t border-mist">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-brand block mb-2">
              Package Inclusions ({includedAmenities.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {includedAmenities.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-pine-mist text-pine border border-pine/20 px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  <FaCheck size={9} className="text-pine shrink-0" />
                  <span className="truncate max-w-[130px]">{item.name}</span>
                </span>
              ))}
              {includedAmenities.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-mist text-slate-brand px-2 py-0.5 text-[11px] font-semibold">
                  +{includedAmenities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Optional Add-Ons teaser */}
          {optionalAddOns.length > 0 && (
            <div className="mt-2.5 text-[11px] text-slate-brand flex items-center gap-1">
              <span className="font-semibold text-navy">
                {optionalAddOns.length} customizable add-on{optionalAddOns.length > 1 ? "s" : ""}
              </span>{" "}
              available during booking
            </div>
          )}
        </div>
      </div>

      {/* Footer Price & Action */}
      <div className="p-5 pt-0">
        <div className="flex items-center justify-between border-t border-mist pt-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-brand block">
              Package Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-navy">
                ₹{price ? price.toLocaleString("en-IN") : "0"}
              </span>
              <span className="text-xs text-slate-brand font-medium">total</span>
            </div>
          </div>

          <Link
            to={`/experience/${_id}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-navy px-4 py-2 text-xs font-bold text-navy hover:bg-navy hover:text-snow transition-all hover:gap-2.5"
          >
            <span>Customize & Book</span>
            <FaArrowRight size={10} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceCard;
