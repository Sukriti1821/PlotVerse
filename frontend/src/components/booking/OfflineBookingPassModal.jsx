import React, { useEffect, useState } from "react";
import {
  FiX,
  FiDownload,
  FiMapPin,
  FiClock,
  FiKey,
  FiPhone,
  FiCheckCircle,
  FiShield,
  FiShare2,
} from "react-icons/fi";
import { FaMountain, FaQrcode } from "react-icons/fa";

export default function OfflineBookingPassModal({ isOpen, onClose, booking }) {
  const [isSavedOffline, setIsSavedOffline] = useState(false);

  useEffect(() => {
    if (booking && isOpen) {
      try {
        const key = `thikana_offline_pass_${booking._id || booking.id}`;
        localStorage.setItem(key, JSON.stringify(booking));
        setIsSavedOffline(true);
      } catch (err) {
        console.warn("Could not save to localStorage:", err);
      }
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const spot = booking.spot || {};
  const bookingId = (booking._id || booking.id || "TK-PASS").slice(-8).toUpperCase();
  const dateStr = booking.date
    ? new Date(booking.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Confirmed Date";

  const lockPin = booking.accessPin || "7492";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-mist relative max-h-[95vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-1.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur transition"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Boarding Pass Header */}
        <div className="bg-navy p-6 text-white text-center relative overflow-hidden border-b-4 border-saffron">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron/20 border border-saffron/40 text-saffron text-[10px] font-extrabold uppercase tracking-widest mb-2">
              <FiShield /> Offline Himalayan Entry Pass
            </div>
            <h3 className="font-heading font-black text-2xl text-snow tracking-tight">
              {spot.title || "Mountain Sanctuary"}
            </h3>
            <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5 mt-1 font-sans">
              <FiMapPin className="text-saffron shrink-0" />
              <span>{spot.location || "Himalayan Ridge, India"}</span>
            </p>
          </div>

          {/* Decorative mountain background glow */}
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-saffron/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-pine/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Perforated ticket divider */}
        <div className="relative bg-white h-4 flex items-center justify-between px-3">
          <div className="w-4 h-8 bg-navy/70 rounded-r-full -ml-5"></div>
          <div className="flex-1 border-t-2 border-dashed border-mist mx-2"></div>
          <div className="w-4 h-8 bg-navy/70 rounded-l-full -mr-5"></div>
        </div>

        {/* Boarding Pass Body */}
        <div className="p-6 bg-white overflow-y-auto flex-1 space-y-4 font-sans text-navy">
          {/* Key Data Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-snow rounded-2xl border border-mist/80">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date</div>
              <div className="text-xs font-black text-navy mt-0.5">{dateStr}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Slot Time</div>
              <div className="text-xs font-black text-navy mt-0.5">
                {booking.startTime} - {booking.endTime}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pass ID</div>
              <div className="text-xs font-mono font-black text-saffron-text mt-0.5">{bookingId}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Guest Name</div>
              <div className="text-xs font-black text-navy mt-0.5">
                {booking.user?.name || "Verified Traveler"}
              </div>
            </div>
          </div>

          {/* Gate Access / Lockbox PIN */}
          <div className="p-4 rounded-2xl bg-saffron/10 border border-saffron/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-saffron text-navy flex items-center justify-center font-bold shadow-xs">
                <FiKey className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-saffron-text">
                  Gate Lock / Box PIN
                </div>
                <div className="font-mono text-xl font-extrabold text-navy tracking-widest">
                  {lockPin}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 max-w-[90px] text-right">
              Self-checkin authorized
            </span>
          </div>

          {/* QR Code representation */}
          <div className="text-center p-4 bg-snow/80 rounded-2xl border border-mist flex flex-col items-center">
            {/* SVG Simulated QR code */}
            <div className="p-2.5 bg-white rounded-xl shadow-xs border border-mist/80 mb-2">
              <svg className="w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
                {/* Simulated high-contrast QR Matrix */}
                <rect x="0" y="0" width="30" height="30" rx="3" fill="#14213D" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="#FCA311" />

                <rect x="70" y="0" width="30" height="30" rx="3" fill="#14213D" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="#FCA311" />

                <rect x="0" y="70" width="30" height="30" rx="3" fill="#14213D" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="#FCA311" />

                {/* Data blocks */}
                <rect x="35" y="10" width="8" height="8" fill="#14213D" />
                <rect x="47" y="15" width="12" height="6" fill="#14213D" />
                <rect x="38" y="35" width="14" height="14" fill="#14213D" />
                <rect x="58" y="38" width="10" height="8" fill="#14213D" />
                <rect x="75" y="45" width="14" height="10" fill="#14213D" />
                <rect x="45" y="60" width="8" height="12" fill="#14213D" />
                <rect x="60" y="72" width="12" height="12" fill="#14213D" />
                <rect x="80" y="80" width="12" height="8" fill="#14213D" />
                <rect x="35" y="85" width="18" height="6" fill="#14213D" />
              </svg>
            </div>
            <span className="font-mono text-[11px] font-bold text-navy">
              THIKANA-VERIFIED-{bookingId}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Scan at gate scanner or present to valley caretaker
            </span>
          </div>

          {/* Offline status confirmation */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-pine-mist border border-pine/20 text-pine font-medium">
            <span className="flex items-center gap-1.5 font-bold">
              <FiCheckCircle className="text-pine w-4 h-4" /> Cached on Device
            </span>
            <span className="text-[11px]">Ready without cell signal</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-snow border-t border-mist flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-navy hover:bg-navy-deep text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <FiDownload /> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-mist hover:border-navy text-navy font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
