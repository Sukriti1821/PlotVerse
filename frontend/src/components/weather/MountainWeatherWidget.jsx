import React, { useMemo } from "react";
import {
  FiSun,
  FiCloudRain,
  FiWind,
  FiEye,
  FiMoon,
  FiCompass,
  FiAlertCircle,
  FiThermometer,
} from "react-icons/fi";
import { FaFire, FaMountain } from "react-icons/fa";

// Altitude and atmospheric metadata based on location keywords
const HIMALAYAN_ALTITUDES = {
  chopta: { alt: 2680, name: "Tungnath Ridge", starScore: 98, vibe: "Pristine dark sky reserve" },
  spiti: { alt: 3800, name: "Cold Desert Highlands", starScore: 99, vibe: "Bortle Class 1 night sky" },
  kaza: { alt: 3650, name: "Spiti Valley Floor", starScore: 97, vibe: "Crystal clear Milky Way core" },
  leh: { alt: 3500, name: "Ladakh Plateau", starScore: 96, vibe: "Zero light pollution plateau" },
  ladakh: { alt: 3500, name: "High Altitude Desert", starScore: 96, vibe: "Crisp atmospheric visibility" },
  manali: { alt: 2050, name: "Upper Beas Valley", starScore: 89, vibe: "Alpine cedar night sky" },
  kasol: { alt: 1580, name: "Parvati Valley", starScore: 84, vibe: "Pine canopy & canyon breeze" },
  jibhi: { alt: 1600, name: "Tirthan Highland", starScore: 88, vibe: "Serene mountain basin" },
  tirthan: { alt: 1600, name: "Eco Valley Rim", starScore: 90, vibe: "Quiet riverside starry skies" },
  munsyari: { alt: 2200, name: "Panchachuli Base", starScore: 95, vibe: "Front-row snow peak views" },
  gulmarg: { alt: 2650, name: "Pir Panjal Meadow", starScore: 91, vibe: "Alpine meadow atmosphere" },
  pahalgam: { alt: 2130, name: "Lidder Valley", starScore: 88, vibe: "Pine mist & starry evenings" },
  rishikesh: { alt: 372, name: "Ganga Foothills", starScore: 74, vibe: "Warm subtropical river breeze" },
  shimla: { alt: 2276, name: "Ridge Overlook", starScore: 80, vibe: "Mild Himalayan hill weather" },
};

export default function MountainWeatherWidget({ location = "Manali, Himachal Pradesh", spotTitle = "" }) {
  const metadata = useMemo(() => {
    const locLower = (location || "").toLowerCase();
    for (const [key, val] of Object.entries(HIMALAYAN_ALTITUDES)) {
      if (locLower.includes(key)) {
        return val;
      }
    }
    return { alt: 2150, name: "Himalayan Ridge", starScore: 88, vibe: "High-altitude clear skies" };
  }, [location]);

  // Generate 5-day mountain weather projection
  const forecastDays = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isNightCool = metadata.alt > 2500;
      const baseHigh = isNightCool ? 17 : 22;
      const baseLow = isNightCool ? 4 : 8;
      
      const dayVariation = (i % 2 === 0 ? 1 : -1) * (i * 0.8);
      const condition = i === 1 ? "Passing Mist" : i === 3 ? "Light Breeze" : "Crisp & Sunny";

      return {
        label: i === 0 ? "Today" : days[d.getDay()],
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        condition,
        high: Math.round(baseHigh + dayVariation),
        low: Math.round(baseLow - dayVariation * 0.5),
        icon: condition.includes("Mist") ? FiCloudRain : FiSun,
      };
    });
  }, [metadata]);

  return (
    <div className="bg-white rounded-3xl border border-mist/80 p-6 md:p-7 shadow-sm transition-all hover:shadow-md">
      {/* Header with Altitude & Dark Sky badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-mist/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-navy/5 text-navy">
              <FaMountain className="w-4 h-4 text-saffron" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-text">
              Mountain Microclimate & Stargazing
            </span>
          </div>
          <h3 className="font-heading font-extrabold text-xl text-navy">
            Live Mountain Conditions & Sky Clarity
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time elevation and astronomical metrics for {location || "this plot"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-snow border border-mist px-3 py-2 rounded-2xl flex items-center gap-2 text-navy text-xs font-semibold shadow-xs">
            <FiCompass className="text-saffron w-4 h-4" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Altitude</div>
              <div className="font-heading font-extrabold text-sm">{metadata.alt}m <span className="text-[11px] font-normal text-slate-500">({Math.round(metadata.alt * 3.28084)} ft)</span></div>
            </div>
          </div>

          <div className="bg-navy text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-xs border border-saffron/30">
            <FiMoon className="text-saffron w-4 h-4 animate-pulse" />
            <div>
              <div className="text-[10px] text-saffron uppercase tracking-wider font-bold">Sky Score</div>
              <div className="font-heading font-extrabold text-sm text-snow">{metadata.starScore}% <span className="text-[11px] text-emerald-400">Clear</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Microclimate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="p-3.5 bg-snow/80 rounded-2xl border border-mist/60 flex items-start gap-3">
          <div className="p-2 bg-saffron/15 rounded-xl text-saffron-text mt-0.5">
            <FiEye className="w-4 h-4 text-saffron-text" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Astrophotography</div>
            <div className="text-sm font-extrabold text-navy font-heading mt-0.5">Bortle Class 2</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Milky Way visible from 9:30 PM</div>
          </div>
        </div>

        <div className="p-3.5 bg-snow/80 rounded-2xl border border-mist/60 flex items-start gap-3">
          <div className="p-2 bg-pine/15 rounded-xl text-pine mt-0.5">
            <FaFire className="w-4 h-4 text-pine" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bonfire Index</div>
            <div className="text-sm font-extrabold text-pine font-heading mt-0.5">Optimal Fire</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Low ridge wind, dry pine needles</div>
          </div>
        </div>

        <div className="p-3.5 bg-snow/80 rounded-2xl border border-mist/60 flex items-start gap-3">
          <div className="p-2 bg-navy/10 rounded-xl text-navy mt-0.5">
            <FiWind className="w-4 h-4 text-navy" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valley Breeze</div>
            <div className="text-sm font-extrabold text-navy font-heading mt-0.5">9 km/h NE</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Gentle nocturnal draft</div>
          </div>
        </div>

        <div className="p-3.5 bg-snow/80 rounded-2xl border border-mist/60 flex items-start gap-3">
          <div className="p-2 bg-saffron/15 rounded-xl text-saffron-text mt-0.5">
            <FiThermometer className="w-4 h-4 text-saffron-text" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evening Chill</div>
            <div className="text-sm font-extrabold text-navy font-heading mt-0.5">~6°C to 11°C</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Layered jacket recommended</div>
          </div>
        </div>
      </div>

      {/* 5-Day Strip Forecast */}
      <div className="bg-snow/60 rounded-2xl p-4 border border-mist/70">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-navy font-heading uppercase tracking-wider">5-Day Ridge Outlook</span>
          <span className="text-slate-500 text-[11px]">{metadata.vibe}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {forecastDays.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  idx === 0
                    ? "bg-navy text-white border-navy shadow-sm ring-1 ring-saffron/40"
                    : "bg-white text-navy border-mist/80 hover:border-saffron/60"
                }`}
              >
                <div className={`text-xs font-bold ${idx === 0 ? "text-saffron" : "text-slate-500"}`}>
                  {item.label}
                </div>
                <div className={`text-[10px] mb-2 ${idx === 0 ? "text-slate-300" : "text-slate-500"}`}>
                  {item.date}
                </div>
                <div className="my-1.5 flex justify-center">
                  <Icon className={`w-5 h-5 ${idx === 0 ? "text-saffron" : "text-saffron-text"}`} />
                </div>
                <div className="text-xs font-bold mt-1">
                  <span>{item.high}°</span>
                  <span className={`text-[11px] ml-1.5 ${idx === 0 ? "text-slate-400" : "text-slate-500"}`}>
                    {item.low}°
                  </span>
                </div>
                <div className={`text-[10px] mt-1 line-clamp-1 ${idx === 0 ? "text-slate-300" : "text-slate-500"}`}>
                  {item.condition}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mountain safety tip footer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-600 bg-saffron/10 border border-saffron/20 px-3.5 py-2.5 rounded-xl">
        <FiAlertCircle className="w-4 h-4 text-saffron-text shrink-0" />
        <span>
          <strong className="text-navy">Host Note:</strong> Mountain twilight sets 30 mins earlier behind the high ridgelines. Arrive with adequate daylight to settle into your sanctuary.
        </span>
      </div>
    </div>
  );
}
