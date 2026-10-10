"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

import type { RiskVerdict } from "@/types/risk";

interface GaugeColors {
  stroke: string;
  glow: string;
  text: string;
}

const verdictColors: Record<RiskVerdict, GaugeColors> = {
  GO: { stroke: "#10b981", glow: "rgba(16,185,129,0.5)", text: "text-emerald-600 dark:text-emerald-400" },
  CAUTION: { stroke: "#f59e0b", glow: "rgba(245,158,11,0.5)", text: "text-amber-600 dark:text-amber-400" },
  WAIT: { stroke: "#ef4444", glow: "rgba(239,68,68,0.5)", text: "text-red-600 dark:text-red-400" },
};

const RADIUS = 80;
const CIRCUMFERENCE = Math.PI * RADIUS;

/**
 * Animated semicircular risk gauge with a count-up score (0-100), colored by
 * verdict severity. The emotional centerpiece of the results page.
 */
export function RiskGauge({ score, verdict }: { score: number; verdict: RiskVerdict }) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(Math.max(score, 0), 1);
  const colors = verdictColors[verdict];

  const progress = useMotionValue(0);
  const spring = useSpring(progress, { stiffness: 90, damping: 20, mass: 0.6 });
  const dashOffset = useTransform(spring, (value) => CIRCUMFERENCE - value * CIRCUMFERENCE);
  const [animatedDisplay, setAnimatedDisplay] = useState(0);

  useEffect(() => {
    progress.set(clamped);
  }, [clamped, progress]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (value) => {
      setAnimatedDisplay(Math.round(value * 100));
    });
    return unsubscribe;
  }, [spring]);

  const staticOffset = CIRCUMFERENCE - clamped * CIRCUMFERENCE;
  const display = reduceMotion ? Math.round(clamped * 100) : animatedDisplay;

  return (
    <div className="relative mx-auto flex w-full max-w-[240px] flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full overflow-visible">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          strokeWidth={14}
          strokeLinecap="round"
          className="text-zinc-200 dark:text-zinc-800"
        />
        {reduceMotion ? (
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={staticOffset}
            style={{ filter: `drop-shadow(0 0 10px ${colors.glow})` }}
          />
        ) : (
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{
              strokeDashoffset: dashOffset,
              filter: `drop-shadow(0 0 10px ${colors.glow})`,
            }}
          />
        )}
      </svg>
      <div className="absolute bottom-1 flex flex-col items-center">
        <span className={`text-4xl font-bold tracking-tight tabular-nums ${colors.text}`}>{display}</span>
        <span className="text-[11px] tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          risk score out of 100
        </span>
      </div>
    </div>
  );
}
