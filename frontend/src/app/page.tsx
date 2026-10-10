import { TripPlannerForm } from "@/components/forms/TripPlannerForm";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { StaggerText } from "@/components/ui/StaggerText";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-20">
      <div className="text-center">
        <StaggerText
          text="Plan your outdoor trip, safely."
          className="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
        />
        <FadeIn delay={0.55}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Trip Planner checks simulated landslide-risk conditions for your destination and dates, then
            builds a personalized itinerary and packing list around your constraints.
          </p>
        </FadeIn>
      </div>

      <Card className="mt-10" delay={0.7}>
        <TripPlannerForm />
      </Card>
    </main>
  );
}
