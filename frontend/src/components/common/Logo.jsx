import React from "react";

/**
 * Reusable Thikana Brand Logo Component
 * 
 * @param {'full' | 'icon' | 'white'} variant - Logo style variant
 * @param {string} className - Optional sizing and styling classes
 * @param {boolean} showTagline - Whether to display "Mera Thikana" subtitle
 */
export default function Logo({ variant = "full", className = "h-8 w-auto", showTagline = true }) {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Thikana"
      >
        <defs>
          <linearGradient id="logo-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>
        </defs>
        {/* Rounded Map Pin */}
        <path
          d="M 50 92 C 46 85 20 57 20 40 A 30 30 0 1 1 80 40 C 80 57 54 85 50 92 Z"
          fill="url(#logo-icon-grad)"
        />
        {/* Amber Sun */}
        <circle cx="49" cy="33" r="5.5" fill="#F4A93B" />
        {/* White Mountain Peaks */}
        <path d="M 27 58 L 42 34 L 50 45 L 61 37 L 73 58 Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (variant === "white") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-auto aspect-square flex-shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* White Pin */}
          <path
            d="M 50 92 C 46 85 20 57 20 40 A 30 30 0 1 1 80 40 C 80 57 54 85 50 92 Z"
            fill="#FFFFFF"
          />
          {/* Amber Sun */}
          <circle cx="49" cy="33" r="5.5" fill="#F4A93B" />
          {/* Dark Emerald Cutout Peaks */}
          <path d="M 27 58 L 42 34 L 50 45 L 61 37 L 73 58 Z" fill="#064e3b" />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-heading font-bold text-white tracking-tight text-xl leading-none">
            Thikana
          </span>
          {showTagline && (
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-[#FAF7F0]/80 mt-0.5">
              Mera Thikana
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: variant === "full" (For light or neutral backgrounds)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto aspect-square flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-full-pin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>
        </defs>
        {/* Rounded Map Pin */}
        <path
          d="M 50 92 C 46 85 20 57 20 40 A 30 30 0 1 1 80 40 C 80 57 54 85 50 92 Z"
          fill="url(#logo-full-pin-grad)"
        />
        {/* Amber Sun */}
        <circle cx="49" cy="33" r="5.5" fill="#F4A93B" />
        {/* White Mountain Peaks */}
        <path d="M 27 58 L 42 34 L 50 45 L 61 37 L 73 58 Z" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-none text-left">
        <span className="font-heading font-bold text-emerald-950 tracking-tight text-xl leading-none">
          Thikana
        </span>
        {showTagline && (
          <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-emerald-600 mt-0.5">
            Mera Thikana
          </span>
        )}
      </div>
    </div>
  );
}
