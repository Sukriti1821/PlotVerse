import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaShieldAlt,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaMapMarkerAlt,
  FaTree,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaSlidersH,
  FaSyncAlt,
  FaEye,
  FaBan,
  FaCheck,
  FaFileInvoiceDollar,
  FaPercent,
  FaArrowUp,
  FaArrowDown,
  FaStore,
  FaClock,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview | owners | spots | bookings | payouts | settings
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [owners, setOwners] = useState([]);
  const [spots, setSpots] = useState([]);
  const [spotsTotalCount, setSpotsTotalCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [bookingsTotalCount, setBookingsTotalCount] = useState(0);
  const [payoutsData, setPayoutsData] = useState(null);
  const [settings, setSettings] = useState({ defaultCommissionRate: 10, requireOwnerApproval: false });

  // Filters & Search states
  const [ownerSearch, setOwnerSearch] = useState("");
  const [spotSearch, setSpotSearch] = useState("");
  const [spotStatusFilter, setSpotStatusFilter] = useState("all");
  const [spotPage, setSpotPage] = useState(1);

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState("all");
  const [bookingPayoutFilter, setBookingPayoutFilter] = useState("all");
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [bookingPage, setBookingPage] = useState(1);

  // Settings form
  const [commissionInput, setCommissionInput] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);
  const [runningBackfill, setRunningBackfill] = useState(false);

  // Modals
  const [selectedOwnerForSpots, setSelectedOwnerForSpots] = useState(null);
  const [ownerSpotsList, setOwnerSpotsList] = useState([]);
  const [loadingOwnerSpots, setLoadingOwnerSpots] = useState(false);

  const [ownerToSuspend, setOwnerToSuspend] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [processingOwnerId, setProcessingOwnerId] = useState(null);

  const [spotToModerate, setSpotToModerate] = useState(null);
  const [moderationReason, setModerationReason] = useState("");
  const [processingSpotId, setProcessingSpotId] = useState(null);

  const [settlementOwner, setSettlementOwner] = useState(null);
  const [selectedBookingIdsToSettle, setSelectedBookingIdsToSettle] = useState([]);
  const [settlementNote, setSettlementNote] = useState("");
  const [settlementTxId, setSettlementTxId] = useState("");
  const [settlingPayout, setSettlingPayout] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      toast.error("Failed to load dashboard metrics");
    }
  };

  // Fetch Owners
  const fetchOwners = async () => {
    try {
      const params = {};
      if (ownerSearch.trim()) params.search = ownerSearch.trim();
      const res = await API.get("/admin/owners", { params });
      if (res.data?.success) {
        setOwners(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching owners:", err);
      toast.error("Failed to load hosts list");
    }
  };

  // Fetch Spots
  const fetchSpots = async () => {
    try {
      const params = {
        page: spotPage,
        limit: 12,
        status: spotStatusFilter,
      };
      if (spotSearch.trim()) params.search = spotSearch.trim();

      const res = await API.get("/admin/spots", { params });
      if (res.data?.success) {
        setSpots(res.data.data);
        setSpotsTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error fetching spots:", err);
      toast.error("Failed to load spots moderation list");
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      const params = {
        page: bookingPage,
        limit: 15,
        status: bookingStatusFilter,
        paymentStatus: bookingPaymentFilter,
        payoutStatus: bookingPayoutFilter,
      };
      if (bookingSearch.trim()) params.search = bookingSearch.trim();
      if (bookingStartDate) params.startDate = bookingStartDate;
      if (bookingEndDate) params.endDate = bookingEndDate;

      const res = await API.get("/admin/bookings", { params });
      if (res.data?.success) {
        setBookings(res.data.data);
        setBookingsTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load bookings");
    }
  };

  // Fetch Payouts
  const fetchPayouts = async () => {
    try {
      const res = await API.get("/admin/payouts");
      if (res.data?.success) {
        setPayoutsData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
      toast.error("Failed to load payout settlements");
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await API.get("/admin/settings");
      if (res.data?.success) {
        setSettings(res.data.data);
        setCommissionInput(res.data.data.defaultCommissionRate ?? 10);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchOwners(),
        fetchSpots(),
        fetchBookings(),
        fetchPayouts(),
        fetchSettings(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Tab change handlers & refresher
  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "overview") await fetchStats();
    if (activeTab === "owners") await fetchOwners();
    if (activeTab === "spots") await fetchSpots();
    if (activeTab === "bookings") await fetchBookings();
    if (activeTab === "payouts") await fetchPayouts();
    if (activeTab === "settings") await fetchSettings();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  useEffect(() => {
    if (activeTab === "owners") fetchOwners();
  }, [ownerSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "spots") fetchSpots();
  }, [spotPage, spotStatusFilter, spotSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "bookings") fetchBookings();
  }, [bookingPage, bookingStatusFilter, bookingPaymentFilter, bookingPayoutFilter, bookingStartDate, bookingEndDate, bookingSearch, activeTab]);

  useEffect(() => {
    if (activeTab === "payouts") fetchPayouts();
  }, [activeTab]);

  // Handle View Owner Spots
  const handleOpenOwnerSpots = async (owner) => {
    setSelectedOwnerForSpots(owner);
    setLoadingOwnerSpots(true);
    try {
      const res = await API.get(`/admin/owners/${owner._id}/spots`);
      if (res.data?.success) {
        setOwnerSpotsList(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load listings for this host");
    } finally {
      setLoadingOwnerSpots(false);
    }
  };

  // Handle Suspend/Reactivate Owner
  const handleToggleOwnerStatus = async (owner, newSuspendedState) => {
    if (newSuspendedState && !ownerToSuspend) {
      setOwnerToSuspend(owner);
      setSuspensionReason("");
      return;
    }

    try {
      setProcessingOwnerId(owner._id);
      const res = await API.patch(`/admin/owners/${owner._id}/status`, {
        isSuspended: newSuspendedState,
        reason: newSuspendedState ? suspensionReason.trim() : "",
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setOwnerToSuspend(null);
        await Promise.all([fetchOwners(), fetchStats(), fetchSpots()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update host account status");
    } finally {
      setProcessingOwnerId(null);
    }
  };

  // Handle Moderate Spot
  const handleToggleSpotModeration = async (spot, newUnpublishState) => {
    if (newUnpublishState && !spotToModerate) {
      setSpotToModerate(spot);
      setModerationReason("");
      return;
    }

    try {
      setProcessingSpotId(spot._id);
      const res = await API.patch(`/admin/spots/${spot._id}/moderate`, {
        isUnpublishedByAdmin: newUnpublishState,
        reason: newUnpublishState ? moderationReason.trim() : "",
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setSpotToModerate(null);
        await Promise.all([fetchSpots(), fetchStats()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update spot moderation status");
    } finally {
      setProcessingSpotId(null);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    try {
      setSavingSettings(true);
      const res = await API.put("/admin/settings", {
        defaultCommissionRate: Number(commissionInput),
      });

      if (res.data?.success) {
        setSettings(res.data.data);
        toast.success(`Platform commission rate updated to ${res.data.data.defaultCommissionRate}%`);
        await fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Run Historical Backfill
  const handleRunBackfill = async () => {
    if (!window.confirm("Run historical commission calculation across past paid bookings? This ensures all existing reservations reflect the current platform commission rate.")) {
      return;
    }

    try {
      setRunningBackfill(true);
      const res = await API.post("/admin/migrate-backfill");
      if (res.data?.success) {
        toast.success(res.data.message);
        await Promise.all([fetchStats(), fetchPayouts(), fetchBookings()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Migration failed");
    } finally {
      setRunningBackfill(false);
    }
  };

  // Handle Open Settlement Modal
  const handleOpenSettlement = (ownerData) => {
    setSettlementOwner(ownerData);
    const pendingIds = (ownerData.bookings || [])
      .filter((b) => b.payoutStatus !== "paid")
      .map((b) => b._id);
    setSelectedBookingIdsToSettle(pendingIds);
    setSettlementNote(`Settlement for ${ownerData.owner?.name} - ${new Date().toLocaleDateString()}`);
    setSettlementTxId("");
  };

  // Handle Submit Settlement
  const handleSubmitSettlement = async () => {
    if (selectedBookingIdsToSettle.length === 0) {
      toast.warn("Please select at least one booking to settle");
      return;
    }

    try {
      setSettlingPayout(true);
      const res = await API.patch("/admin/payouts/mark-paid", {
        bookingIds: selectedBookingIdsToSettle,
        payoutNote: settlementNote.trim(),
        payoutTransactionId: settlementTxId.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setSettlementOwner(null);
        await Promise.all([fetchPayouts(), fetchStats(), fetchBookings()]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark payouts as paid");
    } finally {
      setSettlingPayout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <div>
        <Navbar />

        {/* Executive Admin Banner Header */}
        <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-200 uppercase tracking-wider backdrop-blur-sm">
                    <FaShieldAlt className="text-emerald-400" /> Thikana Operations
                  </span>
                  <span className="text-xs text-slate-300">
                    Live Platform Control Center
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
                  Super Admin Console
                </h1>
                <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
                  Centralized platform oversight: Host management, listing moderation, booking transactions, commission controls, and owner payout settlements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-sm cursor-pointer disabled:opacity-50"
                  title="Refresh Dashboard Data"
                >
                  <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>

                <div className="rounded-xl bg-emerald-950/60 border border-emerald-500/20 px-4 py-2 text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                    Global Commission
                  </span>
                  <span className="text-lg font-black text-white">
                    {settings.defaultCommissionRate ?? 10}%
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs font-bold">
              {[
                { id: "overview", label: "Dashboard Overview", icon: FaShieldAlt },
                { id: "owners", label: `Hosts & Owners (${owners.length})`, icon: FaUsers },
                { id: "spots", label: `Spot Moderation (${spotsTotalCount || spots.length})`, icon: FaTree },
                { id: "bookings", label: `Bookings Oversight (${bookingsTotalCount || bookings.length})`, icon: FaCalendarCheck },
                { id: "payouts", label: "Payout Settlements", icon: FaMoneyBillWave },
                { id: "settings", label: "Commission & Settings", icon: FaSlidersH },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition cursor-pointer ${
                      isSelected
                        ? "bg-white text-emerald-900 shadow-md font-extrabold"
                        : "text-emerald-100/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className={isSelected ? "text-emerald-600" : "text-emerald-300"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <FaSpinner className="animate-spin text-4xl text-emerald-600" />
              <p className="text-sm font-semibold text-slate-500">Loading platform management data...</p>
            </div>
          ) : (
            <div>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Total Owners */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Hosts</span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <FaUsers size={14} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          {stats?.totalOwners ?? 0}
                        </span>
                        {stats?.suspendedOwners > 0 && (
                          <span className="text-[11px] font-semibold text-rose-600">
                            ({stats.suspendedOwners} suspended)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Verified land providers</p>
                    </div>

                    {/* Total Customers */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Guests</span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FaUserCheck size={14} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-slate-900">
                          {stats?.totalCustomers ?? 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Registered travelers</p>
                    </div>

                    {/* Total Spots */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Spots Listed</span>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <FaTree size={14} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          {stats?.spots?.total ?? 0}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          ({stats?.spots?.active ?? 0} live)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {stats?.spots?.unpublishedByAdmin ?? 0} admin-flagged
                      </p>
                    </div>

                    {/* Total Bookings */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <FaCalendarCheck size={14} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                          {stats?.bookings?.total ?? 0}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          ({stats?.bookings?.confirmed ?? 0} confirmed)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {stats?.bookings?.pending ?? 0} pending review
                      </p>
                    </div>

                    {/* Platform Revenue */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="text-xs font-bold uppercase tracking-wider">Commission Earned</span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <FaPercent size={12} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-emerald-700">
                          ₹{(stats?.financials?.totalPlatformRevenue ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600/80 mt-1">
                        From ₹{(stats?.financials?.totalGrossVolume ?? 0).toLocaleString()} volume
                      </p>
                    </div>

                    {/* Pending Host Payouts */}
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs transition hover:shadow-md">
                      <div className="flex items-center justify-between text-amber-800">
                        <span className="text-xs font-bold uppercase tracking-wider">Payouts Due</span>
                        <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                          <FaMoneyBillWave size={12} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-black text-amber-800">
                          ₹{(stats?.financials?.totalOwnerPayoutsPending ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">
                        ₹{(stats?.financials?.totalOwnerPayoutsPaid ?? 0).toLocaleString()} already settled
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Banner */}
                  <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                        ⭐ Active Policy
                      </span>
                      <h3 className="text-lg font-bold">
                        Global Platform Commission is set at {settings.defaultCommissionRate}%
                      </h3>
                      <p className="text-xs text-emerald-100 max-w-xl">
                        On all verified guest payments, {settings.defaultCommissionRate}% is automatically retained by Thikana and {100 - settings.defaultCommissionRate}% is allocated for host payouts.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition cursor-pointer"
                      >
                        Adjust Commission Rate
                      </button>
                      <button
                        onClick={() => setActiveTab("payouts")}
                        className="rounded-xl bg-emerald-950/40 border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-950/60 transition cursor-pointer"
                      >
                        View Pending Payouts
                      </button>
                    </div>
                  </div>

                  {/* Recent Bookings Feed */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Recent Platform Reservations</h2>
                        <p className="text-xs text-slate-500">Live transaction stream across customer bookings</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("bookings")}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                      >
                        View All Bookings →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                            <th className="pb-3">Spot & Location</th>
                            <th className="pb-3">Guest</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Total Volume</th>
                            <th className="pb-3">Commission ({settings.defaultCommissionRate}%)</th>
                            <th className="pb-3">Host Share</th>
                            <th className="pb-3">Payment</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(stats?.recentBookings || []).map((b) => (
                            <tr key={b._id} className="hover:bg-slate-50/60 transition">
                              <td className="py-3 pr-4">
                                <p className="font-bold text-slate-800 line-clamp-1">{b.spot?.title || "Spot Reservation"}</p>
                                <p className="text-[11px] text-slate-400">{b.spot?.location || "India"}</p>
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-semibold text-slate-800">{b.user?.name || "Guest"}</p>
                                <p className="text-[11px] text-slate-400">{b.user?.email}</p>
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {new Date(b.date).toLocaleDateString()}
                              </td>
                              <td className="py-3 pr-4 font-bold text-slate-900">
                                ₹{b.totalPrice?.toLocaleString()}
                              </td>
                              <td className="py-3 pr-4 font-bold text-emerald-600">
                                ₹{(b.platformCommission || Math.round(b.totalPrice * 0.1)).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4 font-bold text-slate-700">
                                ₹{(b.ownerPayoutAmount || Math.round(b.totalPrice * 0.9)).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    b.paymentStatus === "paid"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {b.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                </span>
                              </td>
                              <td className="py-3">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    b.status === "confirmed"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : b.status === "approved"
                                      ? "bg-blue-100 text-blue-800"
                                      : b.status === "pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OWNERS MANAGEMENT */}
              {activeTab === "owners" && (
                <div className="space-y-6">
                  {/* Search bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                      <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search hosts by name or email address..."
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-semibold self-center">
                      Showing {owners.length} registered host accounts
                    </span>
                  </div>

                  {/* Owners Table */}
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-bold">
                            <th className="py-4 px-6">Host / Landowner</th>
                            <th className="py-4 px-4">Account Status</th>
                            <th className="py-4 px-4">Spots Listed</th>
                            <th className="py-4 px-4">Paid Bookings</th>
                            <th className="py-4 px-4">Gross Revenue</th>
                            <th className="py-4 px-4">Commission Taken</th>
                            <th className="py-4 px-4">Pending Payout</th>
                            <th className="py-4 px-6 text-right">Admin Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {owners.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                No host accounts match your query.
                              </td>
                            </tr>
                          ) : (
                            owners.map((owner) => {
                              const isSuspended = owner.isSuspended;
                              return (
                                <tr key={owner._id} className="hover:bg-slate-50/50 transition">
                                  {/* Host Info */}
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                                        {owner.avatar ? (
                                          <img src={owner.avatar} alt={owner.name} className="h-full w-full object-cover" />
                                        ) : (
                                          owner.name?.[0] || "H"
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-bold text-slate-900">{owner.name}</p>
                                        <p className="text-[11px] text-slate-500">{owner.email}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          Joined {new Date(owner.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Status */}
                                  <td className="py-4 px-4">
                                    {isSuspended ? (
                                      <div className="space-y-1">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                                          <FaBan size={9} /> Suspended
                                        </span>
                                        {owner.suspensionReason && (
                                          <p className="text-[10px] text-rose-600 line-clamp-1" title={owner.suspensionReason}>
                                            {owner.suspensionReason}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                        <FaCheckCircle size={9} /> Active
                                      </span>
                                    )}
                                  </td>

                                  {/* Spots Count */}
                                  <td className="py-4 px-4">
                                    <span className="font-bold text-slate-800">{owner.spotsCount || 0}</span>
                                    <span className="text-[11px] text-slate-400 ml-1">
                                      ({owner.activeSpotsCount || 0} live)
                                    </span>
                                  </td>

                                  {/* Paid Bookings */}
                                  <td className="py-4 px-4 font-semibold text-slate-700">
                                    {owner.stats?.totalBookingsCount || 0}
                                  </td>

                                  {/* Gross */}
                                  <td className="py-4 px-4 font-bold text-slate-900">
                                    ₹{(owner.stats?.totalGross || 0).toLocaleString()}
                                  </td>

                                  {/* Commission */}
                                  <td className="py-4 px-4 font-bold text-emerald-600">
                                    ₹{(owner.stats?.totalCommission || 0).toLocaleString()}
                                  </td>

                                  {/* Pending Payout */}
                                  <td className="py-4 px-4 font-bold text-amber-700">
                                    ₹{(owner.stats?.totalPayoutsPending || 0).toLocaleString()}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleOpenOwnerSpots(owner)}
                                        className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer"
                                        title="View all spots listed by this host"
                                      >
                                        <FaEye className="inline mr-1" /> Spots
                                      </button>

                                      {isSuspended ? (
                                        <button
                                          disabled={processingOwnerId === owner._id}
                                          onClick={() => handleToggleOwnerStatus(owner, false)}
                                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-[11px] font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                        >
                                          {processingOwnerId === owner._id ? (
                                            <FaSpinner className="animate-spin inline" />
                                          ) : (
                                            "Reactivate"
                                          )}
                                        </button>
                                      ) : (
                                        <button
                                          disabled={processingOwnerId === owner._id}
                                          onClick={() => handleToggleOwnerStatus(owner, true)}
                                          className="rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                                        >
                                          Suspend
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SPOT MODERATION */}
              {activeTab === "spots" && (
                <div className="space-y-6">
                  {/* Filters bar */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                      <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search spots by title, category, or location..."
                        value={spotSearch}
                        onChange={(e) => {
                          setSpotSearch(e.target.value);
                          setSpotPage(1);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "All Spots" },
                        { id: "active", label: "Live & Active" },
                        { id: "flagged", label: "Admin Flagged / Unpublished" },
                        { id: "inactive", label: "Host Deactivated" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setSpotStatusFilter(f.id);
                            setSpotPage(1);
                          }}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            spotStatusFilter === f.id
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spot Moderation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {spots.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                        No spots match this filter criteria.
                      </div>
                    ) : (
                      spots.map((spot) => {
                        const isFlagged = spot.isUnpublishedByAdmin;
                        const isInactive = !spot.isActive;

                        return (
                          <div
                            key={spot._id}
                            className={`group overflow-hidden rounded-3xl border bg-white shadow-xs transition hover:shadow-lg flex flex-col justify-between ${
                              isFlagged
                                ? "border-rose-300 ring-2 ring-rose-500/10"
                                : isInactive
                                ? "border-slate-300 opacity-75"
                                : "border-slate-200 hover:border-emerald-300"
                            }`}
                          >
                            <div>
                              {/* Image Banner */}
                              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                                <img
                                  src={getImageUrl(spot.image || (spot.images && spot.images[0]))}
                                  alt={spot.title}
                                  className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                                />

                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                  {isFlagged ? (
                                    <span className="rounded-lg bg-rose-600/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                                      🚩 Unpublished by Admin
                                    </span>
                                  ) : isInactive ? (
                                    <span className="rounded-lg bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white">
                                      ⏸️ Host Deactivated
                                    </span>
                                  ) : (
                                    <span className="rounded-lg bg-emerald-600/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                                      ✓ Live & Visible
                                    </span>
                                  )}
                                </div>

                                <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 backdrop-blur-xs px-2.5 py-1 text-xs font-bold text-white">
                                  ₹{spot.price}/hr
                                </div>
                              </div>

                              {/* Spot Info */}
                              <div className="p-5 space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {spot.category}
                                  </span>
                                  <span>{spot.bookingCount || 0} bookings</span>
                                </div>

                                <h3 className="font-bold text-slate-900 line-clamp-1 text-sm group-hover:text-emerald-700 transition" title={spot.title}>
                                  {spot.title}
                                </h3>

                                <p className="flex items-center gap-1 text-xs text-slate-500 line-clamp-1">
                                  <FaMapMarkerAlt className="text-emerald-500 shrink-0" />
                                  {spot.location}
                                </p>

                                {/* Host Details */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400 font-semibold">Host:</span>
                                  <span className="font-bold text-slate-700 truncate max-w-[150px]">
                                    {spot.owner?.name || "Unknown"}
                                  </span>
                                </div>

                                {isFlagged && spot.adminFlagReason && (
                                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-[11px] text-rose-800 mt-2">
                                    <span className="font-bold block">Flag Reason:</span>
                                    <span className="line-clamp-2">{spot.adminFlagReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Moderation Actions Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                              <Link
                                to={`/plot/${spot._id}`}
                                target="_blank"
                                className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition"
                              >
                                View Listing ↗
                              </Link>

                              {isFlagged ? (
                                <button
                                  disabled={processingSpotId === spot._id}
                                  onClick={() => handleToggleSpotModeration(spot, false)}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  {processingSpotId === spot._id ? (
                                    <FaSpinner className="animate-spin inline" />
                                  ) : (
                                    "Publish / Restore"
                                  )}
                                </button>
                              ) : (
                                <button
                                  disabled={processingSpotId === spot._id}
                                  onClick={() => handleToggleSpotModeration(spot, true)}
                                  className="rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                >
                                  Flag / Unpublish
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  {spotsTotalCount > 12 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        disabled={spotPage === 1}
                        onClick={() => setSpotPage((p) => Math.max(1, p - 1))}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs font-semibold text-slate-500">
                        Page {spotPage} of {Math.ceil(spotsTotalCount / 12)}
                      </span>
                      <button
                        disabled={spotPage >= Math.ceil(spotsTotalCount / 12)}
                        onClick={() => setSpotPage((p) => p + 1)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BOOKINGS OVERSIGHT */}
              {activeTab === "bookings" && (
                <div className="space-y-6">
                  {/* Filters Bar */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Search */}
                      <div className="relative md:col-span-2">
                        <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by guest, host, spot, or booking ID..."
                          value={bookingSearch}
                          onChange={(e) => {
                            setBookingSearch(e.target.value);
                            setBookingPage(1);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                        />
                      </div>

                      {/* Status Filter */}
                      <div>
                        <select
                          value={bookingStatusFilter}
                          onChange={(e) => {
                            setBookingStatusFilter(e.target.value);
                            setBookingPage(1);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                        >
                          <option value="all">All Reservation Statuses</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="approved">Approved (Awaiting Payment)</option>
                          <option value="pending">Pending Host Review</option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Payment Status Filter */}
                      <div>
                        <select
                          value={bookingPaymentFilter}
                          onChange={(e) => {
                            setBookingPaymentFilter(e.target.value);
                            setBookingPage(1);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                        >
                          <option value="all">All Payment Statuses</option>
                          <option value="paid">Paid via Razorpay</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>

                    {/* Secondary Date Range Filters */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-500">Date Range:</span>
                      <input
                        type="date"
                        value={bookingStartDate}
                        onChange={(e) => {
                          setBookingStartDate(e.target.value);
                          setBookingPage(1);
                        }}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:bg-white"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={bookingEndDate}
                        onChange={(e) => {
                          setBookingEndDate(e.target.value);
                          setBookingPage(1);
                        }}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:bg-white"
                      />

                      {(bookingStartDate || bookingEndDate || bookingSearch || bookingStatusFilter !== "all" || bookingPaymentFilter !== "all") && (
                        <button
                          onClick={() => {
                            setBookingSearch("");
                            setBookingStatusFilter("all");
                            setBookingPaymentFilter("all");
                            setBookingStartDate("");
                            setBookingEndDate("");
                            setBookingPage(1);
                          }}
                          className="ml-auto text-emerald-600 font-bold hover:underline"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bookings Table */}
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-bold">
                            <th className="py-4 px-6">Booking Details</th>
                            <th className="py-4 px-4">Guest</th>
                            <th className="py-4 px-4">Host / Spot</th>
                            <th className="py-4 px-4">Gross Total</th>
                            <th className="py-4 px-4">Platform Share</th>
                            <th className="py-4 px-4">Host Payout</th>
                            <th className="py-4 px-4">Payment</th>
                            <th className="py-4 px-4">Payout Status</th>
                            <th className="py-4 px-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookings.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400">
                                No reservations match the current filters.
                              </td>
                            </tr>
                          ) : (
                            bookings.map((b) => {
                              const commission = b.platformCommission || Math.round(b.totalPrice * 0.1);
                              const hostNet = b.ownerPayoutAmount || (b.totalPrice - commission);
                              const rate = b.commissionRate || settings.defaultCommissionRate || 10;

                              return (
                                <tr key={b._id} className="hover:bg-slate-50/50 transition">
                                  {/* ID & Date */}
                                  <td className="py-4 px-6">
                                    <p className="font-bold text-slate-900 font-mono text-[11px]">
                                      #{b._id.toString().slice(-6).toUpperCase()}
                                    </p>
                                    <p className="text-slate-600 mt-0.5">
                                      {new Date(b.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {b.startTime} - {b.endTime} ({b.durationHours || 1}h)
                                    </p>
                                  </td>

                                  {/* Guest */}
                                  <td className="py-4 px-4">
                                    <p className="font-bold text-slate-800">{b.user?.name || "Guest"}</p>
                                    <p className="text-[11px] text-slate-500">{b.user?.email}</p>
                                  </td>

                                  {/* Host & Spot */}
                                  <td className="py-4 px-4">
                                    <p className="font-bold text-slate-800 line-clamp-1">{b.spot?.title || "Spot"}</p>
                                    <p className="text-[11px] text-slate-500">
                                      Host: {b.spot?.owner?.name || "Landowner"}
                                    </p>
                                  </td>

                                  {/* Gross */}
                                  <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                                    ₹{b.totalPrice?.toLocaleString()}
                                  </td>

                                  {/* Commission */}
                                  <td className="py-4 px-4 font-bold text-emerald-700">
                                    ₹{commission.toLocaleString()}
                                    <span className="text-[10px] font-normal text-slate-400 block">
                                      ({rate}%)
                                    </span>
                                  </td>

                                  {/* Host Net */}
                                  <td className="py-4 px-4 font-bold text-slate-800">
                                    ₹{hostNet.toLocaleString()}
                                  </td>

                                  {/* Payment Status */}
                                  <td className="py-4 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        b.paymentStatus === "paid"
                                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                          : b.paymentStatus === "failed"
                                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                                          : "bg-slate-100 text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      {b.paymentStatus === "paid" ? "Paid" : b.paymentStatus}
                                    </span>
                                  </td>

                                  {/* Payout Status */}
                                  <td className="py-4 px-4">
                                    {b.paymentStatus !== "paid" ? (
                                      <span className="text-[11px] text-slate-400">—</span>
                                    ) : b.payoutStatus === "paid" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        ✓ Settled
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        ⏳ Due
                                      </span>
                                    )}
                                  </td>

                                  {/* Status */}
                                  <td className="py-4 px-6 text-right">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                        b.status === "confirmed"
                                          ? "bg-emerald-600 text-white"
                                          : b.status === "approved"
                                          ? "bg-blue-600 text-white"
                                          : b.status === "pending"
                                          ? "bg-amber-500 text-white"
                                          : b.status === "rejected"
                                          ? "bg-rose-600 text-white"
                                          : "bg-slate-400 text-white"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {bookingsTotalCount > 15 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        disabled={bookingPage === 1}
                        onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs font-semibold text-slate-500">
                        Page {bookingPage} of {Math.ceil(bookingsTotalCount / 15)}
                      </span>
                      <button
                        disabled={bookingPage >= Math.ceil(bookingsTotalCount / 15)}
                        onClick={() => setBookingPage((p) => p + 1)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PAYOUT SETTLEMENTS (Part 2.3) */}
              {activeTab === "payouts" && (
                <div className="space-y-6">
                  {/* Financials Overview Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Pending Host Settlements
                      </span>
                      <p className="text-3xl font-black text-amber-900 mt-2">
                        ₹{(payoutsData?.summary?.overallPendingPayouts ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Awaiting manual platform bank transfer / payout
                      </p>
                    </div>

                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Completed Host Settlements
                      </span>
                      <p className="text-3xl font-black text-emerald-900 mt-2">
                        ₹{(payoutsData?.summary?.overallCompletedPayouts ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Total funds marked as disbursed to landowners
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Total Platform Commission
                      </span>
                      <p className="text-3xl font-black text-slate-900 mt-2">
                        ₹{(payoutsData?.summary?.overallCommissionRetained ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Retained revenue across paid bookings
                      </p>
                    </div>
                  </div>

                  {/* Information Banner */}
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-blue-900 flex items-start gap-3">
                    <span className="text-blue-600 text-base mt-0.5">ℹ️</span>
                    <div>
                      <p className="font-bold">Manual Payout Settlement Workflow (MVP)</p>
                      <p className="text-blue-800/90 mt-0.5">
                        Payments from guests are collected in the platform's Razorpay account. Use the "Settle Payout" action below to disburse net earnings to hosts and record the bank UTR / NEFT reference number. Automated split payouts via Razorpay Route can be enabled later on top of this verified tracking infrastructure.
                      </p>
                    </div>
                  </div>

                  {/* Payouts by Host Table */}
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-bold">
                            <th className="py-4 px-6">Host / Landowner</th>
                            <th className="py-4 px-4">Paid Bookings</th>
                            <th className="py-4 px-4">Gross Revenue</th>
                            <th className="py-4 px-4">Commission Deducted</th>
                            <th className="py-4 px-4">Settled Amount</th>
                            <th className="py-4 px-4">Pending Payout Due</th>
                            <th className="py-4 px-6 text-right">Settlement Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!payoutsData?.owners || payoutsData.owners.length === 0) ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                No paid reservations currently recorded.
                              </td>
                            </tr>
                          ) : (
                            payoutsData.owners.map((ownerData) => {
                              const hasDue = ownerData.totalPayoutsDue > 0;
                              return (
                                <tr key={ownerData.owner._id} className="hover:bg-slate-50/50 transition">
                                  {/* Host */}
                                  <td className="py-4 px-6">
                                    <p className="font-bold text-slate-900">{ownerData.owner.name}</p>
                                    <p className="text-[11px] text-slate-500">{ownerData.owner.email}</p>
                                  </td>

                                  {/* Count */}
                                  <td className="py-4 px-4">
                                    <span className="font-bold text-slate-800">
                                      {ownerData.bookings?.length || 0}
                                    </span>
                                    {ownerData.pendingBookingsCount > 0 && (
                                      <span className="text-[11px] text-amber-600 block">
                                        ({ownerData.pendingBookingsCount} pending settlement)
                                      </span>
                                    )}
                                  </td>

                                  {/* Gross */}
                                  <td className="py-4 px-4 font-bold text-slate-900">
                                    ₹{ownerData.totalGross?.toLocaleString()}
                                  </td>

                                  {/* Commission */}
                                  <td className="py-4 px-4 font-bold text-emerald-700">
                                    ₹{ownerData.totalCommission?.toLocaleString()}
                                  </td>

                                  {/* Settled */}
                                  <td className="py-4 px-4 font-semibold text-emerald-800">
                                    ₹{ownerData.totalPayoutsPaid?.toLocaleString()}
                                  </td>

                                  {/* Due */}
                                  <td className="py-4 px-4">
                                    <span className={`text-sm font-black ${hasDue ? "text-amber-700" : "text-slate-400"}`}>
                                      ₹{ownerData.totalPayoutsDue?.toLocaleString()}
                                    </span>
                                  </td>

                                  {/* Action */}
                                  <td className="py-4 px-6 text-right">
                                    <button
                                      disabled={!hasDue}
                                      onClick={() => handleOpenSettlement(ownerData)}
                                      className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer ${
                                        hasDue
                                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      }`}
                                    >
                                      {hasDue ? "Settle Payout →" : "All Settled ✓"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SETTINGS & COMMISSION CONTROL */}
              {activeTab === "settings" && (
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Commission Rate Control Box */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <FaPercent size={16} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Global Commission Rate Control</h2>
                        <p className="text-xs text-slate-500">
                          Set the platform's default commission percentage retained from each completed booking.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveSettings} className="mt-8 space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Default Platform Commission Percentage
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={commissionInput}
                            onChange={(e) => setCommissionInput(Number(e.target.value))}
                            className="flex-1 accent-emerald-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
                          />
                          <div className="relative w-28">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={commissionInput}
                              onChange={(e) => setCommissionInput(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-lg font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                            />
                            <span className="absolute right-3 top-3 text-sm font-bold text-slate-400 pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Interactive Example Preview */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs space-y-1 mt-4">
                          <p className="font-bold text-slate-700">Financial Split Simulation (on ₹5,000 reservation):</p>
                          <div className="flex items-center justify-between text-slate-600 pt-1">
                            <span>Platform Retained ({commissionInput}%):</span>
                            <span className="font-bold text-emerald-600">
                              ₹{Math.round((5000 * commissionInput) / 100).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Host Net Payout ({100 - commissionInput}%):</span>
                            <span className="font-bold text-slate-900">
                              ₹{Math.round(5000 - (5000 * commissionInput) / 100).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Changes take effect immediately on all newly confirmed bookings.
                        </span>
                        <button
                          type="submit"
                          disabled={savingSettings}
                          className="rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50"
                        >
                          {savingSettings ? <FaSpinner className="animate-spin inline mr-1" /> : null}
                          Save Commission Rate
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Historical Migration Box */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <FaSyncAlt size={16} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Historical Booking Migration</h2>
                        <p className="text-xs text-slate-500">
                          Recalculate commission and owner payout balances for past confirmed reservations.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                      If there are legacy bookings in the database created before this commission system was introduced, running this migration will backfill them with the current {settings.defaultCommissionRate}% commission rate, generating accurate net payout records across all host dashboards.
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Safe & idempotent operation (only touches bookings missing commission data).
                      </span>
                      <button
                        type="button"
                        disabled={runningBackfill}
                        onClick={handleRunBackfill}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {runningBackfill ? (
                          <FaSpinner className="animate-spin inline mr-1" />
                        ) : (
                          "Run Backfill Now"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: VIEW OWNER SPOTS */}
      <AnimatePresence>
        {selectedOwnerForSpots && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Listings by {selectedOwnerForSpots.name}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedOwnerForSpots.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOwnerForSpots(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[55vh] py-4 space-y-3">
                  {loadingOwnerSpots ? (
                    <div className="py-12 text-center text-slate-400">
                      <FaSpinner className="animate-spin inline mr-2 text-xl" /> Loading host's spots...
                    </div>
                  ) : ownerSpotsList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      This host currently has no spot listings.
                    </p>
                  ) : (
                    ownerSpotsList.map((spot) => (
                      <div
                        key={spot._id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(spot.image || (spot.images && spot.images[0]))}
                            alt={spot.title}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{spot.title}</p>
                            <p className="text-[11px] text-slate-500">{spot.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-bold text-slate-900">₹{spot.price}/hr</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              spot.isUnpublishedByAdmin
                                ? "bg-rose-100 text-rose-800"
                                : spot.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {spot.isUnpublishedByAdmin
                              ? "Admin Flagged"
                              : spot.isActive
                              ? "Live"
                              : "Deactivated"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedOwnerForSpots(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SUSPEND OWNER REASON DIALOG */}
      <AnimatePresence>
        {ownerToSuspend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <FaBan size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Suspend Host Account</h3>
                  <p className="text-xs text-slate-500">{ownerToSuspend.name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Suspending this host will immediately prevent them from logging in, accepting reservations, or managing properties. Per platform policy, all their active spots will also be unpublished from public search.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Suspension (recorded in audit log)
                </label>
                <textarea
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Terms of service violation, repeated guest complaints..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setOwnerToSuspend(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={processingOwnerId === ownerToSuspend._id}
                  onClick={() => handleToggleOwnerStatus(ownerToSuspend, true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-rose-600/25 transition disabled:opacity-50"
                >
                  {processingOwnerId === ownerToSuspend._id ? (
                    <FaSpinner className="animate-spin inline mr-1" />
                  ) : null}
                  Confirm Suspension
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: MODERATE SPOT REASON DIALOG */}
      <AnimatePresence>
        {spotToModerate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <FaExclamationTriangle size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Flag & Unpublish Spot</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{spotToModerate.title}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Unpublishing this listing overrides host settings and hides the plot immediately from all public search results, categories, and direct links.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Moderation Action
                </label>
                <textarea
                  rows={3}
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Inaccurate location photos, safety hazard report, copyright violation..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSpotToModerate(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={processingSpotId === spotToModerate._id}
                  onClick={() => handleToggleSpotModeration(spotToModerate, true)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold shadow-md shadow-rose-600/25 transition disabled:opacity-50"
                >
                  {processingSpotId === spotToModerate._id ? (
                    <FaSpinner className="animate-spin inline mr-1" />
                  ) : null}
                  Unpublish Spot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: SETTLE PAYOUT DIALOG (Part 2.3) */}
      <AnimatePresence>
        {settlementOwner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Settle Host Payout: {settlementOwner.owner?.name}
                    </h3>
                    <p className="text-xs text-slate-500">{settlementOwner.owner?.email}</p>
                  </div>
                  <button
                    onClick={() => setSettlementOwner(null)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                  <p className="text-xs text-slate-600">
                    Select the completed booking reservations you are marking as paid in this settlement batch:
                  </p>

                  {/* List of bookings */}
                  <div className="space-y-2">
                    {(settlementOwner.bookings || [])
                      .filter((b) => b.payoutStatus !== "paid")
                      .map((b) => {
                        const isChecked = selectedBookingIdsToSettle.includes(b._id);
                        return (
                          <div
                            key={b._id}
                            onClick={() => {
                              setSelectedBookingIdsToSettle((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== b._id)
                                  : [...prev, b._id]
                              );
                            }}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                              isChecked
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="accent-emerald-600 h-4 w-4 rounded-sm cursor-pointer"
                              />
                              <div>
                                <p className="font-bold text-slate-800 text-xs">
                                  {b.spotTitle || "Spot"} (Guest: {b.customerName || "Customer"})
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {new Date(b.date).toLocaleDateString()} • Gross ₹{b.totalPrice} • Comm (
                                  {b.commissionRate}%) -₹{b.platformCommission}
                                </p>
                              </div>
                            </div>

                            <span className="font-bold text-emerald-800 text-sm">
                              ₹{b.ownerPayoutAmount}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Settlement inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Bank Transfer Reference / UTR Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UTR1234567890 / NEFT-PLOT-9988"
                        value={settlementTxId}
                        onChange={(e) => setSettlementTxId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Admin Note (visible in payout history)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Disbursed to HDFC Bank A/C ending 4410"
                        value={settlementNote}
                        onChange={(e) => setSettlementNote(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Settlement Sum:</span>
                  <p className="text-lg font-black text-emerald-700">
                    ₹
                    {(settlementOwner.bookings || [])
                      .filter((b) => selectedBookingIdsToSettle.includes(b._id))
                      .reduce((sum, b) => sum + (b.ownerPayoutAmount || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSettlementOwner(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={settlingPayout || selectedBookingIdsToSettle.length === 0}
                    onClick={handleSubmitSettlement}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                  >
                    {settlingPayout ? <FaSpinner className="animate-spin inline mr-1" /> : null}
                    Confirm Payout Paid
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AdminPanel;
