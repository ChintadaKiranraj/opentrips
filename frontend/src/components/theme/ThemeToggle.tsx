"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useSyncExternalStore, type MouseEvent } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils/cn";
import {
  readThemePreference,
  subscribeThemePreference,
  writeThemePreference,
  type ThemePreference,
} from "@/lib/utils/theme";

const options: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "system", label: "System theme", Icon: Monitor },
  { value: "dark", label: "Dark theme", Icon: Moon },
];

const noopSubscribe = () => () => {};

/**
 * Segmented light, system, and dark switch. Where supported, the new theme is
 * revealed as a circle expanding from the clicked button.
 */
export function ThemeToggle() {
  const reduceMotion = useReducedMotion();
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    () => "system" as const,
  );
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  function handleSelect(next: ThemePreference, event: MouseEvent<HTMLButtonElement>) {
    if (next === preference) return;

    if (reduceMotion || typeof document.startViewTransition !== "function") {
      writeThemePreference(next);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const root = document.documentElement;
    root.classList.add("theme-switching");

    const transition = document.startViewTransition(() => {
      flushSync(() => writeThemePreference(next));
    });

    // An interrupted transition (navigation, hidden tab) rejects; the theme is already applied.
    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 550,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});

    transition.finished
      .catch(() => {})
      .finally(() => root.classList.remove("theme-switching"));
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="glass-surface relative flex items-center gap-0.5 rounded-full p-1"
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = isHydrated && preference === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            aria-label={label}
            title={label}
            onClick={(event) => handleSelect(value, event)}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
              isActive
                ? "text-white dark:text-zinc-950"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="theme-toggle-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30 dark:from-emerald-400 dark:to-teal-400 dark:shadow-emerald-400/20"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isActive ? "active" : "idle"}
                className="relative"
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.span>
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
