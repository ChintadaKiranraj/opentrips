"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { cn } from "@/lib/utils/cn";
import { weatherLabel } from "@/lib/insights/weather-codes";
import type { WeatherDay, WeatherInsight, WeatherSeverity } from "@/types/insights";

function iconFor(code: number): LucideIcon {
  if (code === 0 || code === 1) return Sun;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return CloudRain;
}

const severityStyles: Record<WeatherSeverity, string> = {
  clear: "ring-emerald-500/20",
  light: "ring-sky-500/30",
  moderate: "ring-amber-500/50 bg-amber-500/5",
  severe: "ring-red-500/60 bg-red-500/5",
};

const severityText: Record<WeatherSeverity, string> = {
  clear: "text-emerald-600 dark:text-emerald-400",
  light: "text-sky-600 dark:text-sky-400",
  moderate: "text-amber-600 dark:text-amber-400",
  severe: "text-red-600 dark:text-red-400",
};

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function warningFor(days: WeatherDay[]) {
  const severe = days.filter((d) => d.severity === "severe");
  const moderate = days.filter((d) => d.severity === "moderate");
  const flagged = severe.length > 0 ? severe : moderate;
  if (flagged.length === 0) return null;

  const dates = flagged.map((d) => formatDay(d.date)).join(", ");
  return severe.length > 0
    ? `Storms or very heavy rain expected on ${dates}. Heavy rain sharply raises landslide risk, so avoid steep slopes and hill roads on these days.`
    : `Heavy rain or strong wind expected on ${dates}. Keep plans flexible and check local advisories.`;
}

interface TripWeatherCardProps {
  weather: WeatherInsight | null;
  isLoading: boolean;
  errorMessage: string | null;
  delay?: number;
}

export function TripWeatherCard({ weather, isLoading, errorMessage, delay = 0 }: TripWeatherCardProps) {
  const warning = weather ? warningFor(weather.days) : null;

  return (
    <Card delay={delay}>
      <CardHeader title="Weather during your trip" />

      {isLoading && (
        <div className="mt-5 flex gap-3 overflow-hidden" aria-label="Loading forecast">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-36 w-28 shrink-0 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
      )}

      {!isLoading && !weather && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {errorMessage ?? "The forecast is unavailable right now."}
        </p>
      )}

      {weather && (
        <>
          {!weather.coversTripDates && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Your trip is more than 16 days away, so this shows the next 7 days. Check again closer to
              your trip for an accurate forecast.
            </p>
          )}

          {warning && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-500/20 dark:text-red-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {warning}
            </motion.p>
          )}

          <div className="-mx-1 mt-5 flex gap-3 overflow-x-auto px-1 pb-2">
            {weather.days.map((day, index) => {
              const Icon = iconFor(day.weatherCode);

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: delay + 0.1 + index * 0.05 }}
                  whileHover={{ y: -3 }}
                  className={cn(
                    "glass-surface w-32 shrink-0 rounded-xl p-3 text-center ring-1",
                    severityStyles[day.severity],
                  )}
                >
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{formatDay(day.date)}</p>
                  <Icon className={cn("mx-auto mt-2 h-7 w-7", severityText[day.severity])} aria-hidden="true" />
                  <p className="mt-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
                    {weatherLabel(day.weatherCode)}
                  </p>
                  {day.tempMaxC !== null && day.tempMinC !== null && (
                    <p className="mt-1.5 text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">
                      {Math.round(day.tempMaxC)}°{" "}
                      <span className="font-normal text-zinc-500 dark:text-zinc-400">{Math.round(day.tempMinC)}°</span>
                    </p>
                  )}
                  <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400">
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {day.precipitationMm.toFixed(1)} mm
                    {day.precipitationChance !== null && `, ${day.precipitationChance}%`}
                  </p>
                  {day.windMaxKmh !== null && (
                    <p className="flex items-center justify-center gap-1 text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400">
                      <Wind className="h-3 w-3" aria-hidden="true" />
                      {Math.round(day.windMaxKmh)} km/h
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Live forecast from Open-Meteo for the destination. The map shows the worst conditions
            across the surrounding area.
          </p>
        </>
      )}
    </Card>
  );
}
