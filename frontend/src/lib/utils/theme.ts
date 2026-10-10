export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs inline in <head> before first paint so the stored theme is applied
 * without a light/dark flash. Must stay dependency-free and in sync with
 * `applyThemePreference` below.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("${DARK_QUERY}").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyThemePreference(preference: ThemePreference) {
  const isDark =
    preference === "dark" || (preference === "system" && window.matchMedia(DARK_QUERY).matches);
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

const listeners = new Set<() => void>();

export function writeThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this page.
  }
  applyThemePreference(preference);
  listeners.forEach((listener) => listener());
}

/** `useSyncExternalStore` subscriber: follows OS changes and other tabs. */
export function subscribeThemePreference(listener: () => void) {
  listeners.add(listener);

  const media = window.matchMedia(DARK_QUERY);
  const handleSystemChange = () => {
    if (readThemePreference() === "system") applyThemePreference("system");
    listener();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyThemePreference(readThemePreference());
    listener();
  };

  media.addEventListener("change", handleSystemChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorage);
  };
}
