import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

print("--- Step 1: Loading Datasets ---", flush=True)
train_path = os.path.join("data", "train.csv")
test_path = os.path.join("data", "test.csv")

if not os.path.exists(train_path):
    from sklearn.datasets import fetch_openml
    raw_openml = fetch_openml(name='house_prices', as_frame=True, parser='auto')
    df_train_raw = raw_openml.frame
    df_train_raw.to_csv(train_path, index=False)
else:
    df_train_raw = pd.read_csv(train_path)

if not os.path.exists(test_path):
    if os.path.exists("house_price.csv"):
        df_test_raw = pd.read_csv("house_price.csv")
        df_test_raw.to_csv(test_path, index=False)
    else:
        raise FileNotFoundError("test set house_price.csv missing!")
else:
    df_test_raw = pd.read_csv(test_path)

print(f"Train samples: {df_train_raw.shape[0]}, Test samples: {df_test_raw.shape[0]}", flush=True)

# Feature engineering function
def engineer_features(df):
    data = df.copy()

    for c in data.select_dtypes(include=[np.number]).columns:
        data[c] = pd.to_numeric(data[c], errors='coerce')

    bsmt_sf = data['TotalBsmtSF'].fillna(0) if 'TotalBsmtSF' in data.columns else 0
    flr1_sf = data['1stFlrSF'].fillna(0) if '1stFlrSF' in data.columns else 0
    flr2_sf = data['2ndFlrSF'].fillna(0) if '2ndFlrSF' in data.columns else 0
    data['TotalSF'] = bsmt_sf + flr1_sf + flr2_sf

    full_b = data['FullBath'].fillna(0) if 'FullBath' in data.columns else 0
    half_b = data['HalfBath'].fillna(0) if 'HalfBath' in data.columns else 0
    bsmt_f = data['BsmtFullBath'].fillna(0) if 'BsmtFullBath' in data.columns else 0
    bsmt_h = data['BsmtHalfBath'].fillna(0) if 'BsmtHalfBath' in data.columns else 0
    data['TotalBaths'] = full_b + (0.5 * half_b) + bsmt_f + (0.5 * bsmt_h)

    yr_sold = data['YrSold'].fillna(2010) if 'YrSold' in data.columns else 2010
    yr_built = data['YearBuilt'].fillna(1970) if 'YearBuilt' in data.columns else 1970
    yr_remod = data['YearRemodAdd'].fillna(yr_built) if 'YearRemodAdd' in data.columns else yr_built
    
    data['HouseAge'] = yr_sold - yr_built
    data['RemodAge'] = yr_sold - yr_remod
    data['IsRemodeled'] = (data['YearRemodAdd'] != data['YearBuilt']).astype(int)

    qual = data['OverallQual'].fillna(5) if 'OverallQual' in data.columns else 5
    cond = data['OverallCond'].fillna(5) if 'OverallCond' in data.columns else 5
    data['QualCondScore'] = qual * cond

    data['HasGarage'] = (data['GarageArea'].fillna(0) > 0).astype(int) if 'GarageArea' in data.columns else 0
    data['HasBasement'] = (data['TotalBsmtSF'].fillna(0) > 0).astype(int) if 'TotalBsmtSF' in data.columns else 0
    data['HasFireplace'] = (data['Fireplaces'].fillna(0) > 0).astype(int) if 'Fireplaces' in data.columns else 0

    return data

df_train = df_train_raw.copy()
if 'GrLivArea' in df_train.columns and 'SalePrice' in df_train.columns:
    df_train = df_train[~((df_train['GrLivArea'] > 4000) & (df_train['SalePrice'] < 300000))]

y_train_orig = df_train['SalePrice'].values
y_train_log = np.log1p(y_train_orig)
X_train_raw = df_train.drop(columns=['SalePrice'])
X_test_raw = df_test_raw.copy()

X_train_eng = engineer_features(X_train_raw)
X_test_eng = engineer_features(X_test_raw)

numeric_features = [
    'OverallQual', 'OverallCond', 'TotalSF', 'GrLivArea', 'TotalBsmtSF', 
    '1stFlrSF', '2ndFlrSF', 'GarageCars', 'GarageArea', 'TotalBaths',
    'FullBath', 'TotRmsAbvGrd', 'YearBuilt', 'YearRemodAdd', 'HouseAge', 
    'RemodAge', 'QualCondScore', 'LotArea', 'LotFrontage', 'Fireplaces',
    'WoodDeckSF', 'OpenPorchSF', 'HasGarage', 'HasBasement', 'HasFireplace'
]
numeric_features = [f for f in numeric_features if f in X_train_eng.columns]

categorical_features = ['Neighborhood', 'MSZoning', 'HouseStyle', 'BldgType', 'Foundation', 'ExterQual', 'KitchenQual']
categorical_features = [f for f in categorical_features if f in X_train_eng.columns]

num_transformer = Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())])
cat_transformer = Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))])

preprocessor = ColumnTransformer([('num', num_transformer, numeric_features), ('cat', cat_transformer, categorical_features)])

X_train_proc = preprocessor.fit_transform(X_train_eng)
X_test_proc = preprocessor.transform(X_test_eng)

cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
cat_cols_encoded = cat_encoder.get_feature_names_out(categorical_features).tolist()
feature_names = numeric_features + cat_cols_encoded

X_tr, X_val, y_tr_log, y_val_log = train_test_split(X_train_proc, y_train_log, test_size=0.2, random_state=42)
y_val_orig = np.expm1(y_val_log)

# Models Benchmarking
models = {
    "XGBoost": xgb.XGBRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42, n_jobs=-1),
    "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42),
    "Ridge Regression": Ridge(alpha=10.0),
    "Lasso Regression": Lasso(alpha=0.001, random_state=42),
    "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
}

results = {}
trained_pipelines = {}

print("\n--- Training & Benchmarking Algorithms ---", flush=True)
for name, model in models.items():
    model.fit(X_tr, y_tr_log)
    preds_log = model.predict(X_val)
    preds_orig = np.expm1(preds_log)
    
    rmsle = np.sqrt(mean_squared_error(y_val_log, preds_log))
    rmse = np.sqrt(mean_squared_error(y_val_orig, preds_orig))
    mae = mean_absolute_error(y_val_orig, preds_orig)
    r2 = r2_score(y_val_orig, preds_orig)
    
    results[name] = {
        "RMSLE": round(float(rmsle), 4),
        "RMSE": round(float(rmse), 2),
        "MAE": round(float(mae), 2),
        "R2_Score": round(float(r2), 4)
    }
    
    print(f"[{name}] RMSLE: {rmsle:.4f} | RMSE: ${rmse:,.2f} | MAE: ${mae:,.2f} | R2: {r2:.4f}", flush=True)

    # Train full pipeline for each model
    p = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model)
    ])
    p.fit(X_train_eng, y_train_log)
    trained_pipelines[name] = p

# Serialize multi-model dictionary & main pipeline
pipeline_dict_path = os.path.join("models", "all_model_pipelines.joblib")
joblib.dump(trained_pipelines, pipeline_dict_path)

main_pipeline_path = os.path.join("models", "house_price_pipeline.joblib")
joblib.dump(trained_pipelines["XGBoost"], main_pipeline_path)

print(f"Serialized all ML pipelines to {pipeline_dict_path}", flush=True)

# Feature Importances
importances = models["XGBoost"].feature_importances_
feature_imp_list = []
for fname, imp in zip(feature_names, importances):
    clean_name = fname.replace("num__", "").replace("cat__", "")
    feature_imp_list.append({"feature": clean_name, "importance": float(imp)})

feature_imp_list = sorted(feature_imp_list, key=lambda x: x["importance"], reverse=True)[:15]
max_imp = feature_imp_list[0]["importance"] if feature_imp_list else 1.0
for item in feature_imp_list:
    item["percentage"] = round((item["importance"] / max_imp) * 100, 1)

# Export Metadata JSON
metadata = {
    "dataset_info": {
        "train_samples": int(len(df_train)),
        "test_samples": int(len(df_test_raw)),
        "total_features": int(X_train_proc.shape[1]),
        "target": "SalePrice (Log-Transformed)",
        "mean_sale_price": round(float(y_train_orig.mean()), 2),
        "median_sale_price": round(float(np.median(y_train_orig)), 2),
        "min_sale_price": round(float(y_train_orig.min()), 2),
        "max_sale_price": round(float(y_train_orig.max()), 2)
    },
    "leaderboard": results,
    "available_models": list(models.keys()),
    "best_model": "XGBoost",
    "top_feature_importance": feature_imp_list
}

metadata_json_path = os.path.join("models", "model_metadata.json")
with open(metadata_json_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print(f"Exported metadata to {metadata_json_path}", flush=True)
print("--- Multi-Model Training & Serialization Finished Successfully ---", flush=True)
