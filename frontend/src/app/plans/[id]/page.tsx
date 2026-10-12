import Link from "next/link";
import { Suspense } from "react";

import { ItineraryCard } from "@/components/results/ItineraryCard";
import { RiskSummaryCard } from "@/components/results/RiskSummaryCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db/prisma";
import type { PlanResponse } from "@/types/plan";
import type { RiskResponse } from "@/types/risk";

/**
 * Shareable, revisitable plan page (B3/B4). Loads a previously saved trip
 * from Postgres by id, renders it with the exact same components as the
 * live /results flow. If DATABASE_URL isn't configured, or the id doesn't
 * exist, shows an honest "not found" state rather than erroring.
 *
 * The lookup is wrapped in <Suspense>, required by cacheComponents (see
 * next.config.ts) for any route reading dynamic params or doing a runtime
 * database call.
 */
export default function SavedPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingCard />}>
      <SavedPlan params={params} />
    </Suspense>
  );
}

async function SavedPlan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <NotFoundCard message="Plan storage isn't configured yet. Saved links aren't available in this environment." />
    );
  }

  const trip = await prisma.trip.findUnique({ where: { id } }).catch(() => null);

  if (!trip) {
    return <NotFoundCard message={`No saved plan found for id "${id}".`} />;
  }

  const risk = trip.riskJson as unknown as RiskResponse;
  const plan = trip.planJson as unknown as PlanResponse;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Saved trip to {trip.place}
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Plan another trip
        </Link>
      </div>

      <RiskSummaryCard risk={risk} delay={0.1} />
      <ItineraryCard plan={plan} delay={0.25} />
    </main>
  );
}

function LoadingCard() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Card className="text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading saved plan…</p>
      </Card>
    </main>
  );
}

function NotFoundCard({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Card className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Saved plan</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </Card>
    </main>
  );
}
