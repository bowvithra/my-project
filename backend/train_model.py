import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Load dataset
df = pd.read_csv("locations.csv")

# Possible businesses
businesses = [
    "Cafe","Restaurant","Bakery","Super Market","Medical Shop",
    "Electronics Shop","Clothing Store","Gym","Pet Shop","Laundry",
    "Juice Shop","Book Store"
]

rows = []

# Create training rows
for _, row in df.iterrows():

    for business in businesses:

        success = 0

        if row["footfall"] > 7000 and business in ["Restaurant","Clothing Store","Electronics Shop"]:
            success = 1

        elif row["population_density"] > 7000 and business in ["Cafe","Bakery","Super Market"]:
            success = 1

        elif row["rent_level"] == "low" and business in ["Laundry","Pet Shop","Gym"]:
            success = 1

        rows.append({
            "area_type": row["area_type"],
            "population_density": row["population_density"],
            "footfall": row["footfall"],
            "rent_level": row["rent_level"],
            "competition": row["competition"],
            "business": business,
            "success": success
        })

train_df = pd.DataFrame(rows)

# Encode categorical values
encoders = {}

for col in ["area_type","rent_level","competition","business"]:
    le = LabelEncoder()
    train_df[col] = le.fit_transform(train_df[col])
    encoders[col] = le

X = train_df.drop("success",axis=1)
y = train_df["success"]

# Train model
model = RandomForestClassifier(n_estimators=200)
model.fit(X,y)

# Save model
joblib.dump(model,"business_success_model.pkl")

# Save encoders
joblib.dump(encoders,"encoders.pkl")

print("Model trained successfully")