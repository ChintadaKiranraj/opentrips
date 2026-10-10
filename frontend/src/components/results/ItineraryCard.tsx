"use client";

import { motion } from "framer-motion";
import { Backpack, Coffee, Footprints, Mountain, ShieldCheck, Wallet } from "lucide-react";

import { LabeledList } from "@/components/results/LabeledList";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { DisclaimerText } from "@/components/ui/DisclaimerText";
import { MockDataBadge } from "@/components/ui/MockDataBadge";
import { StaggerItem } from "@/components/ui/StaggerItem";
import type { DifficultyLevel, OutdoorActivity, PlanResponse } from "@/types/plan";

const difficultyDot: Record<DifficultyLevel, string> = {
  easy: "bg-emerald-500",
  moderate: "bg-amber-500",
  challenging: "bg-red-500",
};

function activityIcon(activity: OutdoorActivity) {
  const name = activity.name.toLowerCase();
  if (
    name.includes("coffee") ||
    name.includes("breakfast") ||
    name.includes("lunch") ||
    name.includes("dinner") ||
    name.includes("meal")
  ) {
    return Coffee;
  }
  if (
    name.includes("trek") ||
    name.includes("hike") ||
    name.includes("climb") ||
    name.includes("summit") ||
    name.includes("peak")
  ) {
    return Mountain;
  }
  return Footprints;
}

export function ItineraryCard({ plan, delay = 0 }: { plan: PlanResponse; delay?: number }) {
  return (
    <Card delay={delay}>
      <CardHeader
        title={`Itinerary from ${plan.startDate} to ${plan.endDate}`}
        badge={<MockDataBadge label="Demo content" />}
      />

      <div className="relative mt-6 space-y-5 pl-1">
        <motion.div
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-[22px] w-px origin-top bg-gradient-to-b from-emerald-500/60 via-teal-500/40 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, delay: delay + 0.1, ease: "easeOut" }}
        />

        {plan.itinerary.map((day, index) => (
          <StaggerItem key={day.date} index={index} baseDelay={delay + 0.15} className="relative pl-10">
            <span className="absolute top-0.5 left-0 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-emerald-500/30 bg-white text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-400/30 dark:bg-zinc-900 dark:text-emerald-300">
              {index + 1}
            </span>
            <div className="glass-surface rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {day.dayLabel}, {day.date}
              </p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{day.summary}</p>
              <ul className="mt-3 space-y-2">
                {day.activities.map((activity) => {
                  const Icon = activityIcon(activity);
                  return (
                    <li
                      key={activity.name}
                      className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {activity.name}
                        </span>
                        , {activity.durationMinutes} min,{" "}
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${difficultyDot[activity.difficulty]}`}
                            aria-hidden="true"
                          />
                          {activity.difficulty}
                        </span>
                        . {activity.notes}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="glass-surface rounded-xl p-4">
          <LabeledList
            title="Packing checklist"
            items={plan.packingChecklist}
            icon={<Backpack className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
          />
        </div>
        <div className="glass-surface rounded-xl p-4">
          <LabeledList
            title="Safety notes"
            items={plan.safetyNotes}
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
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Stay {plan.budgetEstimate.breakdown.stay}</span>
          <span>Food {plan.budgetEstimate.breakdown.food}</span>
          <span>Local transport {plan.budgetEstimate.breakdown.localTransport}</span>
          <span>Misc {plan.budgetEstimate.breakdown.misc}</span>
        </p>
      </div>

      <DisclaimerText>{plan.disclaimer}</DisclaimerText>
    </Card>
  );
}
