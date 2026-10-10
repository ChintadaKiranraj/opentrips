"use client";

import { motion, useMotionTemplate, useMotionValue, type HTMLMotionProps } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  delay?: number;
  /** Adds a hover lift + shadow bloom. Off by default to keep static surfaces calm. */
  hover?: boolean;
}

export function Card({
  className = "",
  delay = 0,
  hover = false,
  onMouseMove,
  children,
  ...props
}: CardProps) {
  const pointerX = useMotionValue(-1000);
  const pointerY = useMotionValue(-1000);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${pointerX}px ${pointerY}px, var(--spotlight), transparent 70%)`;

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
    pointerY.set(event.clientY - rect.top);
    onMouseMove?.(event);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={
        hover ? { y: -4, transition: { type: "spring", stiffness: 300, damping: 22 } } : undefined
      }
      onMouseMove={handleMouseMove}
      className={cn(
        "glass-surface group/card relative isolate rounded-2xl p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.4),0_20px_60px_-24px_rgba(16,185,129,0.25)] transition-shadow dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05),0_20px_60px_-24px_rgba(16,185,129,0.15)]",
        hover &&
          "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.4),0_28px_70px_-20px_rgba(16,185,129,0.35)]",
        className,
      )}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      />
      {children}
    </motion.div>
  );
}
