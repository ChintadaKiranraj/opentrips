"use client";

import { motion } from "framer-motion";

interface MockDataBadgeProps {
  label?: string;
}

/** Flags any value on screen that comes from a mock/demo API response. */
export function MockDataBadge({ label = "Simulated data" }: MockDataBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300"
    >
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-amber-500"
        aria-hidden="true"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {label}
    </motion.span>
  );
}
