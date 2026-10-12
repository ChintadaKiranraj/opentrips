"use client";

import { RiskGauge } from "@/components/results/RiskGauge";
import { Card } from "@/components/ui/Card";
import { DisclaimerText } from "@/components/ui/DisclaimerText";
import { MockDataBadge } from "@/components/ui/MockDataBadge";
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
    { label: "1 day", value: risk.rainfallFeatures.rain1dMm },
    { label: "3 day", value: risk.rainfallFeatures.rain3dMm },
    { label: "7 day", value: risk.rainfallFeatures.rain7dMm },
    { label: "14 day", value: risk.rainfallFeatures.rain14dMm },
  ];

  return (
    <Card delay={delay} className="bg-[#f7f4ef] shadow-none ring-1 ring-black/5 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#163226] dark:text-zinc-50">
            Landslide risk in {risk.destination}
          </h2>
          {risk.isMockData ? <div className="mt-2"><MockDataBadge /></div> : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VerdictBadge verdict={risk.verdict} />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{verdictCopy[risk.verdict]}</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-700 dark:text-zinc-300">{risk.explanation}</p>
        </div>
        <RiskGauge score={risk.riskScore} verdict={risk.verdict} />
      </div>

      <div className="mt-4 inline-flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
        <span className="text-zinc-500">Accuracy</span>
        <span className="font-semibold text-[#163226] dark:text-zinc-100">{metrics.accuracy ?? "n/a"}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rainfallStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white px-3 py-4 text-center ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-[#163226] dark:text-zinc-100">
              {stat.value.toFixed(1)} mm
            </p>
          </div>
        ))}
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
