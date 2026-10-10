"""Builds landslide_dataset.csv: real NASA landslide events plus sampled
non-event locations, both carrying rainfall features from Open-Meteo's
archive API. This is TabPFN's training table for the /risk endpoint.
"""
import pandas as pd, numpy as np, requests, random
from concurrent.futures import ThreadPoolExecutor, as_completed

GLC_URL = "https://data.nasa.gov/docs/legacy/Global_Landslide_Catalog_Export/Global_Landslide_Catalog_Export_rows.csv"
ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"


def fetch_rain(lat, lon, date, lookback=14):
    end = pd.to_datetime(date)
    start = end - pd.Timedelta(days=lookback)
    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start.strftime("%Y-%m-%d"), "end_date": end.strftime("%Y-%m-%d"),
        "daily": "precipitation_sum", "timezone": "UTC",
    }
    try:
        r = requests.get(ARCHIVE, params=params, timeout=20)
        r.raise_for_status()
        precip = [p for p in r.json().get("daily", {}).get("precipitation_sum", []) if p is not None]
        if not precip:
            return None
        precip = np.array(precip)
        return {
            "rain_1d": float(precip[-1]), "rain_3d": float(precip[-3:].sum()),
            "rain_7d": float(precip[-7:].sum()), "rain_14d": float(precip.sum()),
        }
    except Exception:
        return None


def main():
    print("Downloading NASA landslide catalog...")
    df = pd.read_csv(GLC_URL)
    df = df[df["location_accuracy"].isin(["exact", "1km", "5km", "10km"])]
    df = df.dropna(subset=["latitude", "longitude", "event_date"])
    df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")
    df = df.dropna(subset=["event_date"])

    india = df[df["country_name"] == "India"]
    rest = df[df["country_name"] != "India"].sample(n=min(1000, len(df)), random_state=42)
    df = pd.concat([india, rest]).drop_duplicates(subset=["event_id"])
    print(f"{len(df)} positive events selected ({len(india)} from India)")

    def fetch_pos(row):
        feats = fetch_rain(row["latitude"], row["longitude"], row["event_date"])
        if feats is None:
            return None
        feats.update({
            "lat": row["latitude"], "lon": row["longitude"],
            "date": row["event_date"], "country": row["country_name"], "label": 1,
        })
        return feats

    rows = []
    with ThreadPoolExecutor(max_workers=15) as ex:
        futs = [ex.submit(fetch_pos, r) for _, r in df.iterrows()]
        for i, f in enumerate(as_completed(futs)):
            res = f.result()
            if res:
                rows.append(res)
            if (i + 1) % 100 == 0:
                print(f"  positives: {i + 1}/{len(futs)}")

    print("Generating non-event examples...")

    def fetch_neg(_):
        lat, lon = random.uniform(-60, 70), random.uniform(-180, 180)
        date = pd.Timestamp("2008-01-01") + pd.Timedelta(days=random.randint(0, 365 * 8))
        feats = fetch_rain(lat, lon, date)
        if feats is None:
            return None
        feats.update({"lat": lat, "lon": lon, "date": date, "country": None, "label": 0})
        return feats

    neg_rows = []
    with ThreadPoolExecutor(max_workers=15) as ex:
        futs = [ex.submit(fetch_neg, i) for i in range(len(rows))]
        for i, f in enumerate(as_completed(futs)):
            res = f.result()
            if res:
                neg_rows.append(res)
            if (i + 1) % 100 == 0:
                print(f"  negatives: {i + 1}/{len(futs)}")

    out = pd.DataFrame(rows + neg_rows)
    out.to_csv("landslide_dataset.csv", index=False)
    print(f"Saved landslide_dataset.csv: {len(rows)} positives, {len(neg_rows)} negatives")


if __name__ == "__main__":
    main()
