import React, { useState } from "react";
import {
  FiCalendar,
  FiCopy,
  FiCheck,
  FiDownload,
  FiUploadCloud,
  FiX,
  FiExternalLink,
  FiAlertCircle,
} from "react-icons/fi";
import { FaSyncAlt } from "react-icons/fa";
import API from "../../services/api";

export default function IcalSyncModal({ isOpen, onClose, spot }) {
  const [copied, setCopied] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen || !spot) return null;

  const spotId = spot._id || spot.id;
  const baseUrl = window.location.origin.replace(":5173", ":5000").replace(":5174", ":5000");
  const exportUrl = `${baseUrl}/api/spots/${spotId}/calendar.ics`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportFeed = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    try {
      setSyncing(true);
      setStatusMessage(null);
      const res = await API.post(`/spots/${spotId}/sync-ical`, {
        calendarUrl: importUrl.trim(),
      });
      setStatusMessage({
        type: "success",
        text: res.data?.message || `Successfully synced ${res.data?.syncedCount || 0} external calendar events!`,
      });
      setImportUrl("");
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to sync external iCal feed. Please check the URL.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-mist relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-navy p-1 rounded-full transition"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-saffron/15 text-saffron-text flex items-center justify-center font-bold">
            <FiCalendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-text">
              Two-Way Calendar Sync
            </span>
            <h3 className="font-heading font-extrabold text-xl text-navy">
              iCalendar (.ics) Integration
            </h3>
            <p className="text-xs text-slate-500">
              Synchronize bookings with Airbnb, Google Calendar, and Apple iCal
            </p>
          </div>
        </div>

        {/* Section 1: Export Feed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-snow/80 border border-mist mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5 font-heading">
              <FiDownload className="text-saffron-text" /> 1. Export Thikana Feed to Airbnb / Google
            </span>
            <span className="text-[10px] font-bold text-pine bg-pine-mist px-2 py-0.5 rounded-full">
              RFC 5545 Ready
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Paste this URL into Airbnb ("Import Calendar") or Google Calendar ("From URL") to prevent double-bookings.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={exportUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-mist rounded-xl text-slate-700 select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-navy hover:bg-navy-deep text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? <FiCheck className="text-saffron" /> : <FiCopy />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Import Feed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-snow/80 border border-mist mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5 font-heading">
              <FiUploadCloud className="text-saffron-text" /> 2. Import External iCal Feed to Thikana
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Paste your Airbnb, Vrbo, or Google Calendar `.ics` export link here to block out dates automatically on Thikana.
          </p>

          <form onSubmit={handleImportFeed} className="space-y-3">
            <input
              type="url"
              placeholder="https://www.airbnb.com/calendar/ical/12345.ics?s=..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-white border border-mist rounded-xl focus:border-navy focus:outline-none"
            />
            <button
              type="submit"
              disabled={syncing || !importUrl.trim()}
              className="w-full py-2.5 rounded-xl bg-saffron hover:bg-saffron-hover text-navy font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaSyncAlt className={`${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Synchronizing Calendar..." : "Sync External Calendar Now"}</span>
            </button>
          </form>

          {statusMessage && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-pine-mist text-pine border border-pine/30"
                  : "bg-danger-mist text-danger border border-danger/30"
              }`}
            >
              <FiAlertCircle className="shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Informational Tip */}
        <div className="text-[11px] text-slate-500 bg-white p-3.5 rounded-xl border border-mist/80 flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-saffron-text shrink-0 mt-0.5" />
          <span>
            Calendar feeds update periodically across external providers. Changes made on external channels may take a few minutes to propagate across your plots.
          </span>
        </div>
      </div>
    </div>
  );
}
