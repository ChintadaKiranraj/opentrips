"use client";

import { useEffect, useRef, useState } from "react";

import { StaysCard } from "@/components/insights/StaysCard";
import { TripWeatherCard } from "@/components/insights/TripWeatherCard";
import { DestinationMapCard } from "@/components/map/DestinationMapCard";
import type { MapLayerId, MapLayerVisibility, StayFocusRequest } from "@/components/map/map-layers";
import type { ApiErrorResponse } from "@/types/api";
import type { GeocodeResult } from "@/types/geo";
import type { AreaInsights, InsightsRequest } from "@/types/insights";
import type { RiskVerdict } from "@/types/risk";

type InsightsState =
  | { status: "loading" }
  | { status: "ready"; data: AreaInsights }
  | { status: "error"; message: string };

function useAreaInsights({ latitude, longitude, startDate, endDate }: InsightsRequest) {
  const [state, setState] = useState<InsightsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, startDate, endDate }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as AreaInsights | ApiErrorResponse;
        if (!response.ok) {
          const error = data as ApiErrorResponse;
          throw new Error(error.details ?? error.error);
        }
        setState({ status: "ready", data: data as AreaInsights });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load area details.",
        });
      });

    return () => controller.abort();
  }, [latitude, longitude, startDate, endDate]);

  return state;
}

interface AreaInsightsSectionProps {
  location: GeocodeResult;
  verdict: RiskVerdict;
  startDate: string;
  endDate: string;
  delay?: number;
}

export function AreaInsightsSection({ location, verdict, startDate, endDate, delay = 0 }: AreaInsightsSectionProps) {
  const state = useAreaInsights({
    latitude: location.latitude,
    longitude: location.longitude,
    startDate,
    endDate,
  });
  const [layers, setLayers] = useState<MapLayerVisibility>({ landslides: true, weather: true, stays: true });
  const [focusRequest, setFocusRequest] = useState<StayFocusRequest | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const insights = state.status === "ready" ? state.data : null;
  const isLoading = state.status === "loading";
  const requestError = state.status === "error" ? state.message : null;

  function toggleLayer(id: MapLayerId) {
    setLayers((current) => ({ ...current, [id]: !current[id] }));
  }

  function showStayOnMap(stayId: string) {
    setLayers((current) => ({ ...current, stays: true }));
    setFocusRequest((current) => ({ stayId, nonce: (current?.nonce ?? 0) + 1 }));
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <DestinationMapCard
        location={location}
        verdict={verdict}
        insights={insights}
        isLoading={isLoading}
        errorMessage={requestError}
        layers={layers}
        onToggleLayer={toggleLayer}
        focusRequest={focusRequest}
        mapRef={mapRef}
        delay={delay}
      />
      <TripWeatherCard
        weather={insights?.weather.data ?? null}
        isLoading={isLoading}
        errorMessage={requestError ?? insights?.weather.error ?? null}
        delay={delay + 0.05}
      />
      <StaysCard
        stays={insights?.stays.data ?? null}
        isLoading={isLoading}
        errorMessage={requestError ?? insights?.stays.error ?? null}
        onShowOnMap={showStayOnMap}
        delay={delay + 0.1}
      />
    </>
  );
}
