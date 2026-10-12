/**
 * Reusable Thikana Brand Logo Component
 * Incorporates the shelter-mountain-trail emblem and custom typography from Image 3
 * Perfectly color-harmonized with Thikana's Himalayan Dusk & Saffron palette
 * 
 * @param {'full' | 'icon' | 'badge' | 'white' | 'navbar'} variant - Logo style variant
 * @param {string} className - Optional sizing and styling classes
 * @param {boolean} showTagline - Whether to display tagline subtitle
 */
export default function Logo({
  variant = "full",
  className = "h-8 w-auto",
  showTagline = true,
}) {
  // 1. Icon Only (Dark backgrounds: Snow/White emblem on navy background)
  if (variant === "icon-white" || variant === "icon-dark-bg") {
    return (
      <img
        src="/logo-icon-white.svg"
        alt="Thikana Emblem"
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 1b. Icon Only (Light backgrounds: Navy emblem on snow/white background)
  if (variant === "icon") {
    return (
      <img
        src="/logo-icon.svg"
        alt="Thikana Emblem"
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 2. White / Dark-background variant (e.g. Navbar, Footer, Dark Modals)
  if (variant === "white" || variant === "navbar") {
    return (
      <img
        src="/logo-navbar.svg"
        alt="Thikana - Your Place. Your Escape."
        className={`object-contain select-none ${className}`}
      />
    );
  }

  // 3. Full Badge / Light background variant (e.g. Invoices, Light sections, Modals)
  return (
    <img
      src="/logo-full.svg"
      alt="Thikana - Your Place. Your Escape."
      className={`object-contain select-none ${className}`}
    />
  );
}
