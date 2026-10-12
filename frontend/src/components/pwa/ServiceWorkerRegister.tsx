"use client";

import { useEffect } from "react";

/**
 * Registers the offline cache for saved-plan pages (B5). Fails silently if
 * service workers aren't supported, this is a progressive enhancement, not
 * something the app depends on to function.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline caching is a nice-to-have. Not supported or blocked by the
      // browser shouldn't ever break the rest of the app.
    });
  }, []);

  return null;
}
