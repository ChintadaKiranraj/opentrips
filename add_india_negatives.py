"""Adds non-event examples located inside India, so the GEO split actually
has both classes to test against instead of only real events.
"""
import random
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

from build_dataset import fetch_rain

# Rough India bounding box.
LAT_MIN, LAT_MAX = 8.0, 35.0
LON_MIN, LON_MAX = 68.0, 97.0

TARGET = 500


def fetch_neg_india(_):
    lat, lon = random.uniform(LAT_MIN, LAT_MAX), random.uniform(LON_MIN, LON_MAX)
    date = pd.Timestamp("2008-01-01") + pd.Timedelta(days=random.randint(0, 365 * 8))
    feats = fetch_rain(lat, lon, date)
    if feats is None:
        return None
    feats.update({"lat": lat, "lon": lon, "date": date, "country": "India", "label": 0})
    return feats


def main():
    rows = []
    with ThreadPoolExecutor(max_workers=15) as ex:
        futs = [ex.submit(fetch_neg_india, i) for i in range(TARGET)]
        for i, f in enumerate(as_completed(futs)):
            res = f.result()
            if res:
                rows.append(res)
            if (i + 1) % 100 == 0:
                print(f"  India negatives: {i + 1}/{TARGET}")

    existing = pd.read_csv("landslide_dataset.csv")
    combined = pd.concat([existing, pd.DataFrame(rows)], ignore_index=True)
    combined.to_csv("landslide_dataset.csv", index=False)
    print(f"Added {len(rows)} India non-event rows. Total dataset: {len(combined)} rows.")


if __name__ == "__main__":
    main()
