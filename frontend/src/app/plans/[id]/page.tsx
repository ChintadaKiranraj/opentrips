import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Placeholder for shareable, persisted plan pages (see B3 and B4: PostgreSQL
 * and Prisma persistence, shareable saved-plan URLs). Plans are not yet saved
 * server-side, so this route can't look anything up. It just confirms the
 * route shape is reserved.
 */
export default function SavedPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Card className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Saved plan</h1>
        <Suspense fallback={<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>}>
          <PlaceholderMessage params={params} />
        </Suspense>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </Card>
    </main>
  );
}

async function PlaceholderMessage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
      Plan persistence is not implemented yet in this phase of the project. Once PostgreSQL and Prisma
      storage lands, this page will load the saved plan for id{" "}
      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{id}</code>.
    </p>
  );
}
