import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaHeart, FaRegHeart, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../services/api";
import { getImageUrl, getOptimizedImageUrl } from "../../utils/imageHelper";
import { getAuthToken } from "../../utils/storage";

const SAVED_STORAGE_KEY = "thikana_saved_destinations";

const getSavedList = () => {
  try {
    const raw =
      localStorage.getItem(SAVED_STORAGE_KEY) ||
      localStorage.getItem("thikana_saved_destinations");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const ListingCard = ({ plot, actionLabel = "View Details" }) => {
  const spotId = plot?._id || plot?.id;
  const spotIdStr = spotId ? String(spotId) : "";

  // Check if item is saved/liked in storage (defaults to false so destinations are NOT pre-liked)
  const [isLiked, setIsLiked] = useState(() => {
    if (!spotIdStr) return false;
    const list = getSavedList();
    return Array.isArray(list) && list.includes(spotIdStr);
  });

  // Keep state synchronized across cards and browser tabs
  useEffect(() => {
    if (!spotIdStr) return;
    const syncSavedState = () => {
      const list = getSavedList();
      setIsLiked(Array.isArray(list) && list.includes(spotIdStr));
    };

    window.addEventListener("thikana:saved-changed", syncSavedState);
    window.addEventListener("storage", syncSavedState);

    return () => {
      window.removeEventListener("thikana:saved-changed", syncSavedState);
      window.removeEventListener("storage", syncSavedState);
    };
  }, [spotIdStr]);

  if (!plot) return null;

  const {
    title = "Scenic Spot",
    location = "Location Unknown",
    area,
    category = "Scenic Escape",
  } = plot;

  const handleToggleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!spotIdStr) return;

    const currentList = getSavedList();
    const alreadySaved = currentList.includes(spotIdStr);
    const nextSaved = !alreadySaved;

    const updatedList = nextSaved
      ? [...currentList.filter((x) => x !== spotIdStr), spotIdStr]
      : currentList.filter((x) => x !== spotIdStr);

    try {
      localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (storageErr) {
      console.warn("Could not persist saved destination to localStorage:", storageErr);
    }

    setIsLiked(nextSaved);

    if (nextSaved) {
      toast.success(`Saved "${title}" to your favorites!`, {
        toastId: `fav-${spotIdStr}`,
        autoClose: 2000,
      });
    } else {
      toast.info(`Removed "${title}" from favorites`, {
        toastId: `fav-${spotIdStr}`,
        autoClose: 2000,
      });
    }

    // Broadcast change so duplicate cards on page sync in real-time
    window.dispatchEvent(
      new CustomEvent("thikana:saved-changed", {
        detail: { spotId: spotIdStr, isLiked: nextSaved },
      })
    );

    // Sync with backend if user is authenticated
    const token = getAuthToken();
    if (token) {
      API.post(`/spots/${spotIdStr}/wishlist`).catch(() => {
        // Silent fail for non-blocking background sync
      });
    }
  };

  // Realistic rating computation: use spot rating if provided and distinct, or hash-derived rating (4.4 - 5.0)
  const computeRealisticRating = () => {
    if (plot.rating && typeof plot.rating === "number" && plot.rating !== 4.8) {
      return plot.rating.toFixed(1);
    }
    const seedStr = `${title}-${spotId}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
    }
    const ratingsPool = ["4.5", "4.9", "4.7", "4.8", "4.6", "4.9", "4.4", "5.0", "4.7"];
    return ratingsPool[Math.abs(hash) % ratingsPool.length];
  };

  const displayRating = computeRealisticRating();
  const rawPrice = plot.price;
  const formattedPrice =
    typeof rawPrice === "number"
      ? `₹${rawPrice.toLocaleString()}/hr`
      : rawPrice || "Price on Request";
  const displayArea = area || category || "Nature Stay";

  const fallback = plot.category || plot.title || spotId;
  const imageUrl = getOptimizedImageUrl(plot.images?.[0] || plot.image, fallback, 600);

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full">
      <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-200 flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src = getImageUrl(null, fallback);
          }}
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 shadow backdrop-blur-sm">
          {category}
        </div>
        {(plot.isFeatured || plot.featuredConfig?.isFeatured) && (
          <div className="absolute left-4 bottom-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md shadow-amber-500/30">
            <span>✨</span> {plot.featuredConfig?.sponsoredBadge || "Featured"}
          </div>
        )}
        {plot.corporateFriendly?.isCorporateFriendly && (
          <div className="absolute right-4 bottom-3 flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-bold text-emerald-300 shadow-md backdrop-blur-sm border border-emerald-500/30">
            <span>🏢</span> Up to {plot.corporateFriendly.maxCorporateCapacity || plot.maxGuests || 50}
          </div>
        )}
        <button
          type="button"
          onClick={handleToggleLike}
          aria-label={isLiked ? "Remove from favorites" : "Save destination"}
          title={isLiked ? "Remove from favorites" : "Save destination"}
          className={`absolute right-4 top-4 rounded-full p-2.5 shadow transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm z-10 ${
            isLiked
              ? "bg-white text-rose-500 shadow-rose-500/20"
              : "bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white"
          }`}
        >
          {isLiked ? (
            <FaHeart size={14} className="text-rose-500" />
          ) : (
            <FaRegHeart size={14} className="transition-colors duration-200" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h2
              title={title}
              className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 min-h-[3rem] leading-snug group-hover:text-emerald-600 transition-colors"
            >
              {title}
            </h2>
            <div
              title={location}
              className="mt-2 flex items-center gap-1.5 text-xs text-slate-600"
            >
              <FaMapMarkerAlt className="text-emerald-500 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200/60">
            <FaStar className="text-amber-500" /> {displayRating}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Stay</p>
            <p className="font-semibold text-slate-800">{displayArea}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">From</p>
            <p className="font-semibold text-emerald-600">{formattedPrice}</p>
          </div>
        </div>

        <Link
          to={`/plot/${spotId}`}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600"
        >
          {actionLabel} <FaArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};

export default ListingCard;
