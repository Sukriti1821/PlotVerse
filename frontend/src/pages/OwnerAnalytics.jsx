import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaRupeeSign,
  FaCalendarCheck,
  FaClock,
  FaFire,
  FaLightbulb,
  FaEye,
  FaStar,
  FaPercent,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaSyncAlt,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaLayerGroup,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import HostNavHeader from "../components/owner/HostNavHeader";
import API from "../services/api";

const OwnerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [range, setRange] = useState("30d"); // '7d', '30d', '3m', 'custom', 'all'
  const [selectedSpotId, setSelectedSpotId] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Chart view mode: 'revenue' | 'bookings'
  const [chartMetric, setChartMetric] = useState("revenue");
  // Hovered timeline point
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = async (overrideRange, overrideSpotId) => {
    try {
      setLoading(true);
      setError(null);

      const targetRange = overrideRange || range;
      const targetSpot = overrideSpotId !== undefined ? overrideSpotId : selectedSpotId;

      let url = `/analytics/owner?range=${targetRange}&spotId=${targetSpot}`;
      if (targetRange === "custom" && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const response = await API.get(url);
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to load analytics");
      }
    } catch (err) {
      console.error("Error fetching host analytics:", err);
      setError(
        err.response?.data?.message ||
          "Could not retrieve host analytics. Please ensure your host account is active."
      );
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, selectedSpotId]);

  const handleApplyCustomRange = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      toast.warning("Please select both start and end dates.");
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      toast.error("Start date cannot be later than end date.");
      return;
    }
    fetchAnalytics("custom", selectedSpotId);
  };

  // Helper for timeline chart dimensions & calculations
  const timelinePoints = useMemo(() => data?.timeline || [], [data?.timeline]);
  const maxMetricValue = useMemo(() => {
    if (!timelinePoints.length) return 100;
    const values = timelinePoints.map((p) =>
      chartMetric === "revenue" ? p.revenue : p.bookingsCount
    );
    const max = Math.max(...values, 1);
    return max;
  }, [timelinePoints, chartMetric]);

  // SVG coordinates generator
  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const chartPoints = useMemo(() => {
    if (!timelinePoints.length) return [];
    const usableW = svgWidth - paddingX * 2;
    const usableH = svgHeight - paddingY * 2;
    const stepX = timelinePoints.length > 1 ? usableW / (timelinePoints.length - 1) : 0;

    return timelinePoints.map((item, idx) => {
      const x = paddingX + idx * stepX;
      const val = chartMetric === "revenue" ? item.revenue : item.bookingsCount;
      const normalizedY = maxMetricValue > 0 ? val / maxMetricValue : 0;
      const y = svgHeight - paddingY - normalizedY * usableH;
      return { x, y, ...item, value: val };
    });
  }, [timelinePoints, chartMetric, maxMetricValue]);

  // Area path & Line path strings
  const areaPath = useMemo(() => {
    if (!chartPoints.length) return "";
    const baseLineY = svgHeight - paddingY;
    let d = `M ${chartPoints[0].x} ${baseLineY}`;
    chartPoints.forEach((pt) => {
      d += ` L ${pt.x} ${pt.y}`;
    });
    d += ` L ${chartPoints[chartPoints.length - 1].x} ${baseLineY} Z`;
    return d;
  }, [chartPoints]);

  const linePath = useMemo(() => {
    if (!chartPoints.length) return "";
    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      d += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
    }
    return d;
  }, [chartPoints]);

  const summary = data?.summary || {};
  const comparison = data?.comparison || {};
  const spotsList = data?.spotsList || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Shared Host Navigation Header */}
        <HostNavHeader
          title="Landowner Analytics & Insights"
          subtitle="Real-time revenue, booking trends, popular outdoor hours, and customer demand metrics derived from your properties."
          badge="Host Analytics"
          actions={
            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <FaSyncAlt className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              <span>Refresh Metrics</span>
            </button>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Controls Bar: Time Range Selector + Spot Dropdown */}
          <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Time Range Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <FaCalendarAlt size={12} /> Range:
              </span>
              {[
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "3m", label: "Last 3 Months" },
                { id: "all", label: "All Time" },
                { id: "custom", label: "Custom Range" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setRange(pill.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    range === pill.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Property Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2 border border-slate-200">
                <FaFilter className="text-slate-400 text-xs" />
                <select
                  value={selectedSpotId}
                  onChange={(e) => setSelectedSpotId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
                >
                  <option value="all">All Properties ({spotsList.length})</option>
                  {spotsList.map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Custom Date Range Selector (if selected) */}
          {range === "custom" && (
            <form
              onSubmit={handleApplyCustomRange}
              className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 animate-fadeIn"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl transition cursor-pointer"
              >
                Apply Custom Range
              </button>
            </form>
          )}

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl mb-8 flex items-center gap-3 text-sm">
              <FaExclamationTriangle className="text-rose-500 shrink-0 text-base" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 bg-slate-200/60 rounded-3xl animate-pulse" />
                ))}
              </div>
              <div className="h-72 bg-slate-200/60 rounded-3xl animate-pulse" />
            </div>
          )}

          {data && (
            <>
              {/* Top Dynamic Smart Insights Highlight Banner */}
              {data.smartInsights?.length > 0 && (
                <section className="bg-gradient-to-r from-emerald-900 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-emerald-500/20 mb-8 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                      <FaLightbulb size={22} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
                          Intelligent Host Insights
                        </span>
                        <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          {data.periodLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {data.smartInsights.map((insight, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 bg-slate-900/60 border border-emerald-500/20 rounded-2xl px-4 py-2.5 text-xs text-emerald-100"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <p className="font-medium leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* KPI Summary Cards Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {/* 1. Total Revenue */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>TOTAL REVENUE</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <FaRupeeSign size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{summary.totalRevenue?.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] mt-2 font-semibold">
                    {comparison.revenueChange >= 0 ? (
                      <span className="flex items-center text-emerald-600 font-bold">
                        <FaArrowUp size={10} className="mr-0.5" /> +{comparison.revenueChange}%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-600 font-bold">
                        <FaArrowDown size={10} className="mr-0.5" /> {comparison.revenueChange}%
                      </span>
                    )}
                    <span className="text-slate-400">vs prior period</span>
                  </div>
                </div>

                {/* 2. Total Bookings */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>BOOKINGS</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <FaCalendarCheck size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {summary.totalBookings || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] mt-2 text-slate-500 font-medium">
                    <span className="text-emerald-700 font-bold">{summary.completedBookings || 0} completed</span>
                    <span>·</span>
                    <span className="text-blue-700 font-bold">{summary.upcomingBookings || 0} upcoming</span>
                  </div>
                </div>

                {/* 3. Average Booking Value (ABV) */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>AVG. BOOKING VALUE</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                      <FaRupeeSign size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{summary.averageBookingValue?.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    Avg. revenue per reservation
                  </p>
                </div>

                {/* 4. Cancellation Rate */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>CANCELLATION RATE</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <FaPercent size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {summary.cancellationRate}%
                  </div>
                  <div className="mt-2 text-[11px]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        summary.cancellationRate <= 5
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {summary.cancellationRate <= 5 ? "Strong Retention" : "Action Needed"}
                    </span>
                  </div>
                </div>

                {/* 5. Plot Views & Clicks */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>PLOT VIEWS</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FaEye size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {summary.plotViews?.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    {summary.listingClicks?.toLocaleString()} listing clicks
                  </p>
                </div>

                {/* 6. Conversion Rate & Rating */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>CONVERSION & RATING</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <FaStar size={13} />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>{summary.conversionRate}%</span>
                    <span className="text-xs font-bold text-amber-500 flex items-center">
                      ★ {summary.averageRating}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                    {summary.activeSpotsCount} active properties
                  </p>
                </div>
              </section>

              {/* Main Interactive Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Revenue & Booking Timeline Area Chart (2 Cols) */}
                <section className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">
                          Revenue & Reservation Trajectory
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Timeline activity across {data.periodLabel.toLowerCase()}
                        </p>
                      </div>

                      {/* Chart Metric Toggle */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 border border-slate-200 self-start">
                        <button
                          onClick={() => setChartMetric("revenue")}
                          className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                            chartMetric === "revenue"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Revenue (₹)
                        </button>
                        <button
                          onClick={() => setChartMetric("bookings")}
                          className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                            chartMetric === "bookings"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Bookings (Count)
                        </button>
                      </div>
                    </div>

                    {/* SVG Responsive Area Chart */}
                    <div className="relative w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-56 sm:h-64 overflow-visible"
                      >
                        <defs>
                          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[0, 0.33, 0.66, 1].map((ratio, i) => {
                          const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
                          const val = Math.round(ratio * maxMetricValue);
                          return (
                            <g key={i}>
                              <line
                                x1={paddingX}
                                y1={y}
                                x2={svgWidth - paddingX}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                                strokeDasharray={ratio > 0 ? "4 4" : "0"}
                              />
                              <text
                                x={paddingX - 8}
                                y={y + 3}
                                textAnchor="end"
                                className="fill-slate-400 text-[9px] font-semibold"
                              >
                                {chartMetric === "revenue" ? `₹${val.toLocaleString()}` : val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill */}
                        {areaPath && (
                          <path
                            d={areaPath}
                            fill="url(#emeraldGradient)"
                            className="transition-all duration-300"
                          />
                        )}

                        {/* Line Stroke */}
                        {linePath && (
                          <path
                            d={linePath}
                            fill="none"
                            stroke="#059669"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300"
                          />
                        )}

                        {/* Data Points */}
                        {chartPoints.map((pt, i) => (
                          <g
                            key={i}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredPoint?.date === pt.date ? 6 : 4}
                              fill={hoveredPoint?.date === pt.date ? "#047857" : "#10b981"}
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="transition-all duration-150"
                            />
                            {/* X-axis date labels on selective points to prevent overlap */}
                            {(chartPoints.length <= 10 ||
                              i === 0 ||
                              i === chartPoints.length - 1 ||
                              i % Math.ceil(chartPoints.length / 6) === 0) && (
                              <text
                                x={pt.x}
                                y={svgHeight - 10}
                                textAnchor="middle"
                                className="fill-slate-400 text-[9px] font-medium"
                              >
                                {pt.formattedDate}
                              </text>
                            )}
                          </g>
                        ))}

                        {/* Active Hover Cursor & Tooltip */}
                        {hoveredPoint && (
                          <g pointerEvents="none">
                            <line
                              x1={hoveredPoint.x}
                              y1={paddingY}
                              x2={hoveredPoint.x}
                              y2={svgHeight - paddingY}
                              stroke="#059669"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            {/* Tooltip box */}
                            <rect
                              x={Math.min(Math.max(hoveredPoint.x - 60, 10), svgWidth - 130)}
                              y={Math.max(hoveredPoint.y - 45, 10)}
                              width="120"
                              height="40"
                              rx="8"
                              fill="#0f172a"
                              className="shadow-xl"
                            />
                            <text
                              x={Math.min(Math.max(hoveredPoint.x, 70), svgWidth - 70)}
                              y={Math.max(hoveredPoint.y - 28, 27)}
                              textAnchor="middle"
                              fill="#94a3b8"
                              className="text-[9px] font-bold"
                            >
                              {hoveredPoint.formattedDate}
                            </text>
                            <text
                              x={Math.min(Math.max(hoveredPoint.x, 70), svgWidth - 70)}
                              y={Math.max(hoveredPoint.y - 14, 41)}
                              textAnchor="middle"
                              fill="#ffffff"
                              className="text-[11px] font-extrabold"
                            >
                              {chartMetric === "revenue"
                                ? `₹${hoveredPoint.revenue?.toLocaleString()}`
                                : `${hoveredPoint.bookingsCount} booking${
                                    hoveredPoint.bookingsCount > 1 ? "s" : ""
                                  }`}
                            </text>
                          </g>
                        )}
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4 mt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      {chartMetric === "revenue" ? "Daily Confirmed Earnings" : "Reservation Volume"}
                    </span>
                    <span className="font-semibold text-slate-700">
                      Total:{" "}
                      {chartMetric === "revenue"
                        ? `₹${summary.totalRevenue?.toLocaleString()}`
                        : `${summary.totalBookings} stays`}
                    </span>
                  </div>
                </section>

                {/* Popular Booking Hours Histogram (1 Col) */}
                <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">
                          Popular Booking Hours
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Peak guest arrival times
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <FaClock size={16} />
                      </div>
                    </div>

                    {/* Peak Window Badge */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                          Highest Demand Window
                        </span>
                        <div className="text-sm font-black text-emerald-950 mt-0.5">
                          {data.peakHour
                            ? `${parseInt(data.peakHour, 10) % 12 || 12} ${
                                parseInt(data.peakHour, 10) >= 12 ? "PM" : "AM"
                              } – ${
                                (parseInt(data.peakHour, 10) + 3) % 12 || 12
                              } ${
                                (parseInt(data.peakHour, 10) + 3) >= 12 ? "PM" : "AM"
                              }`
                            : "Late Afternoon & Sunset"}
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                        Peak Demand
                      </span>
                    </div>

                    {/* Hourly Distribution Vertical Bars */}
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {data.popularHours
                        ?.filter((h) => h.count > 0 || parseInt(h.hour, 10) % 2 === 0)
                        .map((slot) => {
                          const maxCount = Math.max(
                            ...data.popularHours.map((h) => h.count),
                            1
                          );
                          const pct = Math.round((slot.count / maxCount) * 100);
                          const isPeak = slot.hour === data.peakHour;
                          const hourNum = parseInt(slot.hour, 10);
                          const label = `${hourNum % 12 || 12}:00 ${
                            hourNum >= 12 ? "PM" : "AM"
                          }`;

                          return (
                            <div key={slot.hour} className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`font-bold ${
                                    isPeak ? "text-emerald-700 font-extrabold" : "text-slate-600"
                                  }`}
                                >
                                  {label} {isPeak && "🔥"}
                                </span>
                                <span className="font-extrabold text-slate-800">
                                  {slot.count} booking{slot.count !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isPeak ? "bg-emerald-600" : "bg-slate-400"
                                  }`}
                                  style={{ width: `${Math.max(pct, 4)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
                    💡 Evening bonfire and sunset hours consistently generate the highest hourly booking volume.
                  </p>
                </section>
              </div>

              {/* Bottom Row: Popular Amenities & Experience Packages */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Amenities Progress List */}
                <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Most Popular Amenities
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Guest add-on selection frequency and attach rates
                      </p>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <FaFire size={16} />
                    </div>
                  </div>

                  {data.popularAmenities?.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No amenity selections recorded in this period.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.popularAmenities?.map((amenity, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[11px] flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {amenity.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-emerald-700 text-sm">
                                {amenity.percentage}%
                              </span>
                              <span className="text-[11px] text-slate-400 ml-1">
                                ({amenity.count} booking{amenity.count > 1 ? "s" : ""})
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                idx === 0
                                  ? "bg-emerald-600"
                                  : idx === 1
                                  ? "bg-teal-600"
                                  : "bg-slate-400"
                              }`}
                              style={{ width: `${Math.max(amenity.percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Most Booked Experience Packages */}
                <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">
                        Top Experience Packages
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Performance of bundled packages and signature experiences
                      </p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FaLayerGroup size={16} />
                    </div>
                  </div>

                  {data.bookedExperiences?.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No experience package reservations in this timeframe.
                      <div className="mt-2">
                        <Link
                          to="/owner/experiences"
                          className="text-emerald-600 font-bold hover:underline"
                        >
                          + Create an Experience Package
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.bookedExperiences?.map((exp, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                                {exp.category || "Signature Package"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {exp.durationHours} Hours
                              </span>
                            </div>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {exp.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {exp.bookingsCount} reservation{exp.bookingsCount > 1 ? "s" : ""} booked
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-slate-900">
                              ₹{exp.revenue?.toLocaleString()}
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              Earned
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default OwnerAnalytics;
