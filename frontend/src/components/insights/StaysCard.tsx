"use client";

import { motion } from "framer-motion";
import { ExternalLink, LocateFixed, Phone, ShieldAlert, ShieldCheck, ShieldQuestion, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { cn } from "@/lib/utils/cn";
import type { Stay, StaySafety } from "@/types/insights";

const VISIBLE_STAYS = 6;

const safetyBadges: Record<StaySafety, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  good: {
    label: "Safe area",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Icon: ShieldCheck,
  },
  caution: {
    label: "Landslide nearby",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Icon: ShieldAlert,
  },
  risky: {
    label: "Landslide very close",
    className: "bg-red-500/10 text-red-700 dark:text-red-300",
    Icon: ShieldAlert,
  },
  unknown: {
    label: "Safety unknown",
    className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    Icon: ShieldQuestion,
  },
};

function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface StaysCardProps {
  stays: Stay[] | null;
  isLoading: boolean;
  errorMessage: string | null;
  onShowOnMap: (stayId: string) => void;
  delay?: number;
}

export function StaysCard({ stays, isLoading, errorMessage, onShowOnMap, delay = 0 }: StaysCardProps) {
  const visible = stays?.slice(0, VISIBLE_STAYS) ?? [];

  return (
    <Card delay={delay}>
      <CardHeader title="Where to stay" />
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Ranked by star rating, distance from your destination, and distance from recorded landslides.
      </p>

      {isLoading && (
        <div className="mt-5 space-y-3" aria-label="Loading places to stay">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      )}

      {!isLoading && (!stays || stays.length === 0) && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {errorMessage ?? "OpenStreetMap lists no named places to stay within 15 km of this destination."}
        </p>
      )}

      <ol className="mt-5 space-y-3">
        {visible.map((stay, index) => {
          const badge = safetyBadges[stay.safety];

          return (
            <motion.li
              key={stay.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + index * 0.06 }}
              className="glass-surface flex flex-wrap items-center gap-3 rounded-xl p-3 sm:flex-nowrap"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md",
                  index < 5
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30"
                    : "bg-violet-500 shadow-violet-500/30",
                )}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{stay.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="capitalize">{stay.kind}</span>
                  {stay.stars !== null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      {stay.stars}
                    </span>
                  )}
                  <span>{formatKm(stay.distanceKm)} from center</span>
                  {stay.nearestLandslideKm !== null && (
                    <span>Nearest landslide {formatKm(stay.nearestLandslideKm)}</span>
                  )}
                </p>
              </div>

              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
                  badge.className,
                )}
              >
                <badge.Icon className="h-3 w-3" aria-hidden="true" />
                {badge.label}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onShowOnMap(stay.id)}
                  aria-label={`Show ${stay.name} on the map`}
                  title="Show on map"
                  className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <LocateFixed className="h-4 w-4" aria-hidden="true" />
                </button>
                {stay.website && (
                  <a
                    href={stay.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${stay.name} website`}
                    title="Website"
                    className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
                {stay.phone && (
                  <a
                    href={`tel:${stay.phone}`}
                    aria-label={`Call ${stay.name}`}
                    title={stay.phone}
                    className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      {stays && stays.length > 0 && (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          Data from OpenStreetMap, which has no guest reviews. Check reviews and current availability
          before booking.
          {stays.length > VISIBLE_STAYS && ` ${stays.length - VISIBLE_STAYS} more are shown on the map.`}
        </p>
      )}
    </Card>
  );
}
