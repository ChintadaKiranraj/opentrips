"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, ShieldX, type LucideIcon } from "lucide-react";

import type { RiskVerdict } from "@/types/risk";

interface VerdictConfig {
  icon: LucideIcon;
  classes: string;
  glow: string;
}

const verdictConfig: Record<RiskVerdict, VerdictConfig> = {
  GO: {
    icon: ShieldCheck,
    classes:
      "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300",
    glow: "shadow-[0_0_36px_-10px_rgba(16,185,129,0.55)]",
  },
  CAUTION: {
    icon: ShieldAlert,
    classes:
      "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300",
    glow: "shadow-[0_0_36px_-10px_rgba(245,158,11,0.55)]",
  },
  WAIT: {
    icon: ShieldX,
    classes:
      "bg-gradient-to-br from-red-500/15 to-red-500/5 text-red-700 ring-1 ring-inset ring-red-500/30 dark:text-red-300",
    glow: "shadow-[0_0_36px_-10px_rgba(239,68,68,0.55)]",
  },
};

export function VerdictBadge({ verdict }: { verdict: RiskVerdict }) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  return (
    <motion.span
      key={verdict}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base font-bold tracking-wide ${config.classes} ${config.glow}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {verdict}
    </motion.span>
  );
}
