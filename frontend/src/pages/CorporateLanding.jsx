import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaUsers,
  FaCalendarAlt,
  FaClock,
  FaWifi,
  FaTv,
  FaUtensils,
  FaMicrophone,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaArrowRight,
  FaSpinner,
  FaStar,
  FaMapMarkerAlt,
  FaSearch,
  FaTimes,
  FaShieldAlt,
  FaLeaf,
  FaHandshake,
} from "react-icons/fa";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { getImageUrl } from "../utils/imageHelper";

const EVENT_TYPES = [
  {
    id: "team_outing",
    label: "Team Outings & Picnics",
    icon: "🏕️",
    desc: "Relaxing day retreats with bonfires, games, barbecue, and team bonding.",
  },
  {
    id: "corporate_meeting",
    label: "Executive Off-sites",
    icon: "💼",
    desc: "Private scenic estates for high-focus strategy planning and quarterly reviews.",
  },
  {
    id: "workshop",
    label: "Workshops & Training",
    icon: "💡",
    desc: "Open-air pavilions equipped with high-speed Wi-Fi, audio-visuals, and whiteboards.",
  },
  {
    id: "small_retreat",
    label: "Leadership Retreats",
    icon: "🌲",
    desc: "Multi-hour or full-day tranquil getaways for founders and leadership teams.",
  },
  {
    id: "team_building",
    label: "Team-Building Challenges",
    icon: "🎯",
    desc: "Expansive plots for outdoor problem-solving activities, sports, and drills.",
  },
  {
    id: "offsite_event",
    label: "Company Celebrations",
    icon: "🎉",
    desc: "Milestone parties, product launches, and annual company meetups.",
  },
];

const CorporateLanding = () => {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Spaces & Filters State
  const [spaces, setSpaces] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [minCapacity, setMinCapacity] = useState("10");
  const [selectedAmenity, setSelectedAmenity] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  // RFP Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null); // { spot, experience }
  const [submittingRfp, setSubmittingRfp] = useState(false);
  const [rfpSuccessBooking, setRfpSuccessBooking] = useState(null);

  // RFP Form Fields
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [contactPerson, setContactPerson] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState("");
  const [eventType, setEventType] = useState("team_outing");
  const [attendeesCount, setAttendeesCount] = useState(20);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [startTime, setStartTime] = useState("10:00");
  const [durationHours, setDurationHours] = useState(6);
  const [cateringNeeded, setCateringNeeded] = useState(true);
  const [cateringNotes, setCateringNotes] = useState("Buffet lunch and evening high tea");
  const [avTechNeeded, setAvTechNeeded] = useState(true);
  const [eventObjectives, setEventObjectives] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState(30000);
  const [requiresCustomQuote, setRequiresCustomQuote] = useState(true);

  // Fetch corporate spaces
  const fetchCorporateSpaces = async () => {
    try {
      setLoading(true);
      const params = {};
      if (minCapacity) params.minCapacity = minCapacity;
      if (selectedEventType && selectedEventType !== "all") params.eventType = selectedEventType;
      if (searchLocation) params.location = searchLocation;
      if (selectedAmenity) params.amenity = selectedAmenity;

      const res = await API.get("/corporate/spaces", { params });
      if (res.data?.data) {
        setSpaces(res.data.data.spots || []);
        setExperiences(res.data.data.experiences || []);
      }
    } catch (err) {
      console.error("Failed to load corporate spaces:", err);
      toast.error("Could not load corporate spaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorporateSpaces();
  }, [selectedEventType, minCapacity, selectedAmenity]);

  // Preload company details if user already has an organization
  useEffect(() => {
    const fetchOrg = async () => {
      if (!user) return;
      try {
        const res = await API.get("/corporate/organization");
        if (res.data?.data) {
          const o = res.data.data;
          setCompanyName(o.name || "");
          setGstin(o.gstin || "");
          if (o.contactPhone) setContactPhone(o.contactPhone);
        }
      } catch (e) {
        // No org yet, normal
      }
    };
    fetchOrg();
  }, [user]);

  const handleOpenRfp = (spot = null, experience = null) => {
    setSelectedTarget({ spot, experience });
    if (experience) {
      setDurationHours(experience.durationHours || 6);
      if (experience.price) setEstimatedBudget(experience.price);
    } else if (spot) {
      const rate = spot.corporateFriendly?.corporateHourlyRate || spot.price || 1500;
      setEstimatedBudget(rate * 6);
    }
    setIsModalOpen(true);
  };

  const handleSubmitRfp = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      toast.info("Please sign in or register to submit a corporate request.");
      return;
    }

    if (!companyName.trim()) {
      toast.warn("Please enter your Company / Organization name.");
      return;
    }

    try {
      setSubmittingRfp(true);
      const payload = {
        spotId: selectedTarget?.spot?._id,
        experienceId: selectedTarget?.experience?._id,
        date: eventDate,
        startTime,
        durationHours: Number(durationHours) || 6,
        requiresCustomQuote,
        corporateDetails: {
          companyName: companyName.trim(),
          gstin: gstin.trim(),
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          eventType,
          attendeesCount: Number(attendeesCount) || 10,
          eventObjectives: eventObjectives.trim(),
          cateringNeeded,
          cateringNotes: cateringNeeded ? cateringNotes.trim() : "",
          avTechNeeded,
          estimatedBudget: Number(estimatedBudget) || null,
        },
      };

      const res = await API.post("/corporate/book", payload);
      if (res.data?.success) {
        setRfpSuccessBooking(res.data.data);
        toast.success(res.data.message || "Corporate RFP submitted successfully!");
      }
    } catch (err) {
      console.error("RFP submission error:", err);
      toast.error(err.response?.data?.message || "Failed to submit corporate request.");
    } finally {
      setSubmittingRfp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/20 shadow-2xl">
          <div className="absolute top-0 right-10 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-4 backdrop-blur-md">
                <FaBuilding className="text-emerald-400" />
                Thikana for Business & Teams
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Take Your Team{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Beyond Four Walls.
                </span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-light">
                Discover private outdoor estates, pine groves, and mountain clearings equipped with high-speed Wi-Fi, AV tech, and gourmet catering for team outings, off-sites, and retreats.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => handleOpenRfp(null, null)}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Request a Corporate Quote
                </button>

                <Link
                  to="/corporate/bookings"
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                >
                  <FaFileInvoiceDollar />
                  Manage Quotes & Events
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">100%</div>
                  <div className="text-xs text-slate-400">Private Outdoor Exclusivity</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">GST-Ready</div>
                  <div className="text-xs text-slate-400">Official Invoicing & PO Support</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">Custom RFP</div>
                  <div className="text-xs text-slate-400">Tailored Quotes & Catering</div>
                </div>
              </div>
            </div>

            {/* Visual Value Box */}
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl text-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaHandshake className="text-emerald-400" />
                Why Leading Teams Choose Thikana
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <FaWifi />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Work-Ready Connectivity</h4>
                    <p className="text-slate-400 text-xs">High-speed Wi-Fi, audio/mic setups, and generator power backup.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
                    <FaUtensils />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Turnkey Catering & Dining</h4>
                    <p className="text-slate-400 text-xs">Buffet lunch, barbecue stations, and high tea breaks curated with local hosts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Zero Distraction Privacy</h4>
                    <p className="text-slate-400 text-xs">No crowded hotel conference rooms. Entire plots booked exclusively for your company.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Types Showcase */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Designed for Every Corporate Occasion
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              From high-stakes strategic alignment to laid-back team barbecue parties, find spaces purpose-configured for your team size.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENT_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedEventType(type.id === selectedEventType ? "all" : type.id)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  selectedEventType === type.id
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/15"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="text-3xl mb-3">{type.icon}</div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {type.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {type.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>{selectedEventType === type.id ? "Filtering Spaces" : "Filter Spaces"}</span>
                  <FaArrowRight size={10} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Spaces Explorer Section */}
        <section className="py-12 bg-slate-100/70 dark:bg-slate-900/40 border-t border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Filters:
                </span>

                {/* Capacity Dropdown */}
                <select
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="10">Capacity: 10+ Guests</option>
                  <option value="25">Capacity: 25+ Guests</option>
                  <option value="50">Capacity: 50+ Guests</option>
                  <option value="100">Capacity: 100+ Guests</option>
                </select>

                {/* Amenity Filter */}
                <select
                  value={selectedAmenity}
                  onChange={(e) => setSelectedAmenity(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">All Amenities</option>
                  <option value="Wi-Fi">High-Speed Wi-Fi</option>
                  <option value="Projector">Projector & Screen</option>
                  <option value="Catering">Catering / Dining</option>
                  <option value="Microphone">PA & Sound</option>
                </select>

                {selectedEventType !== "all" && (
                  <button
                    onClick={() => setSelectedEventType("all")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                  >
                    <span>Event: {EVENT_TYPES.find((t) => t.id === selectedEventType)?.label}</span>
                    <FaTimes size={10} />
                  </button>
                )}
              </div>

              {/* Location search */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search city, hills, estate..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCorporateSpaces()}
                  className="pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none w-full sm:w-64"
                />
              </div>
            </div>

            {/* Results Display */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-3" />
                <p className="text-sm text-slate-500">Searching corporate-ready spaces...</p>
              </div>
            ) : spaces.length === 0 && experiences.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <FaBuilding className="text-4xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="font-bold text-lg">No corporate spaces match these filters</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try lowering the capacity requirement or clearing the amenity filter to view all available corporate plots.
                </p>
                <button
                  onClick={() => {
                    setMinCapacity("10");
                    setSelectedAmenity("");
                    setSelectedEventType("all");
                    setSearchLocation("");
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* 1. Curated Corporate Packages */}
                {experiences.length > 0 && (
                  <div>
                    <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                      <span className="text-emerald-500">⭐</span> Curated Corporate Retreat Packages
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {experiences.map((exp) => (
                        <div
                          key={exp._id}
                          className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                        >
                          <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                            <img
                              src={getImageUrl(exp.image || exp.spot?.images?.[0])}
                              alt={exp.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-sm">
                              Corporate Package
                            </div>
                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <h4 className="font-bold text-base line-clamp-1">{exp.title}</h4>
                              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                                <FaMapMarkerAlt className="text-emerald-400 text-[10px]" />
                                {exp.spot?.location || "Private Retreat"}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 flex-grow flex flex-col justify-between">
                            <div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                {exp.description}
                              </p>

                              <div className="flex flex-wrap gap-1.5 mb-4">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold flex items-center gap-1">
                                  <FaClock className="text-emerald-500" /> {exp.durationHours} Hours
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold flex items-center gap-1">
                                  <FaUsers className="text-emerald-500" /> Up to {exp.maxAttendees || 30} Guests
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                                  Package Starting At
                                </span>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                  ₹{exp.price.toLocaleString("en-IN")}
                                </span>
                              </div>

                              <button
                                onClick={() => handleOpenRfp(exp.spot, exp)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                              >
                                Request Quote
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Corporate-Ready Outdoor Plots */}
                {spaces.length > 0 && (
                  <div>
                    <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
                      <FaBuilding className="text-emerald-500" /> Corporate-Ready Outdoor Plots & Estates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {spaces.map((spot) => {
                        const corpCap = spot.corporateFriendly?.maxCorporateCapacity || spot.maxGuests || 50;
                        const amenitiesList = spot.corporateFriendly?.corporateAmenities || [];

                        return (
                          <div
                            key={spot._id}
                            className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                          >
                            <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                              <img
                                src={getImageUrl(spot.images?.[0] || spot.image)}
                                alt={spot.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=60";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                                🏢 Up to {corpCap} Attendees
                              </div>
                              <div className="absolute bottom-3 left-3 right-3 text-white">
                                <h4 className="font-bold text-base line-clamp-1">{spot.title}</h4>
                                <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                                  <FaMapMarkerAlt className="text-emerald-400 text-[10px]" />
                                  {spot.location}
                                </p>
                              </div>
                            </div>

                            <div className="p-5 flex-grow flex flex-col justify-between">
                              <div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                                  {spot.description}
                                </p>

                                {/* Corporate Amenities Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {amenitiesList.slice(0, 3).map((a, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/50 dark:border-emerald-900/40"
                                    >
                                      ✓ {a}
                                    </span>
                                  ))}
                                  {amenitiesList.length > 3 && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">
                                      +{amenitiesList.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                                    Base Hourly Rate
                                  </span>
                                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                    ₹{(spot.corporateFriendly?.corporateHourlyRate || spot.price).toLocaleString("en-IN")}/hr
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleOpenRfp(spot, null)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                                >
                                  Request Quote
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Interactive Corporate RFP / Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 text-slate-900 dark:text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1">
                    <FaBuilding /> Corporate RFP / Booking Request
                  </span>
                  <h3 className="text-xl font-extrabold">
                    {selectedTarget?.experience?.title || selectedTarget?.spot?.title || "Custom Corporate Event"}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setRfpSuccessBooking(null);
                  }}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {rfpSuccessBooking ? (
                /* Success Screen */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center text-3xl mx-auto animate-bounce">
                    <FaCheckCircle />
                  </div>
                  <h4 className="text-2xl font-black">RFP Submitted to Landowner!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your request for <strong>{rfpSuccessBooking.corporateDetails?.companyName}</strong> has been delivered. The host will review your requirements and submit a formal quote with per-head pricing.
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-left max-w-md mx-auto space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Request ID:</span>
                      <span className="font-mono font-bold">{rfpSuccessBooking._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-amber-600 uppercase tracking-wider">
                        {rfpSuccessBooking.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attendees:</span>
                      <span className="font-bold">{rfpSuccessBooking.corporateDetails?.attendeesCount} Guests</span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={() => navigate("/corporate/bookings")}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    >
                      Go to Corporate Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setRfpSuccessBooking(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* RFP Form */
                <form onSubmit={handleSubmitRfp} className="mt-6 space-y-5">
                  {/* Company Profile Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Tech Global"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        GSTIN (for B2B Tax Invoicing)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Contact Person Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 ..."
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Event Specifics */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Event Purpose / Type
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Attendees
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="200"
                        value={attendeesCount}
                        onChange={(e) => setAttendeesCount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Duration (Hrs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date & Start Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Start Time
                      </label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add-on Requirements: Catering & AV */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-xs font-bold uppercase text-slate-500 block">
                      Add-on Logistics & Facilities
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={cateringNeeded}
                          onChange={(e) => setCateringNeeded(e.target.checked)}
                          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold">Turnkey Catering Needed</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={avTechNeeded}
                          onChange={(e) => setAvTechNeeded(e.target.checked)}
                          className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold">Projector & Audio Gear</span>
                      </label>
                    </div>

                    {cateringNeeded && (
                      <input
                        type="text"
                        placeholder="Catering preferences (e.g. buffet lunch, high-tea, barbecue)"
                        value={cateringNotes}
                        onChange={(e) => setCateringNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Budget & Objectives */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Estimated Budget (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 35000"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Special Event Objectives
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Strategic alignment, team bonfire"
                        value={eventObjectives}
                        onChange={(e) => setEventObjectives(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingRfp}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {submittingRfp ? (
                      <>
                        <FaSpinner className="animate-spin" /> Submitting Corporate Request...
                      </>
                    ) : (
                      <>
                        <FaFileInvoiceDollar /> Submit Request for Custom Host Quote
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    No payment due right now. The landowner will review and provide a customized itemized quote.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default CorporateLanding;
