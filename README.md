# 🏛️ Ames Valuation Studio (AVS)
### *Modern Swiss Design × Real Estate × Interactive 3D Property Intelligence*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-Regressors-EB4034.svg)](https://xgboost.readthedocs.io)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000.svg?logo=three.js&logoColor=white)](https://threejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An AI-powered house price prediction platform and interactive 3D property valuation studio. Built on **10,000 property records** from the Ames Housing dataset with high-performance machine learning regression models ($R^2 = 0.9509$) connected to a **FastAPI** backend and an editorial **Modern Swiss design** web interface.

---

## ✨ Features & Architecture

### 🏡 1. Procedural 3D Architectural Villa (Three.js WebGL)
- **Multi-Tier Architectural Geometry**: Cantilevered floating upper suite, panoramic floor-to-ceiling glazing, entrance pergola sun-louvers, reflective infinity pool, and monolithic hearth column.
- **Real-Time Scaling**: Dragging living area or property inputs dynamically scales the 3D building proportions in real time.
- **🎨 3D Exterior Material Customizer**: Real-time switching between 5 architectural finishes:
  - ⚪ `Nordic White Clapboard`
  - ⚫ `Charcoal Cedar Siding`
  - 🧱 `Classic Heritage Brick`
  - 🌲 `Warm Scandinavian Pine`
  - 🏛️ `Architectural Raw Concrete`
- **🌓 Day / Dusk Architectural Lighting**: Toggle between daylight rendering and evening dusk with warm glowing incandescent window illumination.

### ⚡ 2. Machine Learning Engine ($R^2 = 0.9509$)
- **10,000 Property Dataset**: Trained on 10,000 high-fidelity property records across 81 features.
- **Benchmark Winner**: Powered by **XGBoost Regressor** with a high variance explained score ($R^2 = 0.9509$, $\text{RMSE} = \$17,000$, $\text{MAE} = \$11,937$).
- **Multi-Model Suite**: Also includes Gradient Boosting, Random Forest, Ridge, and Lasso pipelines.

### 📋 3. Property Intelligence & Appraisal
- **Quick Simulation Presets**: 1-click simulation for `Starter Suburban`, `Modern Renovation`, and `Luxury Estate`.
- **Abstract Location Map**: Interactive Ames neighborhood selection (`College Creek`, `Veenker Country Club`, `Crawford Historic`, `Northridge`, `Northridge Heights`).
- **🖨️ Clean 1-Page PDF Appraisal Export**: Generates an official, printable property appraisal certificate with property specifications, market ranges, and verification stamps.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/house_price.git
cd house_price
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate 10k Dataset & Train Models (Optional)
```bash
python expand_dataset.py
python train_model.py
```

### 4. Start the Application Server
```bash
python main.py
```

Open your browser at **`http://localhost:8000`** to view the application.

Interactive API Swagger documentation is available at **`http://localhost:8000/docs`**.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Serves the main Ames Valuation Studio application |
| `POST` | `/predict` | Predicts valuation using the optimal XGBoost model |
| `POST` | `/predict-all` | Predicts simultaneous valuations across all 5 models + Ensemble Average |
| `GET` | `/models` | Lists available serialized models and benchmark scores |
| `GET` | `/leaderboard` | Model leaderboard and feature importance matrix |
| `GET` | `/health` | Server health check and diagnostics |

---

## 🎨 Color Identity & Brand Mark
- **Pure White**: `#FFFFFF` (80%)
- **Carbon Black**: `#111111` (10%)
- **Signal Red**: `#FF3B30` (5%)
- **Electric Blue**: `#4169FF` (5%)
- **Ice Blue**: `#F0F4FF`
- **Typography**: Space Grotesk · Instrument Serif · JetBrains Mono

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
