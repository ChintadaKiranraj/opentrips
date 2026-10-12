export interface GeocodeRequest {
  place: string;
}

/** A destination resolved through OpenStreetMap's Nominatim search. */
export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  /** [south, north, west, east] in degrees, when OpenStreetMap knows the area's extent. */
  boundingBox: [number, number, number, number] | null;
}
