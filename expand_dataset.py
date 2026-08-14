import os
import sys
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Generating high-fidelity 10,000 property dataset with SalePrice target...", flush=True)

# Load base 1,460 training records with SalePrice
source_file = os.path.join("data", "base_train.csv")
if not os.path.exists(source_file):
    from sklearn.datasets import fetch_openml
    df_base = fetch_openml(name='house_prices', as_frame=True, parser='auto').frame
    df_base.to_csv(source_file, index=False)
else:
    df_base = pd.read_csv(source_file)

print(f"Base dataset loaded with {len(df_base)} records and {df_base.shape[1]} columns (including SalePrice).", flush=True)

target_count = 10000
num_synthetic = target_count - len(df_base)

# Set random seed for reproducibility
np.random.seed(42)

# Sample base records with replacement to preserve joint categorical & structural distributions
sample_indices = np.random.choice(df_base.index, size=num_synthetic, replace=True)
df_synth = df_base.loc[sample_indices].copy().reset_index(drop=True)

# Assign continuous IDs
max_id = df_base['Id'].max() if 'Id' in df_base.columns else len(df_base)
df_synth['Id'] = np.arange(max_id + 1, max_id + 1 + len(df_synth))

# Continuous numeric columns to add realistic statistical variance to
numeric_cols = [
    'LotArea', 'GrLivArea', '1stFlrSF', '2ndFlrSF', 'TotalBsmtSF',
    'BsmtFinSF1', 'BsmtUnfSF', 'GarageArea', 'WoodDeckSF', 'OpenPorchSF'
]

for col in numeric_cols:
    if col in df_synth.columns:
        std_pct = 0.05
        noise = np.random.normal(1.0, std_pct, size=len(df_synth))
        df_synth[col] = np.clip(np.round(pd.to_numeric(df_synth[col], errors='coerce').fillna(0) * noise), 0, None)

# Add minor jitter to integer features with bounds
if 'YearBuilt' in df_synth.columns:
    year_delta = np.random.choice([-3, -2, -1, 0, 1, 2, 3], size=len(df_synth), p=[0.1, 0.15, 0.2, 0.2, 0.15, 0.1, 0.1])
    df_synth['YearBuilt'] = np.clip(pd.to_numeric(df_synth['YearBuilt'], errors='coerce').fillna(2000) + year_delta, 1875, 2025)

if 'YearRemodAdd' in df_synth.columns:
    df_synth['YearRemodAdd'] = np.maximum(pd.to_numeric(df_synth['YearRemodAdd'], errors='coerce').fillna(2000), df_synth['YearBuilt'])

if 'GrLivArea' in df_synth.columns and '1stFlrSF' in df_synth.columns and '2ndFlrSF' in df_synth.columns:
    df_synth['GrLivArea'] = df_synth['1stFlrSF'] + df_synth['2ndFlrSF']

# Calculate realistic SalePrice target
base_prices = df_base.loc[sample_indices, 'SalePrice'].values
orig_liv = pd.to_numeric(df_base.loc[sample_indices, 'GrLivArea'], errors='coerce').fillna(1500).values
new_liv = pd.to_numeric(df_synth['GrLivArea'], errors='coerce').fillna(1500).values
liv_ratio = (new_liv / np.maximum(orig_liv, 400))
orig_year = pd.to_numeric(df_base.loc[sample_indices, 'YearBuilt'], errors='coerce').fillna(1975).values
new_year = df_synth['YearBuilt'].values
year_bonus = (new_year - orig_year) * 650

noise_price = np.random.normal(1.0, 0.035, size=len(df_synth))
adjusted_prices = (base_prices * np.sqrt(liv_ratio) + year_bonus) * noise_price
df_synth['SalePrice'] = np.clip(np.round(adjusted_prices, -2), 35000, 850000)

# Combine original + synthetic to reach exactly 10,000 records
df_10k = pd.concat([df_base, df_synth], ignore_index=True)
df_10k = df_10k.head(target_count)

print(f"Generated complete 10k dataset: {len(df_10k)} records, {df_10k.shape[1]} features.", flush=True)

# Save to house_price.csv and data/train.csv
df_10k.to_csv("house_price.csv", index=False)
os.makedirs("data", exist_ok=True)
df_10k.to_csv(os.path.join("data", "train.csv"), index=False)

print("Saved 10,000 records to house_price.csv and data/train.csv successfully!", flush=True)
