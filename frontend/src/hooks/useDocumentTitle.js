import { useEffect } from "react";

/**
 * Updates document.title and meta description dynamically for SEO and UX.
 * @param {string} title - Page title (e.g., "Home", "Explore Scenic Plots", or full "Home | Thikana")
 * @param {string} [description] - Optional meta description for the page
 */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) {
      document.title = title.includes("Thikana") ? title : `${title} | Thikana`;
    }
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }
  }, [title, description]);
}

export default useDocumentTitle;
