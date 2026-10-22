# Weather Forecast ML - Model Evaluation Report

## Dataset
- **Source:** ECMWF Copernicus ERA5 Hourly Reanalysis via Open-Meteo API
- **Training Samples:** 41,928
- **Test Samples:** 10,482 (time-based chronological split)
- **Features Engineered:** 35

## 1. Regression Models Benchmark

| Metric | Temperature (°C) | Relative Humidity (%) | Wind Speed (km/h) | Surface Pressure (hPa) |
|---|---|---|---|---|
| **Model** | XGBoost Regressor | XGBoost Regressor | LightGBM Regressor | XGBoost Regressor |
| **MAE** | 0.479 | 2.572 | 1.856 | 0.429 |
| **RMSE** | 0.689 | 3.756 | 2.678 | 1.393 |
| **R² Score** | 0.9943 | 0.9497 | 0.8727 | 0.9819 |
| **Baseline MAE (Ridge)** | 0.514 | - | - | - |
| **Baseline R² (Ridge)** | 0.9934 | - | - | - |

## 2. Rain Classifier Benchmark

| Metric | XGBoost Classifier (scale_pos_weight=4.4) | Baseline (Logistic Regression) |
|---|---|---|
| **Accuracy** | 86.56% | 86.51% |
| **Precision** | 53.06% | - |
| **Recall** | 82.53% | - |
| **F1-Score** | 0.6459 | 0.6300 |
| **ROC-AUC** | 0.9321 | 0.9197 |

## 3. Confusion Matrix (Rain vs Dry)
- **True Negative (Dry predicted as Dry):** 7,788
- **False Positive (Dry predicted as Rain):** 1,137
- **False Negative (Rain predicted as Dry):** 272
- **True Positive (Rain predicted as Rain):** 1,285
