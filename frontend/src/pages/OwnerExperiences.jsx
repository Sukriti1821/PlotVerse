import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTree,
  FaClock,
  FaCheck,
  FaSpinner,
  FaEye,
  FaLayerGroup,
} from "react-icons/fa";
import API from "../services/api";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import HostNavHeader from "../components/owner/HostNavHeader";
import ExperienceManageModal from "../components/owner/ExperienceManageModal";
import { getImageUrl } from "../utils/imageHelper";

const OwnerExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [ownerSpots, setOwnerSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const [expRes, spotsRes] = await Promise.all([
          API.get("/experiences/owner/me"),
          API.get("/spots/owner/me"),
        ]);
        if (!ignore) {
          setExperiences(expRes.data?.data || []);
          setOwnerSpots(spotsRes.data?.data || spotsRes.data || []);
        }
      } catch (err) {
        console.error("Error loading owner experiences:", err);
        if (!ignore) {
          toast.error("Failed to load your experience packages");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const refreshExperiencesAndSpots = async () => {
    try {
      const [expRes, spotsRes] = await Promise.all([
        API.get("/experiences/owner/me"),
        API.get("/spots/owner/me"),
      ]);
      setExperiences(expRes.data?.data || []);
      setOwnerSpots(spotsRes.data?.data || spotsRes.data || []);
    } catch (err) {
      console.error("Error refreshing experiences:", err);
    }
  };

  const handleCreateNew = () => {
    if (ownerSpots.length === 0) {
      toast.warning("You must list at least one plot before creating an experience package.");
      return;
    }
    setSelectedExperience(null);
    setIsModalOpen(true);
  };

  const handleEditExperience = (exp) => {
    setSelectedExperience(exp);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (exp) => {
    try {
      const updated = !exp.isActive;
      await API.patch(`/experiences/${exp._id}`, { isActive: updated });
      setExperiences((prev) =>
        prev.map((item) => (item._id === exp._id ? { ...item, isActive: updated } : item))
      );
      toast.success(
        `Experience "${exp.title}" is now ${updated ? "active & visible" : "hidden from travelers"}`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update experience status");
    }
  };

  const handleDeleteExperience = async (expId, title) => {
    if (!window.confirm(`Are you sure you want to delete the experience "${title}"?`)) return;

    try {
      await API.delete(`/experiences/${expId}`);
      setExperiences((prev) => prev.filter((item) => item._id !== expId));
      toast.success("Experience package deleted successfully");
    } catch (err) {
      console.error("Error deleting experience:", err);
      toast.error(err.response?.data?.message || "Failed to delete experience");
    }
  };

  const handleExperienceSaved = () => {
    refreshExperiencesAndSpots();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <Navbar />

        <HostNavHeader
          title="My Experience Packages"
          subtitle="Bundle your plots with included bonfires, romantic setups, dinners, and BBQ gear into high-earning packages."
          badge="Experience Builder"
          actions={
            <div className="flex items-center gap-3">
              <Link
                to="/owner/spots"
                className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Manage Plots
              </Link>
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition cursor-pointer"
              >
                <FaPlus size={10} /> Create New Experience
              </button>
            </div>
          }
        />

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Total Packages</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{experiences.length}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Active & Live</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {experiences.filter((e) => e.isActive).length}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Avg Duration</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {experiences.length > 0
                    ? Math.round(
                        experiences.reduce((sum, e) => sum + (e.durationHours || 0), 0) /
                          experiences.length
                      )
                    : 0}{" "}
                  hrs
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Linked Plots</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{ownerSpots.length}</p>
              </div>
            </div>
          </div>

        {/* Experiences List */}
        <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          {loading ? (
            <div className="py-20 flex justify-center">
              <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            </div>
          ) : experiences.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center my-8 max-w-2xl mx-auto bg-white">
              <FaLayerGroup size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Experience Packages Yet</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You have not created any experience packages yet. Bundle one of your plots with a bonfire, music, and BBQ kit to start welcoming high-value guests!
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
              >
                <FaPlus size={10} /> Create First Experience
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((exp) => {
                const displayImg = getImageUrl(
                  exp.image || exp.spot?.image || (exp.spot?.images && exp.spot.images[0])
                );
                return (
                  <div
                    key={exp._id}
                    className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail & Active status badge */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={displayImg}
                          alt={exp.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white">
                            {exp.category}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              exp.isActive
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-slate-700/80 text-slate-300 backdrop-blur-md"
                            }`}
                          >
                            {exp.isActive ? "Live" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{exp.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <FaTree className="text-emerald-600 text-[10px]" />
                          <span className="truncate">{exp.spot?.title || "Host Plot"}</span>
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <FaClock className="text-slate-400 text-xs" />
                            <span>{exp.durationHours} Hours</span>
                          </div>
                          <div className="text-right font-extrabold text-slate-900">
                            ₹{exp.price?.toLocaleString("en-IN")}
                          </div>
                        </div>

                        {/* Inclusions summary */}
                        <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <FaCheck size={9} /> {exp.includedAmenities?.length || 0} Included
                          </span>
                          <span>•</span>
                          <span>{exp.optionalAddOns?.length || 0} Add-Ons</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-5 pt-0">
                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                        {/* Status Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(exp)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition ${
                            exp.isActive
                              ? "text-slate-600 hover:text-slate-900 bg-slate-100"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          }`}
                        >
                          {exp.isActive ? "Disable" : "Enable"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/experience/${exp._id}`}
                            className="p-2 text-slate-400 hover:text-emerald-600 transition"
                            title="View Public Experience Page"
                          >
                            <FaEye size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditExperience(exp)}
                            className="p-2 text-slate-400 hover:text-slate-900 transition"
                            title="Edit Experience"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp._id, exp.title)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Experience"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal for Creating / Editing Experience */}
      <ExperienceManageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        experienceToEdit={selectedExperience}
        ownerSpots={ownerSpots}
        onExperienceSaved={handleExperienceSaved}
      />

      <Footer />
    </div>
  );
};

export default OwnerExperiences;
