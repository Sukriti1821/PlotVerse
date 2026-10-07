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
import { getImageUrl, getOptimizedImageUrl } from "../../utils/imageHelper";

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
      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Top Banner Image & Badges */}
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <img
            src={displayImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top Category Badge */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-md">
            <CategoryIcon className="text-emerald-400 text-xs" />
            <span>{category}</span>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white shadow-md">
            <FaClock size={10} />
            <span>{durationHours} Hours Package</span>
          </div>

          {/* Bottom Overlay Info inside Image */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
            <span className="flex items-center gap-1 font-medium truncate max-w-[70%]">
              <FaMapMarkerAlt className="text-emerald-400 shrink-0" size={11} />
              <span className="truncate">{spotLocation}</span>
            </span>

            {reviewsCount > 0 && (
              <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full font-bold">
                <FaStar className="text-amber-400 text-[10px]" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-slate-300">({reviewsCount})</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {experience.description}
          </p>

          {/* Included Amenities Highlights */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Package Inclusions ({includedAmenities.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {includedAmenities.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold"
                >
                  <FaCheck size={9} className="text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[130px]">{item.name}</span>
                </span>
              ))}
              {includedAmenities.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-600 px-2 py-0.5 text-[11px] font-semibold">
                  +{includedAmenities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Optional Add-Ons teaser */}
          {optionalAddOns.length > 0 && (
            <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1">
              <span className="font-semibold text-slate-600">
                {optionalAddOns.length} customizable add-on{optionalAddOns.length > 1 ? "s" : ""}
              </span>{" "}
              available during booking
            </div>
          )}
        </div>
      </div>

      {/* Footer Price & Action */}
      <div className="p-5 pt-0">
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Package Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-slate-900">
                ₹{price ? price.toLocaleString("en-IN") : "0"}
              </span>
              <span className="text-xs text-slate-500 font-medium">total</span>
            </div>
          </div>

          <Link
            to={`/experience/${_id}`}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all hover:gap-2.5"
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
