"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StaggerItemProps {
  index: number;
  baseDelay?: number;
  stagger?: number;
  className?: string;
  children: ReactNode;
}

/** Fade/slide-up entrance for one item in a list, offset by its position. */
export function StaggerItem({ index, baseDelay = 0, stagger = 0.08, className, children }: StaggerItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: baseDelay + index * stagger }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
