import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollManager: Handles automatic smooth scrolling to top on route change,
 * and smooth scrolling to specific element ID when a hash is present in the URL.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace("#", "");
      // Small timeout ensures the target element is mounted in DOM
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);

      return () => clearTimeout(timer);
    } else {
      // Smooth scroll to top on normal route transitions
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);

  return null;
}
