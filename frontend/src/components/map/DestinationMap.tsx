"use client";

import "leaflet/dist/leaflet.css";

import { useReducedMotion } from "framer-motion";
import L from "leaflet";
import { useEffect, useRef, type RefObject } from "react";
import {
  Circle,
  CircleMarker,
  LayerGroup,
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { MapLayerVisibility, StayFocusRequest } from "@/components/map/map-layers";
import { severityColors, severityLabels, weatherLabel } from "@/lib/insights/weather-codes";
import type { GeocodeResult } from "@/types/geo";
import type { AreaInsights, Stay } from "@/types/insights";
import type { RiskVerdict } from "@/types/risk";

const verdictColors: Record<RiskVerdict, string> = {
  GO: "#10b981",
  CAUTION: "#f59e0b",
  WAIT: "#ef4444",
};

const safetyText: Record<Stay["safety"], string> = {
  good: "No recorded landslides within 3 km",
  caution: "Recorded landslide 1 to 3 km away",
  risky: "Recorded landslide within 1 km",
  unknown: "Landslide records unavailable",
};

const pinIcon = L.divIcon({
  className: "map-pin",
  html: '<span class="map-pin__pulse"></span><span class="map-pin__dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const TOP_STAYS = 5;
const stayIconCache = new Map<number, L.DivIcon>();

function stayIcon(rank: number) {
  const isTop = rank <= TOP_STAYS;
  const cached = stayIconCache.get(isTop ? rank : 0);
  if (cached) return cached;

  const size = isTop ? 26 : 14;
  const icon = L.divIcon({
    className: `stay-pin${isTop ? " stay-pin--top" : ""}`,
    html: isTop ? `<span>${rank}</span>` : "<span></span>",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  stayIconCache.set(isTop ? rank : 0, icon);
  return icon;
}

const OVERVIEW_ZOOM = 11;

/** Flies from a regional overview down to the destination once the map mounts. */
function FlyToDestination({ location }: { location: GeocodeResult }) {
  const map = useMap();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = L.latLng(location.latitude, location.longitude);
    const bounds = location.boundingBox
      ? L.latLngBounds(
          [location.boundingBox[0], location.boundingBox[2]],
          [location.boundingBox[1], location.boundingBox[3]],
        )
      : null;

    if (reduceMotion) {
      if (bounds) map.fitBounds(bounds, { maxZoom: OVERVIEW_ZOOM });
      else map.setView(target, OVERVIEW_ZOOM);
      return;
    }

    if (bounds) map.flyToBounds(bounds, { maxZoom: OVERVIEW_ZOOM, duration: 1.8 });
    else map.flyTo(target, OVERVIEW_ZOOM, { duration: 1.8 });
  }, [map, location, reduceMotion]);

  return null;
}

function FocusStay({
  request,
  markers,
}: {
  request: StayFocusRequest | null;
  markers: RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!request) return;
    const marker = markers.current.get(request.stayId);
    if (!marker) return;

    map.flyTo(marker.getLatLng(), 15, { duration: 1.2 });
    map.once("moveend", () => marker.openPopup());
  }, [map, markers, request]);

  return null;
}

function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

interface DestinationMapProps {
  location: GeocodeResult;
  verdict: RiskVerdict;
  insights: AreaInsights | null;
  layers: MapLayerVisibility;
  focusRequest: StayFocusRequest | null;
}

export default function DestinationMap({ location, verdict, insights, layers, focusRequest }: DestinationMapProps) {
  const center: [number, number] = [location.latitude, location.longitude];
  const color = verdictColors[verdict];
  const stayMarkers = useRef(new Map<string, L.Marker>());

  const landslides = insights?.landslides.data ?? [];
  const weatherCells = (insights?.weather.data?.grid ?? []).filter((cell) => cell.severity !== "clear");
  const stays = insights?.stays.data ?? [];

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        className="map-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, landslides from NASA, weather from Open-Meteo'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {layers.weather && (
        <LayerGroup>
          {weatherCells.map((cell) => (
            <Rectangle
              key={`${cell.latitude},${cell.longitude}`}
              bounds={[
                [cell.latitude - cell.halfSizeDeg, cell.longitude - cell.halfSizeDeg],
                [cell.latitude + cell.halfSizeDeg, cell.longitude + cell.halfSizeDeg],
              ]}
              pathOptions={{
                stroke: false,
                fillColor: severityColors[cell.severity],
                fillOpacity: cell.severity === "severe" ? 0.22 : cell.severity === "moderate" ? 0.16 : 0.1,
              }}
            >
              <Popup>
                <strong>{severityLabels[cell.severity]}</strong>
                <br />
                {weatherLabel(cell.weatherCode)}, up to {cell.maxPrecipitationMm.toFixed(1)} mm of rain in a day
                {cell.maxWindKmh !== null && (
                  <>
                    <br />
                    Wind up to {Math.round(cell.maxWindKmh)} km/h
                  </>
                )}
              </Popup>
            </Rectangle>
          ))}
        </LayerGroup>
      )}

      <Circle
        center={center}
        radius={3000}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1.5 }}
      />

      {layers.landslides && (
        <LayerGroup>
          {landslides.map((event) => (
            <CircleMarker
              key={event.id}
              center={[event.latitude, event.longitude]}
              radius={5 + Math.min(8, Math.log2((event.fatalities ?? 0) + 1) * 2)}
              pathOptions={{ color: "#7f1d1d", weight: 1.5, fillColor: "#ef4444", fillOpacity: 0.75 }}
            >
              <Popup>
                <strong>{event.title}</strong>
                <br />
                {event.date ?? "Date unknown"}
                {event.trigger && `, triggered by ${event.trigger}`}
                <br />
                {event.size && `Size: ${event.size}. `}
                {event.fatalities !== null && `Fatalities: ${event.fatalities}. `}
                {formatKm(event.distanceKm)} from your destination
              </Popup>
            </CircleMarker>
          ))}
        </LayerGroup>
      )}

      {layers.stays && (
        <LayerGroup>
          {stays.map((stay, index) => (
            <Marker
              key={stay.id}
              position={[stay.latitude, stay.longitude]}
              icon={stayIcon(index + 1)}
              zIndexOffset={index < TOP_STAYS ? 500 - index : 0}
              ref={(marker) => {
                if (marker) stayMarkers.current.set(stay.id, marker);
                else stayMarkers.current.delete(stay.id);
              }}
            >
              <Popup>
                <strong>
                  {index < TOP_STAYS ? `#${index + 1} ` : ""}
                  {stay.name}
                </strong>
                <br />
                <span className="capitalize">{stay.kind}</span>
                {stay.stars !== null && `, ${stay.stars} star`}
                {`, ${formatKm(stay.distanceKm)} from center`}
                <br />
                {safetyText[stay.safety]}
                {stay.nearestLandslideKm !== null &&
                  stay.safety !== "good" &&
                  ` (${formatKm(stay.nearestLandslideKm)})`}
                {stay.website && (
                  <>
                    <br />
                    <a href={stay.website} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      )}

      <Marker position={center} icon={pinIcon} zIndexOffset={1000}>
        <Popup>
          <strong>{location.displayName.split(",")[0]}</strong>
          <br />
          Simulated verdict: {verdict}
        </Popup>
      </Marker>

      <FlyToDestination location={location} />
      <FocusStay request={focusRequest} markers={stayMarkers} />
    </MapContainer>
  );
}
