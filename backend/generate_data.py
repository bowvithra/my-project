import pandas as pd

# Load locations
locations = pd.read_csv("locations.csv")

businesses = [
    "Bakery","Super Market","Cafe","Clothing Store","Book Store",
    "Restaurant","Medical Shop","Pet Care Center","Cloud Kitchen",
    "Co-working Space"
]

rows = []

for _, row in locations.iterrows():
    for business in businesses:
        rows.append({
            "location": row["location"],
            "area_type": row["area_type"],
            "population_density": row["population_density"],
            "footfall": row["footfall"],
            "rent_level": row["rent_level"],
            "competition": row["competition"],
            "business": business,
            "success": 1 if business in ["Bakery","Cafe","Super Market"] else 0
        })

df = pd.DataFrame(rows)

df.to_csv("data.csv", index=False)

print("data.csv generated successfully")