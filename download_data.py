import urllib.request
import pandas as pd
import os

os.makedirs("data", exist_ok=True)
train_path = os.path.join("data", "train.csv")

if not os.path.exists(train_path):
    print("Downloading train.csv...")
    # Standard Kaggle Ames House Prices train.csv URL
    url = "https://raw.githubusercontent.com/philippgermann/kaggle-house-prices/master/data/train.csv"
    try:
        df = pd.read_csv(url)
        df.to_csv(train_path, index=False)
        print(f"Downloaded train.csv successfully! Shape: {df.shape}")
    except Exception as e:
        print(f"Error fetching from github: {e}")
        # Alternative URL
        url2 = "https://raw.githubusercontent.com/juliencs/exo-dataset/master/train.csv"
        df = pd.read_csv(url2)
        df.to_csv(train_path, index=False)
        print(f"Downloaded from backup URL! Shape: {df.shape}")
else:
    df = pd.read_csv(train_path)
    print(f"train.csv already exists. Shape: {df.shape}")
