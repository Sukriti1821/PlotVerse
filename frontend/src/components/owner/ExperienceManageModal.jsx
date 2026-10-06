import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaUpload,
  FaPlus,
  FaTrash,
  FaCheck,
  FaImages,
  FaTag,
  FaTree,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";
import API from "../../services/api";
import { getImageUrl } from "../../utils/imageHelper";

const CATEGORIES = [
  "Romantic Date",
  "Group Gathering",
  "Stargazing Retreat",
  "Sunset Campfire",
  "Nature Picnic",
  "Adventure Camp",
];

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;

const ExperienceManageModal = ({
  isOpen,
  onClose,
  experienceToEdit,
  ownerSpots = [],
  onExperienceSaved,
}) => {
  const isEditing = Boolean(experienceToEdit && experienceToEdit._id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [durationHours, setDurationHours] = useState("4");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("6");
  const [isActive, setIsActive] = useState(true);

  // Inclusions & Add-Ons
  const [includedAmenities, setIncludedAmenities] = useState([
    { name: "Bonfire Setup & Firewood", description: "All evening bonfire" },
    { name: "Ambient Fairy Lights", description: "Warm battery-powered path lighting" },
  ]);

  const [optionalAddOns, setOptionalAddOns] = useState([
    { name: "Gourmet Snack Basket", price: 450, description: "Local artisanal snacks & juices" },
  ]);

  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  // Synchronize state from props during render (avoids cascading render warning)
  const [prevTrigger, setPrevTrigger] = useState({ id: experienceToEdit?._id, isOpen });
  if (prevTrigger.id !== experienceToEdit?._id || prevTrigger.isOpen !== isOpen) {
    setPrevTrigger({ id: experienceToEdit?._id, isOpen });
    if (isOpen) {
      if (experienceToEdit) {
        setTitle(experienceToEdit.title || "");
        setDescription(experienceToEdit.description || "");
        setSelectedSpotId(
          experienceToEdit.spot?._id || experienceToEdit.spot || (ownerSpots[0]?._id || "")
        );
        setCategory(experienceToEdit.category || CATEGORIES[0]);
        setDurationHours(String(experienceToEdit.durationHours || "4"));
        setPrice(String(experienceToEdit.price || ""));
        setMaxGuests(String(experienceToEdit.maxGuests || "6"));
        setIsActive(experienceToEdit.isActive !== false);

        setIncludedAmenities(
          Array.isArray(experienceToEdit.includedAmenities) && experienceToEdit.includedAmenities.length > 0
            ? experienceToEdit.includedAmenities
            : []
        );

        setOptionalAddOns(
          Array.isArray(experienceToEdit.optionalAddOns) && experienceToEdit.optionalAddOns.length > 0
            ? experienceToEdit.optionalAddOns
            : []
        );

        const existing = experienceToEdit.images && experienceToEdit.images.length > 0
          ? experienceToEdit.images
          : experienceToEdit.image
          ? [experienceToEdit.image]
          : [];
        setExistingImages(existing);
      } else {
        // Defaults for new experience
        setTitle("");
        setDescription("");
        setSelectedSpotId(ownerSpots[0]?._id || "");
        setCategory(CATEGORIES[0]);
        setDurationHours("4");
        setPrice("");
        setMaxGuests("6");
        setIsActive(true);
        setIncludedAmenities([
          { name: "Bonfire Setup & Firewood", description: "Firewood logs and fire starter" },
          { name: "Ambient Outdoor Seating", description: "Cozy lounge seating and blankets" },
        ]);
        setOptionalAddOns([
          { name: "BBQ Grill & Skewer Kit", price: 650, description: "Charcoal grill with skewers" },
        ]);
        setExistingImages([]);
      }

      setSelectedFiles([]);
      setFilePreviews([]);
    }
  }

  // Handle selecting a spot: can import the spot's amenities into inclusions
  const handleSpotChange = (spotId) => {
    setSelectedSpotId(spotId);
    const chosenSpot = ownerSpots.find((s) => s._id === spotId);
    if (chosenSpot && Array.isArray(chosenSpot.amenities) && chosenSpot.amenities.length > 0) {
      // Auto-suggest the first 2 amenities from the spot
      const spotInclusions = chosenSpot.amenities.slice(0, 3).map((a) => ({
        name: typeof a === "string" ? a : a.name || a.title || "",
        description: "Included from host plot inventory",
      })).filter((a) => Boolean(a.name));

      if (spotInclusions.length > 0 && includedAmenities.length === 0) {
        setIncludedAmenities(spotInclusions);
      }
    }
  };

  // Included Amenities Handlers
  const handleAddInclusion = () => {
    setIncludedAmenities((prev) => [...prev, { name: "", description: "" }]);
  };
  const handleInclusionChange = (index, field, value) => {
    setIncludedAmenities((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const handleRemoveInclusion = (index) => {
    setIncludedAmenities((prev) => prev.filter((_, i) => i !== index));
  };

  // Optional Add-ons Handlers
  const handleAddOptional = () => {
    setOptionalAddOns((prev) => [...prev, { name: "", price: "", description: "" }]);
  };
  const handleOptionalChange = (index, field, value) => {
    setOptionalAddOns((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };
  const handleRemoveOptional = (index) => {
    setOptionalAddOns((prev) => prev.filter((_, i) => i !== index));
  };

  // File Upload Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalAllowed = MAX_FILES - existingImages.length - selectedFiles.length;
    if (files.length > totalAllowed) {
      toast.warning(`You can upload up to ${MAX_FILES} photos.`);
    }

    const validFiles = [];
    const validPreviews = [];
    for (const file of files.slice(0, Math.max(0, totalAllowed))) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB size limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setFilePreviews((prev) => [...prev, ...validPreviews]);
    e.target.value = "";
  };

  const handleRemoveNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !selectedSpotId || !durationHours || !price) {
      toast.error("Please fill in Title, Description, Plot, Duration, and Package Price.");
      return;
    }

    if (Number(price) <= 0) {
      toast.error("Package price must be greater than 0.");
      return;
    }

    if (Number(durationHours) <= 0) {
      toast.error("Duration must be at least 1 hour.");
      return;
    }

    const cleanIncluded = includedAmenities
      .filter((item) => item.name && item.name.trim())
      .map((item) => ({ name: item.name.trim(), description: item.description?.trim() || "" }));

    const cleanOptional = optionalAddOns
      .filter((item) => item.name && item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        price: Number(item.price) || 0,
        description: item.description?.trim() || "",
      }));

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("spotId", selectedSpotId);
      formData.append("category", category);
      formData.append("durationHours", Number(durationHours));
      formData.append("price", Number(price));
      formData.append("maxGuests", Number(maxGuests) || 6);
      formData.append("isActive", isActive);
      formData.append("includedAmenities", JSON.stringify(cleanIncluded));
      formData.append("optionalAddOns", JSON.stringify(cleanOptional));

      if (isEditing) {
        formData.append("keepImages", JSON.stringify(existingImages));
      }

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      let response;
      if (isEditing) {
        response = await API.patch(`/experiences/${experienceToEdit._id}`, formData);
        toast.success("Experience package updated successfully!");
      } else {
        response = await API.post("/experiences", formData);
        toast.success("New experience package published successfully!");
      }

      if (onExperienceSaved) {
        onExperienceSaved(response.data?.data || response.data);
      }
      onClose();
    } catch (err) {
      console.error("Error saving experience:", err);
      toast.error(err.response?.data?.message || "Failed to save experience. Please try again.");
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
            <FaTag className="text-emerald-400 text-lg" />
            <h2 className="text-lg font-bold">
              {isEditing ? "Edit Experience Package" : "Create New Experience Package"}
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
          {/* 1. Underlying Plot Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <FaTree className="text-emerald-600" /> Host Plot Venue *
            </label>
            <select
              required
              value={selectedSpotId}
              onChange={(e) => handleSpotChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
            >
              <option value="" disabled>
                Select one of your plots for this experience
              </option>
              {ownerSpots.map((spot) => (
                <option key={spot._id} value={spot._id}>
                  {spot.title} ({spot.location}) — Base: ₹{spot.price}/hr
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              The experience inherits this plot’s location, terrain, and calendar availability.
            </span>
          </div>

          {/* 2. Title & Category */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Experience Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mountain Date or Friends' Escape"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Duration & Package Price */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Duration (Hours) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="48"
                placeholder="e.g. 4"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Package Price (₹ Total) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 2999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Max Guests
              </label>
              <input
                type="number"
                min="1"
                max="50"
                placeholder="e.g. 6"
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 4. Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Experience Description *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Describe the mood, landscape, setup details, activities, and why guests will love this package..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* 5. Included Amenities Builder (Free with package) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaCheck className="text-emerald-600 text-xs" /> Included Amenities (Bundled Free)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items guests receive at zero additional cost (e.g. Bonfire, Dinner setup, Music).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddInclusion}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition"
              >
                <FaPlus size={9} /> Add Included Item
              </button>
            </div>

            <div className="space-y-2.5">
              {includedAmenities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Inclusion title (e.g. Bonfire Setup)"
                    value={item.name}
                    onChange={(e) => handleInclusionChange(idx, "name", e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Short description / details"
                    value={item.description}
                    onChange={(e) => handleInclusionChange(idx, "description", e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Optional Paid Add-Ons Builder */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaPlus className="text-emerald-600 text-xs" /> Optional Paid Add-Ons
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extra upgrades guests can add during checkout (e.g. BBQ Kit, Fondue, Guitarist).
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddOptional}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition"
              >
                <FaPlus size={9} /> Add Optional Upgrade
              </button>
            </div>

            <div className="space-y-2.5">
              {optionalAddOns.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add-on title (e.g. Gourmet Fondue)"
                    value={item.name}
                    onChange={(e) => handleOptionalChange(idx, "name", e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => handleOptionalChange(idx, "price", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-6 pr-2 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) => handleOptionalChange(idx, "description", e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOptional(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Photos Section */}
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FaImages className="text-emerald-500" /> Package Photos ({existingImages.length + selectedFiles.length}/{MAX_FILES})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload custom package photos or leave empty to use your plot’s existing photos.
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {existingImages.map((img, idx) => (
                <div key={`existing-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200">
                  <img src={getImageUrl(img)} alt="Existing" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow transition opacity-90 group-hover:opacity-100"
                  >
                    <FaTrash size={9} />
                  </button>
                </div>
              ))}

              {filePreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden border border-emerald-300">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow transition opacity-90 group-hover:opacity-100"
                  >
                    <FaTrash size={9} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Active Status Toggle */}
          <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 block">Experience Status</span>
              <span className="text-xs text-slate-500">
                {isActive ? "Experience is active and visible to travelers" : "Experience is disabled/hidden from discovery"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-slate-200 px-6 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-8 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving Experience...
                </>
              ) : (
                <>
                  <FaCheckCircle /> {isEditing ? "Update Package" : "Publish Experience"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ExperienceManageModal;
