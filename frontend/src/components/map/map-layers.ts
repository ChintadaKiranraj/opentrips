export type MapLayerId = "landslides" | "weather" | "stays";

export type MapLayerVisibility = Record<MapLayerId, boolean>;

/** Asks the map to fly to a place to stay; `nonce` lets the same stay be focused twice. */
export interface StayFocusRequest {
  stayId: string;
  nonce: number;
}
