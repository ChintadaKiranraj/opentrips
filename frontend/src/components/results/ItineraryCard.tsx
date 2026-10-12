"use client";

import { motion } from "framer-motion";
import { Backpack, CheckCircle2, Coffee, Footprints, Mountain, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { LabeledList } from "@/components/results/LabeledList";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { DisclaimerText } from "@/components/ui/DisclaimerText";
import { MockDataBadge } from "@/components/ui/MockDataBadge";
import { StaggerItem } from "@/components/ui/StaggerItem";
import type { PlanDay, PlanResponse } from "@/types/plan";

const ICON_CLASSNAME = "mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400";

/**
 * Returns the icon element directly rather than a component reference, so
 * no component type gets created during render (react-hooks/static-components).
 */
function activityIcon(activity: string): ReactNode {
  const name = activity.toLowerCase();
  if (
    name.includes("coffee") ||
    name.includes("breakfast") ||
    name.includes("lunch") ||
    name.includes("dinner") ||
    name.includes("meal")
  ) {
    return <Coffee className={ICON_CLASSNAME} aria-hidden="true" />;
  }
  if (
    name.includes("trek") ||
    name.includes("hike") ||
    name.includes("climb") ||
    name.includes("summit") ||
    name.includes("peak")
  ) {
    return <Mountain className={ICON_CLASSNAME} aria-hidden="true" />;
  }
  return <Footprints className={ICON_CLASSNAME} aria-hidden="true" />;
}

function DayRow({ day, index, baseDelay }: { day: PlanDay; index: number; baseDelay: number }) {
  return (
    <StaggerItem index={index} baseDelay={baseDelay} className="relative pl-10">
      <span className="absolute top-0.5 left-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-emerald-500/30 bg-white text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-400/30 dark:bg-zinc-900 dark:text-emerald-300">
        {day.day}
      </span>
      <div className="glass-surface rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Day {day.day}, {day.date}
        </p>
        <div className="mt-2 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {activityIcon(day.activity)}
          <span>
            {day.activity}{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">({day.distanceKm} km)</span>
          </span>
        </div>
      </div>
    </StaggerItem>
  );
}

export function ItineraryCard({ plan, delay = 0 }: { plan: PlanResponse; delay?: number }) {
  return (
    <Card delay={delay}>
      <CardHeader
        title={`Itinerary from ${plan.startDate} to ${plan.endDate}`}
        badge={plan.isMockData ? <MockDataBadge label="Demo content" /> : undefined}
      />

      <div
        className={`mt-4 flex items-center gap-1.5 text-xs font-medium ${
          plan.checksPassed
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-amber-700 dark:text-amber-400"
        }`}
      >
        {plan.checksPassed ? (
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {plan.checksPassed
          ? "Constraints check passed: budget and distance per day fit what you asked for."
          : "Constraints check flagged this plan: review distance or budget before committing."}
      </div>

      <div className="relative mt-6 space-y-5 pl-1">
        <motion.div
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-[22px] w-px origin-top bg-gradient-to-b from-emerald-500/60 via-teal-500/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: "easeOut" }}
        />

        {plan.days.map((day, index) => (
          <DayRow key={day.day} day={day} index={index} baseDelay={delay + 0.15} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="glass-surface rounded-xl p-4">
          <LabeledList
            title="Packing checklist"
            items={plan.packing}
            icon={<Backpack className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
          />
        </div>
        <div className="glass-surface rounded-xl p-4">
          <LabeledList
            title="Warnings"
            items={plan.warnings}
            icon={
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            }
          />
        </div>
      </div>

      <div className="glass-surface mt-6 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
            Estimated budget: {plan.budgetEstimate.currency} {plan.budgetEstimate.total.toLocaleString("en-IN")}
          </h3>
        </div>
      </div>

      <DisclaimerText>{plan.disclaimer}</DisclaimerText>
    </Card>
  );
}
