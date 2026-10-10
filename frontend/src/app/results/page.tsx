"use client";

import Link from "next/link";

import { ItineraryCard } from "@/components/results/ItineraryCard";
import { RiskSummaryCard } from "@/components/results/RiskSummaryCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { useTripResult } from "@/lib/utils/trip-storage";

export default function ResultsPage() {
  const result = useTripResult();

  if (result === null) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <Card className="text-center">
          <p className="text-zinc-700 dark:text-zinc-300">
            No trip results found for this session. Plan a trip first to see a risk assessment and
            itinerary here.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Plan a trip</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-12 sm:py-16">
      <FadeIn className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your trip results
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Plan another trip
        </Link>
      </FadeIn>

      <RiskSummaryCard risk={result.risk} delay={0.1} />
      <ItineraryCard plan={result.plan} delay={0.25} />
    </main>
  );
}
