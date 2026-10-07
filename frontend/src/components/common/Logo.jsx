import React from "react";

/**
 * Reusable Thikana Brand Logo Component
 * Incorporates the arched mountain campsite emblem and custom dual-tone typography
 * 
 * @param {'full' | 'icon' | 'badge' | 'white'} variant - Logo style variant
 * @param {string} className - Optional sizing and styling classes
 * @param {boolean} showTagline - Whether to display tagline subtitle
 */
export default function Logo({
  variant = "full",
  className = "h-8 w-auto",
  showTagline = true,
}) {
  // 1. Icon Only (Arched Badge Emblem)
  if (variant === "icon") {
    return (
      <img
        src="/thikana-icon.png"
        alt="Thikana Emblem"
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 2. Full Badge (Arched Emblem with THIKANA beneath)
  if (variant === "badge") {
    return (
      <img
        src="/thikana-logo.png"
        alt="Thikana"
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 3. White / Dark-background variant (e.g. Footer)
  if (variant === "white") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <img
          src="/thikana-icon.png"
          alt="Thikana Emblem"
          className="h-full w-auto aspect-square object-contain select-none drop-shadow-sm"
        />
        <div className="flex flex-col leading-none text-left">
          <span className="font-heading font-black tracking-tight text-xl leading-none text-white">
            Thikana
          </span>
          {showTagline && (
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-emerald-300/80 mt-0.5">
              Mera Thikana
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Default: variant === "full" (For light/neutral backgrounds like Navbar)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/thikana-icon.png"
        alt="Thikana Emblem"
        className="h-full w-auto aspect-square object-contain select-none drop-shadow-sm"
      />
      <div className="flex flex-col leading-none text-left">
        <span className="font-heading font-black tracking-tight text-xl leading-none text-[#0E382C]">
          Thikana
        </span>
        {showTagline && (
          <span className="text-[9px] font-bold tracking-[0.16em] uppercase text-emerald-800/80 mt-0.5">
            Mera Thikana
          </span>
        )}
      </div>
    </div>
  );
}
