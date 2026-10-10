"use client";

import { motion } from "framer-motion";
import { CloudRain, Droplets, Gauge, Waves } from "lucide-react";

import { RiskGauge } from "@/components/results/RiskGauge";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { DisclaimerText } from "@/components/ui/DisclaimerText";
import { MockDataBadge } from "@/components/ui/MockDataBadge";
import { StaggerItem } from "@/components/ui/StaggerItem";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import type { RiskResponse, RiskVerdict } from "@/types/risk";

const verdictCopy: Record<RiskVerdict, string> = {
  GO: "Conditions look favorable.",
  CAUTION: "Proceed with extra care.",
  WAIT: "Hold off on this trip.",
};

export function RiskSummaryCard({ risk, delay = 0 }: { risk: RiskResponse; delay?: number }) {
  const metrics = risk.modelMetrics;

  const rainfallStats = [
    {
      label: "Last 24h",
      value: risk.rainfallFeatures.last24hRainfallMm,
      unit: " mm",
      max: 100,
      icon: CloudRain,
    },
    {
      label: "Last 72h",
      value: risk.rainfallFeatures.last72hRainfallMm,
      unit: " mm",
      max: 200,
      icon: Droplets,
    },
    {
      label: "Forecast",
      value: risk.rainfallFeatures.forecastRainfallMm,
      unit: " mm",
      max: 100,
      icon: Waves,
    },
    {
      label: "Soil saturation",
      value: risk.rainfallFeatures.soilSaturationIndex,
      unit: "",
      max: 1,
      icon: Gauge,
      decimals: 2,
    },
  ];

  return (
    <Card delay={delay}>
      <CardHeader title={`Landslide risk in ${risk.destination}`} badge={<MockDataBadge />} />

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <RiskGauge score={risk.riskScore} verdict={risk.verdict} />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={risk.verdict} />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{verdictCopy[risk.verdict]}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{risk.explanation}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rainfallStats.map((stat, index) => {
          const Icon = stat.icon;
          const pct = Math.min(Math.max(stat.value / stat.max, 0), 1) * 100;

          return (
            <StaggerItem
              key={stat.label}
              index={index}
              baseDelay={delay + 0.15}
              stagger={0.07}
              className="glass-surface rounded-xl px-3 py-3 text-center"
            >
              <Icon className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p className="mt-1.5 text-[11px] tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {stat.value.toFixed(stat.decimals ?? 0)}
                {stat.unit}
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: delay + 0.25 + index * 0.07, ease: "easeOut" }}
                />
              </div>
            </StaggerItem>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-zinc-500/5 p-4 text-xs text-zinc-600 ring-1 ring-inset ring-black/5 dark:bg-white/5 dark:text-zinc-400 dark:ring-white/10">
        <p className="font-semibold text-zinc-700 dark:text-zinc-300">Model: {risk.modelName}</p>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>Accuracy: {metrics.accuracy ?? "n/a"}</span>
          <span>Precision: {metrics.precision ?? "n/a"}</span>
          <span>Recall: {metrics.recall ?? "n/a"}</span>
          <span>F1: {metrics.f1Score ?? "n/a"}</span>
        </p>
        <p className="mt-1">{metrics.notes}</p>
      </div>

      <DisclaimerText>{risk.disclaimer}</DisclaimerText>
    </Card>
  );
}
