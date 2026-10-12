"use client";

import { motion } from "framer-motion";
import { BedDouble, CloudRain, ExternalLink, Loader2, MapPin, Mountain, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import type { Ref } from "react";

import type { MapLayerId, MapLayerVisibility, StayFocusRequest } from "@/components/map/map-layers";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { cn } from "@/lib/utils/cn";
import type { GeocodeResult } from "@/types/geo";
import type { AreaInsights } from "@/types/insights";
import type { RiskVerdict } from "@/types/risk";

const DestinationMap = dynamic(() => import("@/components/map/DestinationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-zinc-200/60 text-sm text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
      Loading map…
    </div>
  ),
});

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

interface LayerChip {
  id: MapLayerId;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
}

const layerChips: LayerChip[] = [
  {
    id: "landslides",
    label: "Past landslides",
    Icon: Mountain,
    activeClass: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  {
    id: "weather",
    label: "Bad weather",
    Icon: CloudRain,
    activeClass: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    id: "stays",
    label: "Places to stay",
    Icon: BedDouble,
    activeClass: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
];

function layerCount(insights: AreaInsights | null, id: MapLayerId): string | null {
  if (!insights) return null;
  if (id === "landslides") return insights.landslides.data ? String(insights.landslides.data.length) : null;
  if (id === "stays") return insights.stays.data ? String(insights.stays.data.length) : null;
  const grid = insights.weather.data?.grid;
  return grid ? String(grid.filter((cell) => cell.severity === "moderate" || cell.severity === "severe").length) : null;
}

const legend = [
  { swatch: "rounded-full bg-red-500 ring-2 ring-red-900/60", label: "Recorded landslide (bigger means more fatalities)" },
  { swatch: "rounded-sm bg-amber-500/60", label: "Heavy rain or strong wind forecast" },
  { swatch: "rounded-sm bg-red-500/60", label: "Storm or very heavy rain forecast" },
  { swatch: "rounded-full bg-gradient-to-br from-amber-400 to-orange-500", label: "Top 5 places to stay" },
  { swatch: "rounded-full bg-violet-500", label: "Other places to stay" },
];

interface DestinationMapCardProps {
  location: GeocodeResult;
  verdict: RiskVerdict;
  insights: AreaInsights | null;
  isLoading: boolean;
  errorMessage: string | null;
  layers: MapLayerVisibility;
  onToggleLayer: (id: MapLayerId) => void;
  focusRequest: StayFocusRequest | null;
  mapRef?: Ref<HTMLDivElement>;
  delay?: number;
}

export function DestinationMapCard({
  location,
  verdict,
  insights,
  isLoading,
  errorMessage,
  layers,
  onToggleLayer,
  focusRequest,
  mapRef,
  delay = 0,
}: DestinationMapCardProps) {
  const { latitude, longitude } = location;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=13/${latitude}/${longitude}`;
  const layerErrors = insights
    ? [insights.landslides.error, insights.weather.error, insights.stays.error].filter(Boolean)
    : [];

  return (
    <Card delay={delay}>
      <CardHeader title="Destination map" />
      <p className="mt-2 flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {location.displayName}
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Map layers">
        {layerChips.map(({ id, label, Icon, activeClass }, index) => {
          const isActive = layers[id];
          const count = layerCount(insights, id);

          return (
            <motion.button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggleLayer(id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.15 + index * 0.06 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500",
                isActive
                  ? activeClass
                  : "border-black/10 text-zinc-500 hover:text-zinc-800 dark:border-white/10 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-label="Loading" />
              ) : (
                count !== null && (
                  <span className="rounded-full bg-black/5 px-1.5 tabular-nums dark:bg-white/10">{count}</span>
                )
              )}
            </motion.button>
          );
        })}
      </div>

      <div
        ref={mapRef}
        className="isolate mt-4 h-80 scroll-mt-24 overflow-hidden rounded-xl ring-1 ring-black/5 sm:h-[26rem] dark:ring-white/10"
      >
        <DestinationMap
          location={location}
          verdict={verdict}
          insights={insights}
          layers={layers}
          focusRequest={focusRequest}
        />
      </div>

      {(errorMessage || layerErrors.length > 0) && (
        <p role="status" className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          {errorMessage ?? layerErrors.join(" ")}
        </p>
      )}

      <ul className="mt-4 grid gap-x-4 gap-y-1.5 text-xs text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
        {legend.map(({ swatch, label }) => (
          <li key={label} className="flex items-center gap-2">
            <span className={cn("h-3 w-3 shrink-0", swatch)} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="tabular-nums">
          {formatCoordinate(latitude, "N", "S")}, {formatCoordinate(longitude, "E", "W")}
        </span>
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-emerald-700 transition-colors hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          View on OpenStreetMap
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </Card>
  );
}
