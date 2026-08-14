import os
import sys
import pandas as pd
from sklearn.datasets import fetch_openml

os.makedirs("data", exist_ok=True)
train_path = os.path.join("data", "train.csv")

print("Starting OpenML fetch...", flush=True)
openml_data = fetch_openml(name='house_prices', as_frame=True, parser='auto')
df = openml_data.frame
print(f"Fetched shape: {df.shape}", flush=True)

df.to_csv(train_path, index=False)
print(f"Successfully saved train.csv to {train_path}!", flush=True)

if os.path.exists("house_price.csv"):
    df_test = pd.read_csv("house_price.csv")
    df_test.to_csv(os.path.join("data", "test.csv"), index=False)
    print(f"Successfully copied house_price.csv to data/test.csv! Shape: {df_test.shape}", flush=True)
