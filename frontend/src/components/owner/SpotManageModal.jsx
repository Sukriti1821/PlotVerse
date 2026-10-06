import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaUpload,
  FaPlus,
  FaTrash,
  FaImages,
  FaTag,
  FaMapMarkerAlt,
  FaSpinner,
  FaCheckCircle,
  FaCalendarAlt,
  FaPercent,
  FaSlidersH,
  FaSun,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import API from "../../services/api";
import { getImageUrl } from "../../utils/imageHelper";

const MONTH_NAMES = [
  { val: 1, name: "Jan" },
  { val: 2, name: "Feb" },
  { val: 3, name: "Mar" },
  { val: 4, name: "Apr" },
  { val: 5, name: "May" },
  { val: 6, name: "Jun" },
  { val: 7, name: "Jul" },
  { val: 8, name: "Aug" },
  { val: 9, name: "Sep" },
  { val: 10, name: "Oct" },
  { val: 11, name: "Nov" },
  { val: 12, name: "Dec" },
];

const CATEGORIES = [
  "Grassland Plot",
  "Date Night Setup",
  "Hillside Hut",
  "Get Together Setup",
  "Mountain Cafe",
  "Riverside Meadow",
  "Empty Plot",
  "Campfire Stays",
];

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;

const SpotManageModal = ({ isOpen, onClose, spotToEdit, onSpotSaved }) => {
  const isEditing = Boolean(spotToEdit && spotToEdit._id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  // Amenities list
  const [amenities, setAmenities] = useState([
    { name: "Bonfire Setup & Firewood", hourlyPrice: 350 },
    { name: "Alpine Waterproof Tent", hourlyPrice: 500 },
  ]);

  // Dynamic Pricing Rules configuration
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);
  const [weekdayPrice, setWeekdayPrice] = useState("");
  const [weekendPrice, setWeekendPrice] = useState("");
  const [peakSeasonPrice, setPeakSeasonPrice] = useState("");
  const [peakSeasonMonths, setPeakSeasonMonths] = useState([5, 6, 11, 12, 1]);
  const [holidayPrice, setHolidayPrice] = useState("");
  const [specialDates, setSpecialDates] = useState([]);
  const [durationDiscounts, setDurationDiscounts] = useState([
    { minHours: 4, discountPercentage: 10, label: "Extended Stay (4+ Hours - 10% Off)" },
    { minHours: 8, discountPercentage: 20, label: "Full Day Retreat (8+ Hours - 20% Off)" },
  ]);

  // Existing images (for edit mode)
  const [existingImages, setExistingImages] = useState([]);
  
  // New selected files & object URL previews
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  // Synchronize form state from props during render (avoids cascading render warning)
  const [prevTrigger, setPrevTrigger] = useState({ id: spotToEdit?._id, isOpen });
  if (prevTrigger.id !== spotToEdit?._id || prevTrigger.isOpen !== isOpen) {
    setPrevTrigger({ id: spotToEdit?._id, isOpen });
    if (isOpen) {
      if (spotToEdit) {
        setTitle(spotToEdit.title || "");
        setDescription(spotToEdit.description || "");
        setLocation(spotToEdit.location || "");
        setPrice(spotToEdit.price || "");
        setCategory(spotToEdit.category || CATEGORIES[0]);

        // Parse existing amenities
        if (Array.isArray(spotToEdit.amenities) && spotToEdit.amenities.length > 0) {
          setAmenities(
            spotToEdit.amenities.map((a) => ({
              name: a.name || a.title || (typeof a === "string" ? a : ""),
              hourlyPrice: a.hourlyPrice || a.price || 0,
            }))
          );
        } else {
          setAmenities([]);
        }

        // Parse dynamic pricing rules if available
        if (spotToEdit.pricingRules) {
          const pr = spotToEdit.pricingRules;
          setWeekdayPrice(pr.weekdayPrice ? String(pr.weekdayPrice) : "");
          setWeekendPrice(pr.weekendPrice ? String(pr.weekendPrice) : "");
          setPeakSeasonPrice(pr.peakSeasonPrice ? String(pr.peakSeasonPrice) : "");
          setPeakSeasonMonths(Array.isArray(pr.peakSeasonMonths) && pr.peakSeasonMonths.length > 0 ? pr.peakSeasonMonths : [5, 6, 11, 12, 1]);
          setHolidayPrice(pr.holidayPrice ? String(pr.holidayPrice) : "");
          setSpecialDates(Array.isArray(pr.specialDates) ? pr.specialDates : []);
          if (Array.isArray(pr.durationDiscounts) && pr.durationDiscounts.length > 0) {
            setDurationDiscounts(pr.durationDiscounts);
          }
          if (pr.weekendPrice || pr.weekdayPrice || pr.peakSeasonPrice || pr.holidayPrice || (pr.specialDates && pr.specialDates.length > 0)) {
            setShowDynamicPricing(true);
          } else {
            setShowDynamicPricing(false);
          }
        } else {
          setWeekdayPrice("");
          setWeekendPrice("");
          setPeakSeasonPrice("");
          setPeakSeasonMonths([5, 6, 11, 12, 1]);
          setHolidayPrice("");
          setSpecialDates([]);
          setShowDynamicPricing(false);
        }

        // Parse existing images
        const existing = spotToEdit.images && spotToEdit.images.length > 0
          ? spotToEdit.images
          : spotToEdit.image
          ? [spotToEdit.image]
          : [];
        setExistingImages(existing);
      } else {
        // Reset to fresh defaults
        setTitle("");
        setDescription("");
        setLocation("");
        setPrice("");
        setCategory(CATEGORIES[0]);
        setAmenities([
          { name: "Bonfire Setup & Firewood", hourlyPrice: 350 },
          { name: "Solar Lanterns & Power", hourlyPrice: 150 },
        ]);
        setWeekdayPrice("");
        setWeekendPrice("");
        setPeakSeasonPrice("");
        setPeakSeasonMonths([5, 6, 11, 12, 1]);
        setHolidayPrice("");
        setSpecialDates([]);
        setDurationDiscounts([
          { minHours: 4, discountPercentage: 10, label: "Extended Stay (4+ Hours - 10% Off)" },
          { minHours: 8, discountPercentage: 20, label: "Full Day Retreat (8+ Hours - 20% Off)" },
        ]);
        setShowDynamicPricing(false);
        setExistingImages([]);
      }

      setSelectedFiles([]);
      setFilePreviews([]);
    }
  }

  // Handle file input changes with client-side validation
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalAllowed = MAX_FILES - existingImages.length - selectedFiles.length;
    if (files.length > totalAllowed) {
      toast.warning(`You can upload a maximum of ${MAX_FILES} photos per spot listing.`);
    }

    const validFiles = [];
    const validPreviews = [];

    for (const file of files.slice(0, Math.max(0, totalAllowed))) {
      // 1. Validate MIME type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WEBP.`);
        continue;
      }

      // 2. Validate file size (5MB)
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);
    e.target.value = "";
  };

  // Remove a newly selected file preview
  const handleRemoveNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Remove an existing image
  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Amenities management
  const handleAddAmenity = () => {
    setAmenities((prev) => [...prev, { name: "", hourlyPrice: 0 }]);
  };

  const handleAmenityChange = (index, field, value) => {
    setAmenities((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveAmenity = (index) => {
    setAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Pricing Helpers
  const handleToggleMonth = (mVal) => {
    setPeakSeasonMonths((prev) =>
      prev.includes(mVal) ? prev.filter((m) => m !== mVal) : [...prev, mVal]
    );
  };

  const handleAddSpecialDate = () => {
    setSpecialDates((prev) => [...prev, { name: "", date: "", price: "" }]);
  };

  const handleSpecialDateChange = (index, field, value) => {
    setSpecialDates((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveSpecialDate = (index) => {
    setSpecialDates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDiscount = () => {
    setDurationDiscounts((prev) => [
      ...prev,
      { minHours: 6, discountPercentage: 15, label: "6+ Hours Stay - 15% Off" },
    ]);
  };

  const handleDiscountChange = (index, field, value) => {
    setDurationDiscounts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveDiscount = (index) => {
    setDurationDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !location.trim() || !price) {
      toast.error("Please fill in Title, Location, and Base Hourly Price.");
      return;
    }

    if (Number(price) <= 0) {
      toast.error("Base hourly price must be greater than 0.");
      return;
    }

    // Validate amenity prices are numbers > 0
    const nonBlankAmenities = amenities.filter((a) => a.name && a.name.trim());
    for (const a of nonBlankAmenities) {
      const p = Number(a.hourlyPrice);
      if (isNaN(p) || p <= 0) {
        toast.error(`Amenity "${a.name}" price must be a valid number greater than 0.`);
        return;
      }
    }

    if (existingImages.length === 0 && selectedFiles.length === 0) {
      toast.warning("Please upload at least one photo for your spot listing.");
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("location", location.trim());
      formData.append("price", Number(price));
      formData.append("category", category);

      // Dynamic pricing payload
      const pricingRulesPayload = {
        weekdayPrice: weekdayPrice ? Number(weekdayPrice) : undefined,
        weekendPrice: weekendPrice ? Number(weekendPrice) : undefined,
        peakSeasonPrice: peakSeasonPrice ? Number(peakSeasonPrice) : undefined,
        peakSeasonMonths: peakSeasonMonths.length > 0 ? peakSeasonMonths : undefined,
        holidayPrice: holidayPrice ? Number(holidayPrice) : undefined,
        specialDates: specialDates
          .filter((s) => s.date && s.price)
          .map((s) => ({
            name: s.name ? s.name.trim() : "Special Event",
            date: s.date,
            price: Number(s.price),
          })),
        durationDiscounts: durationDiscounts
          .filter((d) => Number(d.minHours) > 0 && Number(d.discountPercentage) > 0)
          .map((d) => ({
            minHours: Number(d.minHours),
            discountPercentage: Number(d.discountPercentage),
            label: d.label ? d.label.trim() : `${d.discountPercentage}% Off`,
          })),
      };
      formData.append("pricingRules", JSON.stringify(pricingRulesPayload));

      // Clean amenities
      const validAmenities = nonBlankAmenities.map((a) => ({
        name: a.name.trim(),
        hourlyPrice: Number(a.hourlyPrice),
        price: Number(a.hourlyPrice),
      }));
      formData.append("amenities", JSON.stringify(validAmenities));

      // Append existing images to keep (for updates)
      if (isEditing) {
        formData.append("keepImages", JSON.stringify(existingImages));
      }

      // Append all new uploaded files under 'images'
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      let response;
      if (isEditing) {
        response = await API.patch(`/spots/${spotToEdit._id}`, formData);
        toast.success("Spot listing updated successfully!");
      } else {
        response = await API.post("/spots", formData);
        toast.success("New spot listing published successfully!");
      }

      if (onSpotSaved) {
        onSpotSaved(response.data?.data || response.data);
      }
      onClose();
    } catch (err) {
      console.error("Error saving spot listing:", err);
      toast.error(
        err.response?.data?.message || "Failed to save spot listing. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <FaImages className="text-emerald-400 text-xl" />
            <h2 className="text-lg font-bold">
              {isEditing ? "Edit Spot Listing & Photos" : "Create New Nature Spot Listing"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title & Category */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Spot Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Solang Alpine Meadow & Pine Plot"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Base Hourly Price */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Location (Valley, State) *
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Solang Valley, Manali, Himachal Pradesh"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Base Hourly Price (₹/hr) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 1200"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Pricing Rules Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 overflow-hidden">
            <div
              onClick={() => setShowDynamicPricing(!showDynamicPricing)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FaSlidersH size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">Dynamic Pricing Rules</h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      {weekdayPrice || weekendPrice || peakSeasonPrice || holidayPrice || specialDates.length > 0
                        ? "Active Rules"
                        : "Optional"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure weekend premiums, peak-season rates, holidays, and duration discounts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 transition p-1"
                aria-label="Toggle dynamic pricing section"
              >
                {showDynamicPricing ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {showDynamicPricing && (
              <div className="mt-5 pt-5 border-t border-slate-200/70 space-y-6">
                {/* 1. Base Overrides: Weekday, Weekend, Holiday */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Weekday Rate (₹/hr)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder={`Default: ₹${price || "0"}`}
                        value={weekdayPrice}
                        onChange={(e) => setWeekdayPrice(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Monday through Friday</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Weekend Rate (₹/hr)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 700"
                        value={weekendPrice}
                        onChange={(e) => setWeekendPrice(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Saturday & Sunday</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Holiday Rate (₹/hr)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 1200"
                        value={holidayPrice}
                        onChange={(e) => setHolidayPrice(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">National & festival dates</span>
                  </div>
                </div>

                {/* 2. Peak Season Tier */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <FaSun className="text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Peak Season Pricing
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Peak Rate:</span>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 1000"
                          value={peakSeasonPrice}
                          onChange={(e) => setPeakSeasonPrice(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    Select the months during which this peak rate applies:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MONTH_NAMES.map((m) => {
                      const isSelected = peakSeasonMonths.includes(m.val);
                      return (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => handleToggleMonth(m.val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            isSelected
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Duration Stay Discounts */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaPercent className="text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Duration Stay Discounts
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDiscount}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
                    >
                      <FaPlus size={9} /> Add Tier
                    </button>
                  </div>

                  <div className="space-y-2">
                    {durationDiscounts.map((disc, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 whitespace-nowrap">For</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="Hours"
                          value={disc.minHours}
                          onChange={(e) => handleDiscountChange(idx, "minHours", e.target.value)}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500 whitespace-nowrap">+ hrs, give</span>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          placeholder="%"
                          value={disc.discountPercentage}
                          onChange={(e) =>
                            handleDiscountChange(idx, "discountPercentage", e.target.value)
                          }
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-500"
                        />
                        <span className="text-slate-500">% off</span>
                        <input
                          type="text"
                          placeholder="Label (optional)"
                          value={disc.label || ""}
                          onChange={(e) => handleDiscountChange(idx, "label", e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscount(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Special Dates Overrides */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-violet-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Special Date Custom Rates (Top Priority)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpecialDate}
                      className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-800 bg-violet-50 px-2.5 py-1 rounded-lg transition"
                    >
                      <FaPlus size={9} /> Add Special Date
                    </button>
                  </div>

                  {specialDates.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No specific festival or single-day price overrides set.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {specialDates.map((item, idx) => (
                        <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="Event (e.g. New Year Eve)"
                            value={item.name}
                            onChange={(e) => handleSpecialDateChange(idx, "name", e.target.value)}
                            className="flex-1 min-w-[140px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                          />
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleSpecialDateChange(idx, "date", e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                          />
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="Rate/hr"
                              value={item.price}
                              onChange={(e) =>
                                handleSpecialDateChange(idx, "price", e.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1.5 text-xs outline-none focus:border-violet-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpecialDate(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Description & Highlights
            </label>
            <textarea
              rows="3"
              placeholder="Describe the landscape views, camping terrain, river proximity, and unique outdoor atmosphere..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Multi-Photo Upload Section (Multer) */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaImages className="text-emerald-500" /> Spot Photos ({existingImages.length + selectedFiles.length}/{MAX_FILES})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 5 high-res photos (JPEG, PNG, WEBP - max 5MB each).
                </p>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 text-xs font-bold transition">
                <FaUpload /> Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3">
              {/* Existing Images */}
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
                  <img
                    src={getImageUrl(img)}
                    alt={`Existing ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded">
                    Saved
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition opacity-90 group-hover:opacity-100"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              ))}

              {/* Newly Selected File Previews */}
              {filePreviews.map((previewUrl, idx) => (
                <div key={`new-${idx}`} className="relative h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-emerald-50 group shadow-sm">
                  <img
                    src={previewUrl}
                    alt={`New upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition opacity-90 group-hover:opacity-100"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              ))}

              {/* Empty placeholder slot if < 5 images */}
              {existingImages.length + selectedFiles.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <FaUpload size={20} className="text-slate-300" />
                  <span>No photos uploaded yet. Click "Upload Photos" above.</span>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Amenity Catalog Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaTag className="text-emerald-500" /> Add-On Amenity Catalog
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set hourly add-on options guests can compose into their booking.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAmenity}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition"
              >
                <FaPlus size={10} /> Add Amenity
              </button>
            </div>

            <div className="space-y-2.5">
              {amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Amenity name (e.g. Bonfire Setup)"
                    value={amenity.name}
                    onChange={(e) => handleAmenityChange(idx, "name", e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="Rate/hr"
                      value={amenity.hourlyPrice}
                      onChange={(e) => handleAmenityChange(idx, "hourlyPrice", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(idx)}
                    className="text-slate-400 hover:text-rose-600 p-2 transition"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Uploading & Saving...
                </>
              ) : (
                <>
                  <FaCheckCircle /> {isEditing ? "Update Spot Listing" : "Publish Spot Listing"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SpotManageModal;
