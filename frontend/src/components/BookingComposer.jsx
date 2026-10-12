import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaPlus,
  FaMinus,
  FaSpinner,
  FaLock,
  FaInfoCircle,
  FaUtensils,
  FaChevronDown,
  FaChevronUp,
  FaLeaf,
  FaDrumstickBite,
  FaStar,
  FaMagic,
  FaTimes,
  FaExclamationTriangle,
  FaTag,
  FaBullhorn,
  FaGift,
  FaWallet,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import BuyAsGiftModal from "./gifts/BuyAsGiftModal";

const BookingComposer = ({
  spot,
  selectedAmenities: controlledAmenities,
  onToggleAmenity,
}) => {
  const { user, openAuthModal, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Booking Form State
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // default tomorrow
    return today.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [guests, setGuests] = useState(1);
  const [internalAmenities, setInternalAmenities] = useState([]);
  const selectedAmenities =
    controlledAmenities !== undefined ? controlledAmenities : internalAmenities;
  const [submitting, setSubmitting] = useState(false);

  // Feature 9: Buy as Gift State
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Intelligent Availability Engine State
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Dynamic Pricing State (Authoritative Server Breakdown)
  const [serverPricing, setServerPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Optional Food Ordering State
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [isFoodAccordionOpen, setIsFoodAccordionOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [foodQuantities, setFoodQuantities] = useState({}); // { [itemName]: quantity }

  // Optional Custom Requests State (items outside catalog)
  const [customRequests, setCustomRequests] = useState([]);
  const [customRequestInput, setCustomRequestInput] = useState("");
  const [isCustomRequestsOpen, setIsCustomRequestsOpen] = useState(false);

  const handleAddCustomRequest = (e) => {
    if (e) e.preventDefault();
    if (!customRequestInput.trim()) return;
    setCustomRequests((prev) => [...prev, customRequestInput.trim()]);
    setCustomRequestInput("");
  };

  const handleRemoveCustomRequest = (index) => {
    setCustomRequests((prev) => prev.filter((_, i) => i !== index));
  };

  // Landowner Growth Tools: Active Spot Promotions & Discount Code State
  const [spotPromotions, setSpotPromotions] = useState([]);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [isPromoAccordionOpen, setIsPromoAccordionOpen] = useState(false);

  // Feature 8: Thikana Wallet Credit Checkout State
  const [useWalletCredits, setUseWalletCredits] = useState(false);

  // Fetch active promotions for this spot (banners, deals, coupons)
  useEffect(() => {
    let ignore = false;
    const fetchPromotions = async () => {
      const spotId = spot?._id || spot?.id;
      if (!spotId) return;
      try {
        const res = await API.get(`/promotions/spot/${spotId}`);
        if (!ignore && res.data?.data) {
          setSpotPromotions(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load spot promotions:", err);
      }
    };

    fetchPromotions();
    return () => {
      ignore = true;
    };
  }, [spot]);

  // Active promotional banners
  const activeBanners = useMemo(() => {
    return spotPromotions.filter(
      (p) => p.promotionType === "banner_announcement" && p.bannerText
    );
  }, [spotPromotions]);

  // Available coupon codes that customers can click to apply
  const availableCoupons = useMemo(() => {
    return spotPromotions.filter(
      (p) => p.promotionType === "coupon_code" && p.code
    );
  }, [spotPromotions]);

  // Fetch nearby restaurants matching spot location/region
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!spot?.location) return;
      try {
        setLoadingRestaurants(true);
        const res = await API.get("/restaurants", {
          params: { location: spot.location },
        });
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setRestaurants(list);
        if (list.length > 0) {
          setSelectedRestaurantId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load nearby restaurants:", err);
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [spot]);

  // Fetch real-time availability schedule whenever spot or date changes
  useEffect(() => {
    let ignore = false;
    const fetchAvailability = async () => {
      const spotId = spot?._id || spot?.id;
      if (!spotId || !date) return;
      try {
        setLoadingAvailability(true);
        const res = await API.get(`/spots/${spotId}/availability`, {
          params: { date },
        });
        if (!ignore && res.data) {
          setAvailabilityData(res.data.data || res.data);
        }
      } catch (err) {
        console.error("Failed to load plot availability schedule:", err);
      } finally {
        if (!ignore) setLoadingAvailability(false);
      }
    };

    fetchAvailability();
    return () => {
      ignore = true;
    };
  }, [spot, date]);

  // Selected restaurant object
  const activeRestaurant = useMemo(() => {
    return restaurants.find((r) => r._id === selectedRestaurantId) || restaurants[0] || null;
  }, [restaurants, selectedRestaurantId]);

  // Food quantities updater
  const updateFoodQuantity = (itemName, delta) => {
    setFoodQuantities((prev) => {
      const current = prev[itemName] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemName];
        return copy;
      }
      return { ...prev, [itemName]: next };
    });
  };

  // Compute Food Subtotal & Formatted items array
  const { foodItemsList, foodSubtotal } = useMemo(() => {
    if (!activeRestaurant || !activeRestaurant.menu) {
      return { foodItemsList: [], foodSubtotal: 0 };
    }

    let subtotal = 0;
    const items = [];

    activeRestaurant.menu.forEach((menuItem) => {
      const qty = foodQuantities[menuItem.name] || 0;
      if (qty > 0) {
        const lineTotal = menuItem.price * qty;
        subtotal += lineTotal;
        items.push({
          name: menuItem.name,
          price: menuItem.price,
          quantity: qty,
        });
      }
    });

    return { foodItemsList: items, foodSubtotal: subtotal };
  }, [activeRestaurant, foodQuantities]);

  // Normalize spot's amenity catalog into structured items and bundle mountain experience add-ons
  const catalog = useMemo(() => {
    const rawList = spot?.amenities && Array.isArray(spot.amenities) ? spot.amenities : [];
    const baseItems = rawList.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `amenity-${index}`,
          name: item,
          hourlyPrice: 0,
          price: 0,
        };
      }
      const p = Number(item.price ?? item.hourlyPrice ?? 0);
      return {
        id: item._id || `amenity-${index}`,
        name: item.name || item.title || `Amenity #${index + 1}`,
        hourlyPrice: p,
        price: p,
      };
    });

    const HIMALAYAN_ADDONS = [
      { id: "addon-bonfire", name: "🔥 Himalayan Bonfire & Pine Timber Kit", hourlyPrice: 150, price: 150 },
      { id: "addon-telescope", name: "🔭 Dark-Sky Telescope & Stargazing Chart", hourlyPrice: 200, price: 200 },
      { id: "addon-guide", name: "🥾 Valley Nature Trail Guide", hourlyPrice: 250, price: 250 },
      { id: "addon-kahwa", name: "☕ Mountain Kahwa & Fresh Herbal Tea", hourlyPrice: 100, price: 100 },
    ];

    const combined = [...baseItems];
    for (const addon of HIMALAYAN_ADDONS) {
      const exists = combined.some(
        (b) =>
          (b.name.toLowerCase().includes("bonfire") && addon.id === "addon-bonfire") ||
          (b.name.toLowerCase().includes("telescope") && addon.id === "addon-telescope") ||
          (b.name.toLowerCase().includes("guide") && addon.id === "addon-guide") ||
          (b.name.toLowerCase().includes("kahwa") && addon.id === "addon-kahwa")
      );
      if (!exists) {
        combined.push(addon);
      }
    }
    return combined;
  }, [spot]);

  // Compute duration in hours from startTime and endTime
  const durationHours = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMins = (sh || 0) * 60 + (sm || 0);
    const endMins = (eh || 0) * 60 + (em || 0);

    if (endMins > startMins) {
      const diff = (endMins - startMins) / 60;
      return Math.max(1, Math.round(diff * 10) / 10);
    }
    return 1;
  }, [startTime, endTime]);

  // Base spot hourly rate
  const baseHourlyRate = Number(spot?.price) || 0;

  // Selected amenities rate (calculates using hourlyPrice or price)
  const selectedAmenitiesHourlyRate = useMemo(() => {
    return selectedAmenities.reduce((total, selected) => {
      const rate = Number(selected.hourlyPrice ?? selected.price ?? 0);
      return total + rate;
    }, 0);
  }, [selectedAmenities]);

  // Client-side estimated total price
  const estimatedTotal = useMemo(() => {
    const spotAndAmenitiesTotal =
      (baseHourlyRate + selectedAmenitiesHourlyRate) * durationHours;
    return spotAndAmenitiesTotal + foodSubtotal;
  }, [baseHourlyRate, selectedAmenitiesHourlyRate, durationHours, foodSubtotal]);

  // Fetch authoritative Dynamic Pricing breakdown from server
  useEffect(() => {
    let ignore = false;
    const fetchPricing = async () => {
      const spotId = spot?._id || spot?.id;
      if (!spotId || !date) return;
      try {
        setLoadingPricing(true);
        const payload = {
          date,
          startTime,
          endTime,
          durationHours,
          selectedAmenities: selectedAmenities.map((a) => ({
            name: a.name,
            hourlyPrice: Number(a.hourlyPrice ?? a.price ?? 0),
          })),
        };

        if (activeRestaurant && foodItemsList.length > 0) {
          payload.foodOrder = {
            restaurantId: activeRestaurant._id,
            items: foodItemsList,
          };
        }

        const res = await API.post(`/spots/${spotId}/calculate-price`, payload);
        if (!ignore && res.data) {
          setServerPricing(res.data.data || res.data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic price breakdown:", err);
      } finally {
        if (!ignore) setLoadingPricing(false);
      }
    };

    fetchPricing();
    return () => {
      ignore = true;
    };
  }, [spot, date, startTime, endTime, durationHours, selectedAmenities, activeRestaurant, foodItemsList]);

  // Effective promotional discount calculation
  const effectiveDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    const currentSubtotal = serverPricing?.grandTotal ?? Math.round(estimatedTotal);
    if (appliedPromo.discountType === "percentage") {
      return Math.min(
        currentSubtotal,
        Math.round((currentSubtotal * Number(appliedPromo.discountValue || 0)) / 100)
      );
    }
    return Math.min(
      currentSubtotal,
      Number(appliedPromo.discountAmount || appliedPromo.discountValue || 0)
    );
  }, [appliedPromo, serverPricing, estimatedTotal]);

  const subtotalAfterPromo = Math.max(
    0,
    (serverPricing?.grandTotal ?? Math.round(estimatedTotal)) - effectiveDiscount
  );

  const availableWalletBalance = user?.walletBalance || 0;
  const effectiveWalletCredit = useMemo(() => {
    if (!useWalletCredits || availableWalletBalance <= 0) return 0;
    return Math.min(availableWalletBalance, subtotalAfterPromo);
  }, [useWalletCredits, availableWalletBalance, subtotalAfterPromo]);

  const finalPayableTotal = Math.max(0, subtotalAfterPromo - effectiveWalletCredit);

  // Apply promotional code with live server preflight check
  const handleApplyPromo = async (codeToApply) => {
    const rawCode = typeof codeToApply === "string" ? codeToApply : promoCodeInput;
    const code = (rawCode || "").trim().toUpperCase();

    if (!code) {
      setPromoMessage({ type: "error", text: "Please enter a promotional code." });
      return;
    }

    try {
      setValidatingPromo(true);
      setPromoMessage(null);
      const spotId = spot?._id || spot?.id;
      const currentSubtotal = serverPricing?.grandTotal ?? Math.round(estimatedTotal);

      const res = await API.post("/promotions/validate", {
        code,
        spotId,
        subtotal: currentSubtotal,
        bookingDate: date,
        durationHours,
      });

      if (res.data?.success && res.data?.data) {
        setAppliedPromo(res.data.data);
        setPromoCodeInput(code);
        setPromoMessage({
          type: "success",
          text: `Coupon "${code}" applied! Saved ₹${res.data.data.discountAmount.toLocaleString("en-IN")}`,
        });
        toast.success(
          `Promo "${code}" applied! -₹${res.data.data.discountAmount.toLocaleString("en-IN")}`
        );
      }
    } catch (err) {
      console.error("Promo validation error:", err);
      const errMsg =
        err.response?.data?.message || "Invalid or ineligible promotional code.";
      setPromoMessage({ type: "error", text: errMsg });
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoMessage(null);
    toast.info("Promotional code removed");
  };

  // Real-time intelligent conflict & availability evaluator
  const computeSlotConflict = () => {
    const [sh, sm] = (startTime || "").split(":").map(Number);
    const [eh, em] = (endTime || "").split(":").map(Number);
    const startMins = (sh || 0) * 60 + (sm || 0);
    const endMins = (eh || 0) * 60 + (em || 0);

    if (endMins <= startMins) {
      return {
        hasConflict: true,
        message: "End time must be strictly later than start time.",
      };
    }

    if (!availabilityData) return null;

    const duration = (endMins - startMins) / 60;
    const minDur = availabilityData.minDurationHours || 1;
    const maxDur = availabilityData.maxDurationHours || 12;

    if (duration < minDur) {
      return {
        hasConflict: true,
        message: `Minimum reservation length is ${minDur} ${minDur === 1 ? "hour" : "hours"} (Selected: ${duration}h).`,
      };
    }

    if (duration > maxDur) {
      return {
        hasConflict: true,
        message: `Maximum reservation length is ${maxDur} hours per session (Selected: ${duration}h).`,
      };
    }

    const openTime = availabilityData.operatingHours?.open || "06:00";
    const closeTime = availabilityData.operatingHours?.close || "22:00";
    const [oh, om] = openTime.split(":").map(Number);
    const [ch, cm] = closeTime.split(":").map(Number);
    const openMins = (oh || 0) * 60 + (om || 0);
    const closeMins = (ch || 0) * 60 + (cm || 0);

    if (startMins < openMins || endMins > closeMins) {
      return {
        hasConflict: true,
        message: `Selected hours are outside landowner schedule (${openTime} to ${closeTime}).`,
      };
    }

    if (availabilityData.isDateBlocked) {
      return {
        hasConflict: true,
        message: `This date is blocked: ${availabilityData.blockReason || "Unavailable"}.`,
      };
    }

    const bufferMinutes = availabilityData.bufferMinutes || 30;

    // Check booked intervals + turnaround buffer
    if (Array.isArray(availabilityData.bookedIntervals)) {
      for (const b of availabilityData.bookedIntervals) {
        const [bsh, bsm] = (b.startTime || "").split(":").map(Number);
        const [beh, bem] = (b.endTime || "").split(":").map(Number);
        const bStart = (bsh || 0) * 60 + (bsm || 0);
        const bEnd = (beh || 0) * 60 + (bem || 0);
        const bBufferEnd = bEnd + bufferMinutes;

        // Overlap with existing reservation + buffer
        if (startMins < bBufferEnd && (endMins + bufferMinutes) > bStart) {
          return {
            hasConflict: true,
            conflictStart: b.startTime,
            conflictEnd: b.endTime,
            bufferEnd: b.bufferEndTime,
            suggestedNext: b.bufferEndTime,
            message: `Conflict: Plot is reserved from ${b.startTime} to ${b.endTime} (+ ${bufferMinutes}m host buffer until ${b.bufferEndTime}).`,
          };
        }
      }
    }

    return null;
  };

  const slotConflict = computeSlotConflict();

  // Toggle amenity selection (delegates to parent if controlled)
  const toggleAmenity = (amenity) => {
    if (onToggleAmenity) {
      onToggleAmenity(amenity);
      return;
    }

    const name =
      typeof amenity === "string" ? amenity : amenity?.name || amenity?.title || "";
    const price = Number(amenity?.price ?? amenity?.hourlyPrice ?? 0);
    if (!name) return;

    setInternalAmenities((prev) => {
      const exists = prev.some(
        (a) => a.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => a.name.toLowerCase() !== name.toLowerCase()
        );
      } else {
        return [...prev, { name, hourlyPrice: price, price }];
      }
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.info("Please log in or create an account to complete your booking.");
      openAuthModal("login");
      return;
    }

    if (!date) {
      toast.error("Please select a booking date.");
      return;
    }

    if (slotConflict) {
      toast.error(slotConflict.message || "Selected time slot is unavailable. Please choose an open slot.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        spotId: spot._id || spot.id,
        date,
        startTime,
        endTime,
        durationHours,
        selectedAmenities: selectedAmenities.map((a) => ({
          name: a.name,
          hourlyPrice: Number(a.hourlyPrice ?? a.price ?? 0),
          price: Number(a.price ?? a.hourlyPrice ?? 0),
        })),
        guests: Number(guests) || 1,
      };

      // Attach foodOrder if customer composed one
      if (activeRestaurant && foodItemsList.length > 0) {
        payload.foodOrder = {
          restaurantId: activeRestaurant._id,
          items: foodItemsList,
          subtotal: foodSubtotal,
        };
      }

      // Attach customRequests if customer added any
      if (customRequests.length > 0) {
        payload.customRequests = customRequests.map((desc) => ({
          description: desc,
        }));
      }

      // Attach applied promotional code if valid
      if (appliedPromo?.code) {
        payload.promoCode = appliedPromo.code;
      }

      // Feature 8: Attach wallet credit deduction if customer opted in
      if (useWalletCredits && effectiveWalletCredit > 0) {
        payload.useWalletCredits = true;
        payload.appliedWalletCredits = effectiveWalletCredit;
      }

      const response = await API.post("/bookings", payload);

      if (refreshUser) {
        refreshUser();
      }

      const bookingData = response.data?.data || response.data;
      const totalAmount = Number(bookingData?.totalPrice ?? response.data?.totalPrice ?? 0);

      toast.success(
        `Booking reserved successfully! Total: ₹${totalAmount.toLocaleString("en-IN")}`,
        { autoClose: 4000 }
      );

      navigate("/my-bookings");
    } catch (err) {
      console.error("Booking submission error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to create booking. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-mist bg-white p-6 shadow-xl lg:p-8">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-pine-mist px-3 py-1 text-xs font-bold uppercase tracking-wider text-pine">
          Instant Reservation
        </span>
        <h3 className="mt-2 text-2xl font-bold text-navy">
          Compose Your Stay
        </h3>
        <p className="mt-1 text-xs text-slate-brand">
          Pick your time slot, add amenities, optionally order local food, and view live totals.
        </p>
      </div>

      {/* Promotional Banners & Host Announcements */}
      {activeBanners.length > 0 && (
        <div className="mb-6 space-y-2.5">
          {activeBanners.map((banner) => (
            <div
              key={banner._id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-saffron to-saffron-hover p-[1px] shadow-sm"
            >
              <div className="rounded-[15px] bg-white p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-snow text-navy font-bold border border-mist">
                    <FaBullhorn size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-saffron/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-saffron-text">
                        Host Promotion
                      </span>
                      <h4 className="text-xs font-bold text-navy truncate">
                        {banner.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-brand leading-relaxed font-medium">
                      {banner.bannerText}
                    </p>
                    {banner.code && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-brand font-medium">Use coupon:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPromo(banner.code)}
                          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-saffron bg-snow px-2 py-0.5 text-xs font-mono font-bold text-saffron-text hover:bg-mist transition cursor-pointer"
                        >
                          <FaTag size={9} /> {banner.code}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* 1. Date Selection */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy">
            1. Select Date
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-mist bg-snow px-4 py-3 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/15">
            <FaCalendarAlt className="text-navy" />
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-base sm:text-sm font-medium text-navy outline-none min-h-[40px]"
            />
          </div>
        </div>

        {/* 2. Time Slot & Duration */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy">
            2. Time Slot & Duration ({durationHours} {durationHours === 1 ? "hour" : "hours"})
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-mist bg-snow px-3 py-2.5 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/15">
              <FaClock className="text-xs text-navy" />
              <div className="w-full">
                <span className="block text-[10px] uppercase font-bold text-slate-brand">Start</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-transparent text-base sm:text-xs font-bold text-navy outline-none min-h-[36px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-mist bg-snow px-3 py-2.5 focus-within:border-navy focus-within:bg-white focus-within:ring-2 focus-within:ring-navy/15">
              <FaClock className="text-xs text-navy" />
              <div className="w-full">
                <span className="block text-[10px] uppercase font-bold text-slate-brand">End</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-transparent text-base sm:text-xs font-bold text-navy outline-none min-h-[36px]"
                />
              </div>
            </div>
          </div>

          {/* Availability Policies & Buffer Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-brand">
            <span className="inline-flex items-center gap-1 rounded-md bg-snow border border-mist px-2 py-0.5 font-medium text-navy">
              🕒 Open {availabilityData?.operatingHours?.open || "06:00"} – {availabilityData?.operatingHours?.close || "22:00"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-snow border border-mist px-2 py-0.5 font-medium text-saffron-text">
              ⚡ {availabilityData?.bufferMinutes ?? 30}m turnaround buffer
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-snow border border-mist px-2 py-0.5 font-medium text-navy">
              ⏳ Min {availabilityData?.minDurationHours || 1}h / Max {availabilityData?.maxDurationHours || 12}h
            </span>
          </div>

          {/* Real-time Conflict Alert */}
          {slotConflict && (
            <div className="mt-3 rounded-2xl border border-danger/20 bg-danger-mist p-4 text-danger shadow-xs">
              <div className="flex items-start gap-2.5">
                <FaExclamationTriangle className="mt-0.5 shrink-0 text-danger" size={14} />
                <div className="text-xs">
                  <span className="font-bold block mb-0.5 text-danger">Time Slot Unavailable</span>
                  <p className="leading-relaxed text-danger">{slotConflict.message}</p>
                </div>
              </div>
              {slotConflict.suggestedNext && (
                <button
                  type="button"
                  onClick={() => {
                    setStartTime(slotConflict.suggestedNext);
                    const [nh, nm] = slotConflict.suggestedNext.split(":").map(Number);
                    const nextEndMins = (nh || 0) * 60 + (nm || 0) + (durationHours || 2) * 60;
                    const endH = Math.floor(nextEndMins / 60);
                    const endM = nextEndMins % 60;
                    const closeH = parseInt((availabilityData?.operatingHours?.close || "22:00").split(":")[0], 10);
                    const clampedEndH = Math.min(closeH, endH);
                    setEndTime(`${String(clampedEndH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-navy text-navy hover:bg-navy hover:text-snow px-3 py-1.5 text-[11px] font-bold transition cursor-pointer"
                >
                  ⚡ Shift Start to {slotConflict.suggestedNext}
                </button>
              )}
            </div>
          )}

          {/* Suggested Available Windows */}
          {availabilityData?.availableWindows && availabilityData.availableWindows.length > 0 && (
            <div className="mt-3">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-brand mb-1.5">
                Available Time Windows on {date}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availabilityData.availableWindows.map((win, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setStartTime(win.startTime);
                      setEndTime(win.endTime);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-pine/20 bg-pine-mist px-2.5 py-1 text-[11px] font-bold text-pine hover:bg-pine-mist/80 transition cursor-pointer"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pine animate-pulse"></span>
                    {win.startTime} – {win.endTime} ({win.durationHours}h)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Day Schedule Timeline Strip */}
          {availabilityData?.timeline && availabilityData.timeline.length > 0 && (
            <div className="mt-4 rounded-2xl border border-mist bg-snow p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  Day Schedule ({availabilityData.timeline[0]?.time} - {availabilityData.timeline[availabilityData.timeline.length - 1]?.time})
                  {loadingAvailability && <FaSpinner className="animate-spin text-navy" size={10} />}
                </span>
                <div className="flex items-center gap-2.5 text-[10px] font-medium text-slate-brand">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-pine"></span> Available
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-navy"></span> Booked
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-saffron"></span> Buffer
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                {availabilityData.timeline.map((slot, idx) => {
                  let bgClass = "bg-pine-mist text-pine border-pine/20 hover:bg-pine-mist/80";
                  if (slot.status === "booked") {
                    bgClass = "bg-navy text-snow border-navy cursor-not-allowed";
                  } else if (slot.status === "buffer") {
                    bgClass = "bg-saffron/20 text-saffron-text border-saffron/30 cursor-not-allowed";
                  } else if (slot.status === "past" || slot.status === "blocked" || slot.status === "maintenance") {
                    bgClass = "bg-mist text-slate-brand border-mist cursor-not-allowed opacity-60";
                  }

                  return (
                    <div
                      key={idx}
                      title={`${slot.time} - ${slot.detail}`}
                      className={`flex flex-col items-center justify-center rounded-lg border py-1.5 text-[10px] font-bold transition select-none ${bgClass}`}
                    >
                      <span>{slot.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Guests count */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy">
            3. Guests
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease guests"
              onClick={() => setGuests((prev) => Math.max(1, Number(prev || 1) - 1))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-mist bg-snow text-navy hover:bg-mist active:scale-95 transition text-base font-bold cursor-pointer"
            >
              <FaMinus size={11} />
            </button>
            <input
              type="number"
              min="1"
              max="50"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="flex-1 text-center rounded-2xl border border-mist bg-snow px-4 py-2.5 text-base sm:text-sm font-bold text-navy outline-none focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/15 min-h-[44px]"
            />
            <button
              type="button"
              aria-label="Increase guests"
              onClick={() => setGuests((prev) => Math.min(50, Number(prev || 1) + 1))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy hover:bg-dusk text-snow active:scale-95 transition text-base font-bold shadow-md cursor-pointer"
            >
              <FaPlus size={11} />
            </button>
          </div>
        </div>

        {/* 4. Customize Amenities */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">
              4. Customize Amenities
            </label>
            <span className="text-[11px] font-semibold text-pine">
              {selectedAmenities.length} selected
            </span>
          </div>

          {catalog.length > 0 ? (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {catalog.map((amenity) => {
                const isSelected = selectedAmenities.some(
                  (a) => a.name.toLowerCase() === amenity.name.toLowerCase()
                );

                return (
                  <div
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 transition-all ${
                      isSelected
                        ? "border-pine bg-pine-mist/50 shadow-sm"
                        : "border-mist bg-snow hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? "bg-pine text-white"
                            : "border border-mist bg-white text-transparent"
                        }`}
                      >
                        <FaCheck size={10} />
                      </div>
                      <span className="text-xs font-semibold text-navy">
                        {amenity.name}
                      </span>
                    </div>

                    <div className="text-right">
                      {amenity.hourlyPrice > 0 ? (
                        <span className="text-xs font-bold text-navy">
                          +₹{amenity.hourlyPrice}/hr
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-pine">
                          Included
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl bg-snow border border-mist p-3 text-xs text-slate-brand">
              Basic property amenities included in the base rate.
            </p>
          )}
        </div>

        {/* 5. OPTIONAL: Food Ordering from Nearby Mountain Cafes / Kitchens */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 transition-all">
          <div
            onClick={() => setIsFoodAccordionOpen(!isFoodAccordionOpen)}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <FaUtensils size={13} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  5. Add Food & Drinks <span className="text-amber-600 font-bold">(Optional)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {foodItemsList.length > 0
                    ? `${foodItemsList.length} food items selected (+₹${foodSubtotal})`
                    : "Deliver fresh local meals & tea to your plot."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="text-slate-500 hover:text-slate-800 p-1 rounded-full transition"
            >
              {isFoodAccordionOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
          </div>

          {/* Collapsible Food Menu Area */}
          {isFoodAccordionOpen && (
            <div className="mt-4 border-t border-amber-200/60 pt-4 space-y-4">
              {loadingRestaurants ? (
                <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500">
                  <FaSpinner className="animate-spin text-amber-500" /> Finding nearby kitchens...
                </div>
              ) : restaurants.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No local cafes found for this area yet. Bookings can proceed without food.
                </p>
              ) : (
                <>
                  {/* Restaurant Selector Tabs */}
                  {restaurants.length > 1 && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Select Kitchen / Cafe:
                      </label>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {restaurants.map((rest) => (
                          <button
                            key={rest._id}
                            type="button"
                            onClick={() => {
                              setSelectedRestaurantId(rest._id);
                              setFoodQuantities({}); // Reset cart on restaurant switch
                            }}
                            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                              selectedRestaurantId === rest._id
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-amber-50"
                            }`}
                          >
                            {rest.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Restaurant Details */}
                  {activeRestaurant && (
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-bold text-slate-800">
                          {activeRestaurant.name}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                          <FaStar size={9} /> {activeRestaurant.rating || 4.7}
                        </span>
                      </div>

                      {/* Menu Items List */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                        {activeRestaurant.menu && activeRestaurant.menu.length > 0 ? (
                          activeRestaurant.menu.map((menuItem) => {
                            const qty = foodQuantities[menuItem.name] || 0;

                            return (
                              <div
                                key={menuItem._id || menuItem.name}
                                className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs"
                              >
                                <div className="pr-2 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    {menuItem.isVeg ? (
                                      <span className="text-emerald-600 text-[10px]" title="Vegetarian">
                                        <FaLeaf />
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 text-[10px]" title="Non-Veg">
                                        <FaDrumstickBite />
                                      </span>
                                    )}
                                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                                      {menuItem.name}
                                    </h5>
                                  </div>
                                  <p className="text-[11px] font-bold text-amber-700 mt-0.5">
                                    ₹{menuItem.price}
                                  </p>
                                </div>

                                {/* Counter Buttons (+ / -) */}
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  {qty > 0 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => updateFoodQuantity(menuItem.name, -1)}
                                        className="h-5 w-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 text-[10px] shadow-xs"
                                      >
                                        <FaMinus size={8} />
                                      </button>
                                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                                        {qty}
                                      </span>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => updateFoodQuantity(menuItem.name, 1)}
                                    className="h-5 w-5 flex items-center justify-center rounded bg-emerald-600 text-white hover:bg-emerald-500 text-[10px] shadow-xs"
                                  >
                                    <FaPlus size={8} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400">No menu items available.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* 6. OPTIONAL: Custom Requests (Items outside catalog) */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 transition-all">
            <div
              onClick={() => setIsCustomRequestsOpen(!isCustomRequestsOpen)}
              className="flex cursor-pointer items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                  <FaMagic size={12} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    6. Request Something Not Listed <span className="text-purple-600 font-bold">(Optional)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {customRequests.length > 0
                      ? `${customRequests.length} custom ${customRequests.length === 1 ? "request" : "requests"} added (Price quoted upon host review)`
                      : "Extra chairs, flowers, custom setups, etc."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="text-slate-500 hover:text-slate-800 p-1 rounded-full transition"
              >
                {isCustomRequestsOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            </div>

            {/* Collapsible Custom Request Input & List */}
            {isCustomRequestsOpen && (
              <div className="mt-4 border-t border-purple-200/60 pt-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 4 extra foldable chairs, warm bonfire blankets..."
                    value={customRequestInput}
                    onChange={(e) => setCustomRequestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomRequest();
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRequest}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold transition shadow-sm"
                  >
                    Add Request
                  </button>
                </div>

                {customRequests.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {customRequests.map((reqDesc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-purple-100 text-xs shadow-xs"
                      >
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                          {reqDesc}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomRequest(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <FaTimes size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 italic">
                  ℹ️ Custom items are reviewed by the host. If approved, the host will quote a price for you to accept.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 7. OPTIONAL: Apply Promo / Discount Code */}
        <div className="rounded-2xl border border-mist bg-snow p-4 transition-all">
          <div
            onClick={() => setIsPromoAccordionOpen(!isPromoAccordionOpen)}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-snow shadow-sm">
                <FaTag size={12} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  7. Have a Promo Code? <span className="text-pine font-bold">(Optional)</span>
                </h4>
                <p className="text-[11px] text-slate-brand">
                  {appliedPromo
                    ? `Coupon "${appliedPromo.code}" active (-₹${effectiveDiscount.toLocaleString()})`
                    : "Apply discount codes, limited-time deals, or loyalty vouchers."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="text-slate-brand hover:text-navy p-1 rounded-full transition cursor-pointer"
            >
              {isPromoAccordionOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
          </div>

          {/* Collapsible Promo Code Area */}
          {isPromoAccordionOpen && (
            <div className="mt-4 border-t border-mist pt-4 space-y-3">
              {appliedPromo ? (
                <div className="flex items-center justify-between rounded-xl bg-pine-mist/80 p-3 border border-pine/30">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine text-white text-xs">
                      <FaCheck size={11} />
                    </span>
                    <div>
                      <span className="font-mono text-xs font-black tracking-wider text-pine">
                        {appliedPromo.code}
                      </span>
                      <p className="text-[11px] text-pine font-medium">
                        {appliedPromo.title || "Discount Applied"} — saved ₹{effectiveDiscount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger-mist border border-danger/20 transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SUMMER20, WELCOME10..."
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        setPromoMessage(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      className="flex-1 rounded-xl border border-mist bg-white px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
                    />
                    <button
                      type="button"
                      disabled={validatingPromo || !promoCodeInput.trim()}
                      onClick={() => handleApplyPromo()}
                      className="rounded-xl bg-navy hover:bg-dusk text-snow px-4 py-2 text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {validatingPromo ? <FaSpinner className="animate-spin" size={12} /> : "Apply"}
                    </button>
                  </div>

                  {/* Feedback Message */}
                  {promoMessage && (
                    <p
                      className={`text-xs font-medium ${
                        promoMessage.type === "success" ? "text-pine" : "text-danger"
                      }`}
                    >
                      {promoMessage.text}
                    </p>
                  )}

                  {/* Quick-apply available coupons for this spot */}
                  {availableCoupons.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-brand block mb-1.5">
                        Available Offers for this Plot:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.map((c) => (
                          <button
                            key={c._id}
                            type="button"
                            onClick={() => handleApplyPromo(c.code)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-pine/40 bg-white px-2 py-1 text-[11px] font-bold text-pine hover:bg-pine-mist transition cursor-pointer"
                          >
                            <FaTag size={9} />
                            <span className="font-mono">{c.code}</span>
                            <span className="text-pine font-normal">
                              ({c.discountType === "percentage" ? `${c.discountValue}% off` : `₹${c.discountValue} off`})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transparent Dynamic Price Breakdown Card */}
        <div className="rounded-2xl border border-mist bg-snow p-4">
          <div className="flex items-center justify-between mb-3 border-b border-mist pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
              Price Breakdown
              {loadingPricing && <FaSpinner className="animate-spin text-navy" size={10} />}
            </span>
            {serverPricing?.appliedRule && serverPricing.appliedRule.ruleType !== "base" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pine-mist px-2.5 py-0.5 text-[10px] font-bold text-pine">
                ✨ {serverPricing.appliedRule.ruleLabel}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            {/* Base Plot Line */}
            <div className="flex items-center justify-between text-slate-brand">
              <span>Plot ({durationHours} {durationHours === 1 ? "hr" : "hrs"} @ ₹{(serverPricing?.baseHourlyRate ?? baseHourlyRate).toLocaleString()}/hr):</span>
              <span className="font-semibold text-navy">
                ₹{(serverPricing?.basePlotTotal ?? (baseHourlyRate * durationHours)).toLocaleString()}
              </span>
            </div>

            {/* Dynamic Rule Adjustment Line */}
            {serverPricing?.appliedRule && serverPricing.appliedRule.totalAdjustment !== 0 && (
              <div className="flex items-center justify-between font-medium text-pine bg-pine-mist/80 px-2 py-1 rounded-lg">
                <span>{serverPricing.appliedRule.ruleLabel}:</span>
                <span className="font-bold">
                  {serverPricing.appliedRule.totalAdjustment > 0 ? "+" : ""}₹{serverPricing.appliedRule.totalAdjustment.toLocaleString()}
                </span>
              </div>
            )}

            {/* Extended Stay Discount Line */}
            {serverPricing?.durationDiscount?.applied && (
              <div className="flex items-center justify-between font-medium text-pine bg-pine-mist/80 px-2 py-1 rounded-lg">
                <span>{serverPricing.durationDiscount.label}:</span>
                <span className="font-bold">
                  -₹{serverPricing.durationDiscount.discountAmount.toLocaleString()}
                </span>
              </div>
            )}

            {/* Itemized Amenities */}
            {serverPricing?.amenitiesBreakdown && serverPricing.amenitiesBreakdown.length > 0 ? (
              serverPricing.amenitiesBreakdown.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-brand">
                  <span>{a.name} ({durationHours}h):</span>
                  <span className="font-semibold text-navy">
                    {a.hourlyPrice > 0 ? `+₹${a.total.toLocaleString()}` : "Included"}
                  </span>
                </div>
              ))
            ) : selectedAmenitiesHourlyRate > 0 ? (
              <div className="flex items-center justify-between text-slate-brand">
                <span>Amenities Add-ons:</span>
                <span className="font-semibold text-navy">
                  +₹{(selectedAmenitiesHourlyRate * durationHours).toLocaleString()}
                </span>
              </div>
            ) : null}

            {/* Food Subtotal */}
            {(serverPricing?.foodSubtotal > 0 || foodSubtotal > 0) && (
              <div className="flex items-center justify-between text-xs text-navy bg-mist/60 p-2 rounded-xl">
                <span className="flex items-center gap-1 font-bold">
                  <FaUtensils size={10} /> Food & Beverages:
                </span>
                <span className="font-extrabold text-navy">
                  +₹{(serverPricing?.foodSubtotal ?? foodSubtotal).toLocaleString()}
                </span>
              </div>
            )}

            {/* Promotional Code Discount Line */}
            {appliedPromo && effectiveDiscount > 0 && (
              <div className="flex items-center justify-between font-bold text-pine bg-pine-mist/80 px-2.5 py-1.5 rounded-xl border border-pine/30">
                <span className="flex items-center gap-1.5">
                  <FaTag size={10} /> Promo ({appliedPromo.code}):
                </span>
                <span className="font-black text-pine">
                  -₹{effectiveDiscount.toLocaleString()}
                </span>
              </div>
            )}

            {/* Wallet Credit Discount Line */}
            {useWalletCredits && effectiveWalletCredit > 0 && (
              <div className="flex items-center justify-between font-bold text-pine bg-pine-mist/90 px-2.5 py-1.5 rounded-xl border border-pine/30">
                <span className="flex items-center gap-1.5">
                  <FaWallet size={10} /> Wallet Credit:
                </span>
                <span className="font-black text-pine">
                  -₹{effectiveWalletCredit.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Wallet Credit Toggle Card */}
          {user && availableWalletBalance > 0 && (
            <div className="mt-3 pt-3 border-t border-mist">
              <label className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-pine/30 hover:bg-snow transition cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useWalletCredits}
                    onChange={(e) => setUseWalletCredits(e.target.checked)}
                    className="h-4 w-4 rounded border-mist text-navy focus:ring-navy cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-navy flex items-center gap-1">
                      <FaWallet className="text-pine" size={10} /> Use Wallet Balance
                    </span>
                    <span className="text-[10px] text-slate-brand">
                      Available: ₹{availableWalletBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                {useWalletCredits && effectiveWalletCredit > 0 && (
                  <span className="text-xs font-extrabold text-pine bg-pine-mist px-2 py-0.5 rounded-md">
                    -₹{effectiveWalletCredit.toLocaleString("en-IN")}
                  </span>
                )}
              </label>
            </div>
          )}

          <div className="border-t border-mist mt-3 pt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-brand block">
                Total
              </span>
              <span className="text-[10px] text-pine font-medium flex items-center gap-1 mt-0.5">
                <FaInfoCircle size={9} /> Server-Verified Rate
              </span>
            </div>
            <div className="text-right">
              {(effectiveDiscount > 0 || (useWalletCredits && effectiveWalletCredit > 0)) && (
                <span className="text-xs text-slate-brand line-through block font-medium">
                  ₹{(serverPricing?.grandTotal ?? Math.round(estimatedTotal)).toLocaleString()}
                </span>
              )}
              <span className="text-2xl font-extrabold text-navy">
                ₹{finalPayableTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Submit or Auth Button - EXACTLY ONE SAFFRON PRIMARY BUTTON PER SCREEN */}
        {user ? (
          <button
            type="submit"
            disabled={submitting || Boolean(slotConflict)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-4 font-bold text-navy shadow-lg hover:bg-saffron-hover transition active:scale-95 disabled:bg-mist disabled:text-slate-brand disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting && <FaSpinner className="animate-spin" />}
            {slotConflict
              ? "Slot Unavailable (Select Open Time)"
              : submitting
              ? "Confirming Slot..."
              : "Reserve & Book Now"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-4 font-bold text-navy shadow-lg hover:bg-saffron-hover transition active:scale-95 cursor-pointer"
          >
            <FaLock size={14} /> Sign In to Book This Spot
          </button>
        )}

        {/* Feature 9: Buy as a Gift Button - SECONDARY NAVY OUTLINE */}
        <button
          type="button"
          onClick={() => setShowGiftModal(true)}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-navy bg-white py-3.5 font-bold text-navy shadow-sm transition hover:bg-navy hover:text-snow text-xs active:scale-95 cursor-pointer"
        >
          <FaGift className="text-saffron-text text-sm" /> Gift this Plot Experience 🎁
        </button>

        {/* Feature 9: Buy as Gift Modal */}
        <BuyAsGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          spot={spot}
          selectedAddOns={selectedAmenities}
          durationHours={durationHours}
        />
      </form>
    </div>
  );
};

export default BookingComposer;
