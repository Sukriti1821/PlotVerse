import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaTag,
  FaImages,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaPowerOff,
  FaSpinner,
  FaEye,
  FaInfoCircle,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import SpotManageModal from "../components/owner/SpotManageModal";
import IcalSyncModal from "../components/owner/IcalSyncModal";
import { FiCalendar } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl, PLACEHOLDER_IMAGE } from "../utils/imageHelper";

const OwnerSpots = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'

  // Modal states
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [spotToEdit, setSpotToEdit] = useState(null);
  const [icalSpot, setIcalSpot] = useState(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [spotToDelete, setSpotToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Quick toggle status loading id
  const [toggleLoadingId, setToggleLoadingId] = useState(null);

  const fetchOwnerSpots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/spots/owner/me");
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setSpots(data);
    } catch (err) {
      console.error("Error loading owner spots:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load your listings. Please ensure you are logged in as a host."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerSpots();
  }, [user]);

  // Filtered spots
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const matchesSearch =
        !searchTerm ||
        spot.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spot.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const isActive = spot.isActive !== false;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && isActive) ||
        (filterStatus === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [spots, searchTerm, filterStatus]);

  // Stats calculation
  const totalCount = spots.length;
  const activeCount = spots.filter((s) => s.isActive !== false).length;
  const inactiveCount = spots.filter((s) => s.isActive === false).length;

  // Open Edit Modal
  const handleOpenEdit = (spot) => {
    setSpotToEdit(spot);
    setIsManageModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSpotToEdit(null);
    setIsManageModalOpen(true);
  };

  // Callback when spot is created or updated
  const handleSpotSaved = (savedSpot) => {
    if (!savedSpot || !savedSpot._id) {
      fetchOwnerSpots();
      return;
    }

    setSpots((prev) => {
      const exists = prev.some((s) => s._id === savedSpot._id);
      if (exists) {
        return prev.map((s) => (s._id === savedSpot._id ? savedSpot : s));
      }
      return [savedSpot, ...prev];
    });
  };

  // Toggle active/inactive state
  const handleToggleActive = async (spot) => {
    const newStatus = !(spot.isActive !== false);
    try {
      setToggleLoadingId(spot._id);
      await API.patch(`/spots/${spot._id}`, {
        isActive: newStatus,
      });

      setSpots((prev) =>
        prev.map((s) => (s._id === spot._id ? { ...s, isActive: newStatus } : s))
      );

      toast.success(
        newStatus
          ? `Listing "${spot.title}" is now active and public.`
          : `Listing "${spot.title}" has been deactivated.`
      );
    } catch (err) {
      console.error("Error toggling spot status:", err);
      toast.error(
        err.response?.data?.message || "Failed to update listing status."
      );
    } finally {
      setToggleLoadingId(null);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (spot) => {
    setSpotToDelete(spot);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!spotToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const response = await API.delete(`/spots/${spotToDelete._id}`);

      toast.success(
        response.data?.message || `Listing "${spotToDelete.title}" deleted.`
      );

      // If soft-deleted, update status in state; if hard-deleted, remove from state
      if (response.data?.softDeleted) {
        setSpots((prev) =>
          prev.map((s) =>
            s._id === spotToDelete._id ? { ...s, isActive: false } : s
          )
        );
      } else {
        setSpots((prev) => prev.filter((s) => s._id !== spotToDelete._id));
      }

      setDeleteModalOpen(false);
      setSpotToDelete(null);
    } catch (err) {
      console.error("Error deleting spot:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to delete listing. Please try again.";
      setDeleteError(errorMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Deactivate instead (fallback when delete is blocked by active bookings)
  const handleDeactivateInstead = async () => {
    if (!spotToDelete) return;
    try {
      setDeleteLoading(true);
      await API.patch(`/spots/${spotToDelete._id}`, {
        isActive: false,
      });

      setSpots((prev) =>
        prev.map((s) =>
          s._id === spotToDelete._id ? { ...s, isActive: false } : s
        )
      );

      toast.success(
        `Listing "${spotToDelete.title}" was deactivated. Active reservations remain safe!`
      );
      setDeleteModalOpen(false);
      setSpotToDelete(null);
    } catch (err) {
      console.error("Error deactivating spot:", err);
      toast.error(err.response?.data?.message || "Failed to deactivate listing.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header & Stats Banner */}
        <section className="bg-slate-950 text-white pt-12 pb-16 px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
                  <FaTag size={10} /> Host Property Hub
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  My Spot Listings
                </h1>
                <p className="mt-1.5 text-sm text-slate-400 max-w-xl">
                  Manage your nature retreats, update base hourly rates, customize amenities, and toggle listing visibility.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Link
                  to="/owner/experiences"
                  className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  Experiences
                </Link>
                <Link
                  to="/owner/bookings"
                  className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition"
                >
                  Reservations
                </Link>
                <Link
                  to="/owner/analytics"
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                >
                  📊 Analytics
                </Link>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition hover:-translate-y-0.5 cursor-pointer"
                >
                  <FaPlus size={12} /> Add New Listing
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800 max-w-2xl">
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Listings</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-white mt-1">{totalCount}</p>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-emerald-950/40">
                <p className="text-xs uppercase font-bold tracking-wider text-emerald-400">Active & Public</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-emerald-400 mt-1">{activeCount}</p>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-amber-950/40">
                <p className="text-xs uppercase font-bold tracking-wider text-amber-400">Deactivated</p>
                <p className="text-2xl lg:text-3xl font-extrabold text-amber-400 mt-1">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search by title, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                <FaFilter size={11} /> Filter:
              </span>
              {[
                { id: "all", label: `All (${totalCount})` },
                { id: "active", label: `Active (${activeCount})` },
                { id: "inactive", label: `Deactivated (${inactiveCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    filterStatus === f.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <FaSpinner className="animate-spin text-3xl text-emerald-600 mb-3" />
              <p className="text-sm font-medium">Loading your listings...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center max-w-lg mx-auto my-12">
              <FaExclamationTriangle className="text-rose-500 text-3xl mx-auto mb-2" />
              <h3 className="text-base font-bold text-rose-800 mb-1">Failed to Load Listings</h3>
              <p className="text-xs text-rose-600 mb-4">{error}</p>
              <button
                onClick={fetchOwnerSpots}
                className="rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-500 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredSpots.length === 0 && (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-100">
                <FaTag />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchTerm || filterStatus !== "all"
                  ? "No matching spot listings"
                  : "No listings published yet"}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {searchTerm || filterStatus !== "all"
                  ? "Try clearing your filters or changing your search terms."
                  : "Start sharing your scenic plots, campgrounds, and retreats with verified travelers."}
              </p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <FaPlus size={12} /> Create Your First Listing
              </button>
            </div>
          )}

          {/* Spot Listings Grid */}
          {!loading && !error && filteredSpots.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpots.map((spot) => {
                const isActive = spot.isActive !== false;
                const primaryImage = spot.images?.[0] || spot.image;
                const imageUrl = getImageUrl(primaryImage);
                const amenitiesCount = spot.amenities?.length || 0;
                const imagesCount = (spot.images?.length || (spot.image ? 1 : 0));

                return (
                  <motion.div
                    key={spot._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`group rounded-3xl border bg-white shadow-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                      isActive
                        ? "border-slate-200"
                        : "border-slate-300 bg-slate-50/70 opacity-90"
                    }`}
                  >
                    <div>
                      {/* Image Thumbnail & Overlays */}
                      <div className="relative h-52 bg-slate-200 overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={spot.title}
                          loading="lazy"
                          decoding="async"
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            !isActive ? "grayscale-[40%]" : ""
                          }`}
                          onError={(e) => {
                            e.target.src = PLACEHOLDER_IMAGE;
                          }}
                        />

                        {/* Category badge */}
                        <div className="absolute top-3.5 left-3.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                          {spot.category || "Scenic Spot"}
                        </div>

                        {/* Status Badge */}
                        <div className="absolute top-3.5 right-3.5">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow">
                              <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow">
                              <span className="h-2 w-2 rounded-full bg-amber-200" /> Deactivated
                            </span>
                          )}
                        </div>

                        {/* Photos count pill */}
                        <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                          <FaImages size={11} /> {imagesCount} {imagesCount === 1 ? "photo" : "photos"}
                        </div>

                        {/* Preview on site button */}
                        {isActive && (
                          <Link
                            to={`/plot/${spot._id}`}
                            target="_blank"
                            title="Preview public listing"
                            className="absolute bottom-3 right-3.5 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md p-2 text-slate-800 text-xs font-bold shadow hover:bg-white transition"
                          >
                            <FaEye size={12} />
                          </Link>
                        )}
                      </div>

                      {/* Details Section */}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {spot.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 mb-3">
                          <FaMapMarkerAlt className="text-emerald-600 flex-shrink-0" />
                          <span className="line-clamp-1">{spot.location}</span>
                        </div>

                        {/* Base Price */}
                        <div className="flex items-baseline gap-1.5 border-t border-slate-100 pt-3">
                          <span className="text-xl font-extrabold text-emerald-600">
                            ₹{Number(spot.price).toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-slate-500">/ hour base rate</span>
                        </div>

                        {/* Amenities preview */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {amenitiesCount > 0 ? (
                            spot.amenities.slice(0, 3).map((a, i) => (
                              <span
                                key={i}
                                className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                              >
                                {a.name || a.title || "Amenity"} (₹{a.hourlyPrice || a.price}/hr)
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No custom add-ons</span>
                          )}
                          {amenitiesCount > 3 && (
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                              +{amenitiesCount - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between gap-2">
                      {/* Toggle Active / Deactivate */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(spot)}
                        disabled={toggleLoadingId === spot._id}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isActive
                            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                        title={isActive ? "Deactivate listing" : "Activate listing"}
                      >
                        {toggleLoadingId === spot._id ? (
                          <FaSpinner className="animate-spin text-xs" />
                        ) : (
                          <FaPowerOff size={11} />
                        )}
                        {isActive ? "Deactivate" : "Activate"}
                      </button>

                      {/* Right Action buttons: iCal Sync, Edit & Delete */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIcalSpot(spot)}
                          className="flex items-center gap-1.5 rounded-xl border border-mist bg-white hover:border-navy text-navy px-3 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                          title="Two-way iCalendar Sync with Airbnb / Google"
                        >
                          <FiCalendar className="text-saffron-text" size={12} /> Sync iCal
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(spot)}
                          className="flex items-center gap-1.5 rounded-xl bg-navy text-white px-3.5 py-2 text-xs font-bold hover:bg-navy-deep transition shadow-sm cursor-pointer"
                        >
                          <FaEdit size={11} /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(spot)}
                          className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 text-xs font-bold transition cursor-pointer"
                          title="Delete Listing"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Spot Creation & Edit Modal */}
      <SpotManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        spotToEdit={spotToEdit}
        onSpotSaved={handleSpotSaved}
      />

      {/* Two-Way iCalendar (.ics) Sync Modal */}
      <IcalSyncModal
        isOpen={!!icalSpot}
        onClose={() => setIcalSpot(null)}
        spot={icalSpot}
      />

      {/* Delete / Deactivate Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && spotToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-lg flex-shrink-0">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete Spot Listing
                  </h3>
                  <p className="text-xs text-slate-500">
                    Irreversible or semi-irreversible action
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-bold text-slate-900">
                  "{spotToDelete.title}"
                </span>
                ?
              </p>

              {/* Conflict / Active Bookings Warning */}
              {deleteError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-2.5 text-rose-800">
                    <FaInfoCircle className="text-rose-600 flex-shrink-0 mt-0.5 text-sm" />
                    <div className="text-xs">
                      <p className="font-bold text-rose-900 mb-1">Deletion Blocked</p>
                      <p className="leading-relaxed">{deleteError}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-rose-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleDeactivateInstead}
                      disabled={deleteLoading}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition flex items-center gap-1.5 shadow"
                    >
                      {deleteLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaPowerOff size={10} />
                      )}
                      Deactivate Listing Instead
                    </button>
                  </div>
                </div>
              )}

              {!deleteError && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100 flex items-start gap-2">
                  <FaInfoCircle className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>
                    If this listing has past bookings, it will be safely soft-deleted and archived so your historical guest records are never orphaned.
                  </span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSpotToDelete(null);
                    setDeleteError(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash size={11} /> Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default OwnerSpots;
