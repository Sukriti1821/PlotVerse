import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaBullhorn,
  FaPlus,
  FaTrash,
  FaTag,
  FaCopy,
  FaStar,
  FaSpinner,
  FaRocket,
  FaTimes,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import HostNavHeader from "../components/owner/HostNavHeader";
import API from "../services/api";

const OwnerPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [spots, setSpots] = useState([]);
  const [metrics, setMetrics] = useState({
    activePromosCount: 0,
    totalUses: 0,
    featuredSpotsCount: 0,
    totalSpotsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [selectedSpotForFeature, setSelectedSpotForFeature] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    promoType: "coupon_code",
    discountType: "percentage",
    discountValue: 15,
    applicableType: "all",
    applicableSpot: "",
    minBookingValue: 0,
    usageLimit: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    advanceNoticeDays: 7,
    bannerText: "",
    allowStacking: false,
  });

  // Feature spot form state
  const [featureData, setFeatureData] = useState({
    durationDays: 14,
    tier: "spotlight",
    sponsoredBadge: "Featured Retreat",
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await API.get("/promotions/owner");
      if (response.data?.success) {
        setPromotions(response.data.data?.promotions || []);
        setSpots(response.data.data?.spots || []);
        setMetrics(response.data.data?.metrics || {});
      }
    } catch (err) {
      console.error("Error loading promotions:", err);
      toast.error(err.response?.data?.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Toggle active status
  const handleToggleActive = async (promoId) => {
    try {
      setActionLoadingId(promoId);
      const response = await API.patch(`/promotions/${promoId}/toggle`);
      const updated = response.data?.data;
      setPromotions((prev) =>
        prev.map((p) => (p._id === promoId ? { ...p, isActive: updated.isActive } : p))
      );
      toast.success(response.data?.message || "Promotion status updated");
    } catch (err) {
      console.error("Error toggling promotion:", err);
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete promotion
  const handleDeletePromo = async (promoId) => {
    if (!window.confirm("Are you sure you want to delete this promotion? This action cannot be undone.")) {
      return;
    }

    try {
      setActionLoadingId(promoId);
      await API.delete(`/promotions/${promoId}`);
      setPromotions((prev) => prev.filter((p) => p._id !== promoId));
      toast.success("Promotion deleted successfully");
    } catch (err) {
      console.error("Error deleting promotion:", err);
      toast.error(err.response?.data?.message || "Failed to delete promotion");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.info(`Code "${code}" copied to clipboard!`);
  };

  // Submit new promotion
  const handleCreatePromoSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoadingId("create");
      const payload = {
        ...formData,
        code: formData.code?.trim().toUpperCase(),
        discountValue: Number(formData.discountValue),
        minBookingValue: Number(formData.minBookingValue) || 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        advanceNoticeDays: Number(formData.advanceNoticeDays) || 7,
      };

      const res = await API.post("/promotions", payload);
      toast.success(res.data?.message || "Promotion created successfully!");
      setIsCreateModalOpen(false);
      // Reset form
      setFormData({
        title: "",
        code: "",
        promoType: "coupon_code",
        discountType: "percentage",
        discountValue: 15,
        applicableType: "all",
        applicableSpot: "",
        minBookingValue: 0,
        usageLimit: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        advanceNoticeDays: 7,
        bannerText: "",
        allowStacking: false,
      });
      fetchPromotions();
    } catch (err) {
      console.error("Error creating promotion:", err);
      toast.error(err.response?.data?.message || "Failed to create promotion");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit featured listing sponsorship
  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSpotForFeature) return;

    try {
      setActionLoadingId("feature");
      const res = await API.post(`/promotions/spot/${selectedSpotForFeature._id}/feature`, {
        isFeatured: true,
        durationDays: featureData.durationDays,
        tier: featureData.tier,
        sponsoredBadge: featureData.sponsoredBadge,
      });

      toast.success(res.data?.message || "Spot featured successfully!");
      setIsFeatureModalOpen(false);
      setSelectedSpotForFeature(null);
      fetchPromotions();
    } catch (err) {
      console.error("Error featuring spot:", err);
      toast.error(err.response?.data?.message || "Failed to update featured status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove featured status
  const handleRemoveFeature = async (spot) => {
    if (!window.confirm(`Remove featured status from "${spot.title}"?`)) return;

    try {
      setActionLoadingId(`remove-feature-${spot._id}`);
      await API.post(`/promotions/spot/${spot._id}/feature`, {
        isFeatured: false,
      });
      toast.info(`Featured status removed from "${spot.title}"`);
      fetchPromotions();
    } catch (err) {
      console.error("Error removing feature:", err);
      toast.error("Failed to remove featured status");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Shared Host Nav Header */}
        <HostNavHeader
          title="Landowner Growth & Promotions"
          subtitle="Supercharge your bookings, reward returning guests, run limited-time flash deals, and sponsor featured listings."
          badge="Growth Tools"
          actions={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-xs font-bold shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 cursor-pointer"
            >
              <FaPlus size={12} /> + Create New Promotion
            </button>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* KPI Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>ACTIVE PROMOTIONS</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FaTag size={13} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.activePromosCount || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Live coupons, early-birds & deals
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>BOOKINGS DRIVEN</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FaRocket size={13} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.totalUses || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Times promotions were redeemed
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>FEATURED LISTINGS</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <FaStar size={13} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {metrics.featuredSpotsCount || 0} / {metrics.totalSpotsCount || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Highlighted with homepage spotlight
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>GROWTH STRATEGY</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <FaBullhorn size={13} />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                Multi-Channel Boost
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Early-bird + coupons + banners
              </p>
            </div>
          </section>

          {/* Section 1: Active Promotions Table / Cards */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Discount Codes & Custom Offers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Coupon codes, early-bird rewards, loyalty discounts, and promotional banners
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition cursor-pointer self-start"
              >
                <FaPlus size={10} /> Add Offer
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <FaSpinner className="animate-spin text-emerald-600 text-2xl" />
              </div>
            ) : promotions.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center my-4">
                <FaTag className="mx-auto text-slate-300 text-3xl mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Promotions Created Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Create a promo code like "SUMMER15" or set an early-bird booking reward to increase conversion by up to 25%!
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Create First Promotion
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {promotions.map((promo) => {
                  const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                  const isMaxedOut =
                    typeof promo.usageLimit === "number" &&
                    promo.usageLimit > 0 &&
                    promo.timesUsed >= promo.usageLimit;

                  return (
                    <div
                      key={promo._id}
                      className={`rounded-2xl p-4 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        !promo.isActive
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : isExpired || isMaxedOut
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-white border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {promo.code && (
                            <button
                              onClick={() => handleCopyCode(promo.code)}
                              title="Click to copy code"
                              className="inline-flex items-center gap-1.5 bg-slate-900 text-emerald-400 px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase shadow-xs hover:bg-slate-800 transition cursor-pointer"
                            >
                              <span>{promo.code}</span>
                              <FaCopy size={10} className="text-slate-400" />
                            </button>
                          )}

                          <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                            {promo.promoType.replace(/_/g, " ")}
                          </span>

                          <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {promo.discountType === "percentage"
                              ? `${promo.discountValue}% OFF`
                              : `₹${promo.discountValue} OFF`}
                          </span>

                          {promo.minBookingValue > 0 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Min ₹{promo.minBookingValue.toLocaleString()}
                            </span>
                          )}

                          {isExpired && (
                            <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-800">
                              Expired
                            </span>
                          )}
                          {isMaxedOut && (
                            <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800">
                              Cap Reached
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm">{promo.title}</h4>

                        {promo.bannerText && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1 mt-1 inline-block">
                            📢 {promo.bannerText}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                          <span>
                            Target:{" "}
                            <strong>
                              {promo.applicableType === "all"
                                ? "All Listings"
                                : promo.applicableSpot?.title || "Specific Plot"}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Used: <strong>{promo.timesUsed}</strong>
                            {promo.usageLimit ? ` / ${promo.usageLimit}` : " (Unlimited)"}
                          </span>
                          {promo.endDate && (
                            <>
                              <span>•</span>
                              <span>
                                Valid until:{" "}
                                <strong>{new Date(promo.endDate).toLocaleDateString()}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleActive(promo._id)}
                          disabled={actionLoadingId === promo._id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            promo.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {actionLoadingId === promo._id ? (
                            <FaSpinner className="animate-spin text-xs" />
                          ) : promo.isActive ? (
                            "Active"
                          ) : (
                            "Paused"
                          )}
                        </button>

                        <button
                          onClick={() => handleDeletePromo(promo._id)}
                          disabled={actionLoadingId === promo._id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete promotion"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Featured Listings Sponsorship Manager */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                  <FaStar size={10} /> Visibility Boost
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Featured Listing Sponsorships
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Promote your properties to the top of catalog searches and the Thikana homepage carousel
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spots.map((spot) => {
                const isFeatured = spot.isFeatured || spot.featuredConfig?.isFeatured;
                const featuredUntil = spot.featuredConfig?.featuredUntil;
                const isExpired = featuredUntil && new Date(featuredUntil) < new Date();

                return (
                  <div
                    key={spot._id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isFeatured && !isExpired
                        ? "bg-amber-50/40 border-amber-300 shadow-sm"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900 line-clamp-1">
                        {spot.title}
                      </span>
                      {isFeatured && !isExpired ? (
                        <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                          {spot.featuredConfig?.sponsoredBadge || "Featured"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">{spot.location}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                      <span className="font-extrabold text-slate-700">₹{spot.price}/hr</span>

                      {isFeatured && !isExpired ? (
                        <button
                          onClick={() => handleRemoveFeature(spot)}
                          className="text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer"
                        >
                          Remove Feature
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSpotForFeature(spot);
                            setIsFeatureModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer text-xs shadow-xs"
                        >
                          <FaStar size={10} /> Feature Listing
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* CREATE PROMOTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Promotion</h3>
                <p className="text-xs text-slate-500">Configure your discount or promotional banner</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreatePromoSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Promotion Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Weekend Flash 20% Off"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Promotion Type *</label>
                  <select
                    value={formData.promoType}
                    onChange={(e) => setFormData({ ...formData, promoType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600 bg-white"
                  >
                    <option value="coupon_code">Coupon Code (Checkout)</option>
                    <option value="early_bird">Early-Bird Advance Booking</option>
                    <option value="repeat_customer">Repeat Customer Loyalty</option>
                    <option value="limited_time_deal">Limited-Time Flash Deal</option>
                    <option value="banner_announcement">Listing Announcement Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Promo Code {formData.promoType === "coupon_code" && "*"}
                  </label>
                  <input
                    type="text"
                    required={formData.promoType === "coupon_code"}
                    placeholder="e.g. RETREAT20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 uppercase font-black focus:outline-emerald-600"
                  />
                </div>
              </div>

              {formData.promoType !== "banner_announcement" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Discount Type *</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600 bg-white"
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Discount Value ({formData.discountType === "percentage" ? "%" : "₹"}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={formData.discountType === "percentage" ? "90" : "10000"}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* Target Property */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Applicable Target</label>
                  <select
                    value={formData.applicableType}
                    onChange={(e) => setFormData({ ...formData, applicableType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600 bg-white"
                  >
                    <option value="all">All My Properties</option>
                    <option value="spot">Specific Property</option>
                  </select>
                </div>

                {formData.applicableType === "spot" && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Property</label>
                    <select
                      value={formData.applicableSpot}
                      onChange={(e) => setFormData({ ...formData, applicableSpot: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600 bg-white"
                      required
                    >
                      <option value="">Select plot...</option>
                      {spots.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Booking limits & dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Min Booking Subtotal (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={formData.minBookingValue}
                    onChange={(e) => setFormData({ ...formData, minBookingValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Usage Limit (Total uses)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {formData.promoType === "early_bird" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Advance Notice Required (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.advanceNoticeDays}
                    onChange={(e) => setFormData({ ...formData, advanceNoticeDays: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Guests booking at least {formData.advanceNoticeDays} days before the reservation date receive this reward.
                  </p>
                </div>
              )}

              {/* Optional Announcement Banner */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Promotional Banner Announcement (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🔥 Weekend Deal: Complimentary firewood with all bonfire stays!"
                  value={formData.bannerText}
                  onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                />
              </div>

              {/* End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "create"}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === "create" ? "Saving..." : "Save Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEATURE LISTING MODAL */}
      {isFeatureModalOpen && selectedSpotForFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Feature Property</h3>
                <p className="text-xs text-slate-500">{selectedSpotForFeature.title}</p>
              </div>
              <button
                onClick={() => setIsFeatureModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleFeatureSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sponsorship Duration</label>
                <select
                  value={featureData.durationDays}
                  onChange={(e) => setFeatureData({ ...featureData, durationDays: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-amber-500 bg-white"
                >
                  <option value={7}>7 Days Spotlight</option>
                  <option value={14}>14 Days Spotlight (Recommended)</option>
                  <option value={30}>30 Days Spotlight</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Spotlight Tier</label>
                <select
                  value={featureData.tier}
                  onChange={(e) => setFeatureData({ ...featureData, tier: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-amber-500 bg-white"
                >
                  <option value="spotlight">Spotlight (Homepage Carousel + Search Top)</option>
                  <option value="premium">Premium (Search Category Hero)</option>
                  <option value="standard">Standard (Featured Badge)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Sponsored Badge Label</label>
                <input
                  type="text"
                  value={featureData.sponsoredBadge}
                  onChange={(e) => setFeatureData({ ...featureData, sponsoredBadge: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-amber-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-medium">
                💡 Featured listings experience up to 3.4x more traveler clicks and rank at the top of category discovery.
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "feature"}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === "feature" ? "Activating..." : "Activate Spotlight"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OwnerPromotions;
