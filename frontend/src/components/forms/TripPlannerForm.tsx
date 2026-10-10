"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, MapPin, NotebookText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { TextArea } from "@/components/ui/TextArea";
import { TextInput } from "@/components/ui/TextInput";
import { saveTripResult } from "@/lib/utils/trip-storage";
import type { ApiErrorResponse } from "@/types/api";
import type { PlanResponse } from "@/types/plan";
import type { RiskResponse } from "@/types/risk";

/**
 * Placeholder coordinates until B2 wires up a real geocoding lookup for the
 * destination text. The mock /api/risk endpoint only uses them to echo back
 * rainfall placeholders, so a fixed pair is fine for now.
 */
const PLACEHOLDER_COORDINATES = { latitude: 0, longitude: 0 };

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as TResponse | ApiErrorResponse;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new Error(errorData.details ?? errorData.error ?? "Request failed.");
  }

  return data as TResponse;
}

export function TripPlannerForm() {
  const router = useRouter();
  const [place, setPlace] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [constraints, setConstraints] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!place.trim() || !startDate || !endDate) {
      setError("Please fill in destination, start date, and end date.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after the start date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const risk = await postJson<RiskResponse>("/api/risk", {
        place,
        ...PLACEHOLDER_COORDINATES,
        startDate,
        endDate,
        constraints,
      });

      const plan = await postJson<PlanResponse>("/api/plan", {
        place,
        startDate,
        endDate,
        constraints,
        riskVerdict: risk.verdict,
        riskScore: risk.riskScore,
      });

      saveTripResult({ risk, plan });
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <FormField label="Destination" htmlFor="place">
        <TextInput
          id="place"
          name="place"
          type="text"
          required
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Munnar, Kerala"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Start date" htmlFor="startDate">
          <TextInput
            id="startDate"
            name="startDate"
            type="date"
            required
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </FormField>

        <FormField label="End date" htmlFor="endDate">
          <TextInput
            id="endDate"
            name="endDate"
            type="date"
            required
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </FormField>
      </div>

      <FormField
        label="Your constraints"
        htmlFor="constraints"
        hint="Describe fitness level, injuries, budget, or anything else that should shape your plan."
      >
        <TextArea
          id="constraints"
          name="constraints"
          rows={3}
          icon={<NotebookText className="h-4 w-4" aria-hidden="true" />}
          value={constraints}
          onChange={(event) => setConstraints(event.target.value)}
          placeholder="Beginner, bad knee, budget ₹3000"
        />
      </FormField>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Assessing risk and planning…" : "Check risk and plan my trip"}
        {!isSubmitting && <ArrowRight className="relative h-4 w-4" aria-hidden="true" />}
      </Button>
    </form>
  );
}
