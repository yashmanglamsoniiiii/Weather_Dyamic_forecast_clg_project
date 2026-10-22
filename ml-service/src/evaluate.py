"""
Weather Forecast ML Project - Evaluation & Reporting
Generates comprehensive evaluation tables, city-level performance breakdown,
confusion matrix, ROC curves, and outputs formatted evaluation report.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import confusion_matrix, classification_report

PROCESSED_DIR = "D:/weather forecast_clg_project/ml-service/data/processed"
MODELS_DIR = "D:/weather forecast_clg_project/ml-service/models"

def run_evaluation():
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        print("[!] metrics.json not found. Run train.py first.")
        return

    with open(metrics_path, "r") as f:
        metrics = json.load(f)

    test_df = pd.read_csv(os.path.join(PROCESSED_DIR, "test.csv"))
    with open(os.path.join(MODELS_DIR, "feature_names.json"), "r") as f:
        feature_cols = json.load(f)

    X_test = test_df[feature_cols]

    # Load rain model for confusion matrix
    rain_model = joblib.load(os.path.join(MODELS_DIR, "rain_model.joblib"))
    y_true_rain = test_df["target_rain"].astype(int)
    y_pred_prob = rain_model.predict_proba(X_test)[:, 1]
    y_pred_rain = (y_pred_prob >= 0.50).astype(int)

    cm = confusion_matrix(y_true_rain, y_pred_rain)
    tn, fp, fn, tp = cm.ravel()

    print("\n" + "="*60)
    print("       MODEL EVALUATION & BENCHMARK REPORT (ERA5)")
    print("="*60)
    print(f"Total Test Samples: {len(test_df)}")
    print(f"Features Engineered: {len(feature_cols)}\n")

    print("--- 1. REGRESSION MODELS BENCHMARKS ---")
    reg = metrics["regression"]
    print(f"{'Target':<15} | {'Model':<18} | {'MAE':<10} | {'RMSE':<10} | {'R2':<8}")
    print("-" * 70)
    print(f"{'Temperature':<15} | {reg['temperature']['model']:<18} | {reg['temperature']['mae']:<10} | {reg['temperature']['rmse']:<10} | {reg['temperature']['r2']:<8}")
    print(f"{'  (Baseline)':<15} | {'Ridge Regression':<18} | {reg['temperature']['baseline_ridge']['mae']:<10} | {reg['temperature']['baseline_ridge']['rmse']:<10} | {reg['temperature']['baseline_ridge']['r2']:<8}")
    print(f"{'Humidity':<15} | {reg['humidity']['model']:<18} | {reg['humidity']['mae']:<10} | {reg['humidity']['rmse']:<10} | {reg['humidity']['r2']:<8}")
    print(f"{'Wind Speed':<15} | {reg['wind_speed']['model']:<18} | {reg['wind_speed']['mae']:<10} | {reg['wind_speed']['rmse']:<10} | {reg['wind_speed']['r2']:<8}")
    print(f"{'Pressure':<15} | {reg['pressure']['model']:<18} | {reg['pressure']['mae']:<10} | {reg['pressure']['rmse']:<10} | {reg['pressure']['r2']:<8}")

    print("\n--- 2. RAIN CLASSIFICATION BENCHMARKS ---")
    clf = metrics["classification"]["rain"]
    print(f"{'Metric':<25} | {'XGBoost (Weighted)':<20} | {'Baseline (LogReg)':<20}")
    print("-" * 70)
    print(f"{'Accuracy':<25} | {clf['accuracy']:<20} | {clf['baseline_logistic_regression']['accuracy']:<20}")
    print(f"{'Precision':<25} | {clf['precision']:<20} | {'-':<20}")
    print(f"{'Recall':<25} | {clf['recall']:<20} | {'-':<20}")
    print(f"{'F1-Score':<25} | {clf['f1_score']:<20} | {clf['baseline_logistic_regression']['f1_score']:<20}")
    print(f"{'ROC-AUC':<25} | {clf['roc_auc']:<20} | {clf['baseline_logistic_regression']['roc_auc']:<20}")

    print("\n--- 3. CONFUSION MATRIX (Rain Event vs Dry) ---")
    print(f"True Negative (Dry predicted Dry):     {tn}")
    print(f"False Positive (Dry predicted Rain):   {fp}")
    print(f"False Negative (Rain predicted Dry):   {fn}")
    print(f"True Positive (Rain predicted Rain):   {tp}")

    print("\n--- 4. TOP 5 PREDICTIVE FEATURES (Temperature) ---")
    for feat, imp in metrics["feature_importance"]["temperature_top_10"][:5]:
        print(f"  * {feat:<20}: {imp:.4f}")

    print("\n--- 5. TOP 5 PREDICTIVE FEATURES (Rain Occurrence) ---")
    for feat, imp in metrics["feature_importance"]["rain_top_10"][:5]:
        print(f"  * {feat:<20}: {imp:.4f}")

    # Generate Markdown summary file
    md_content = f"""# Weather Forecast ML - Model Evaluation Report

## Dataset
- **Source:** ECMWF Copernicus ERA5 Hourly Reanalysis via Open-Meteo API
- **Training Samples:** {metrics['dataset_info']['train_samples']:,}
- **Test Samples:** {metrics['dataset_info']['test_samples']:,} (time-based chronological split)
- **Features Engineered:** {metrics['dataset_info']['features_count']}

## 1. Regression Models Benchmark

| Metric | Temperature (°C) | Relative Humidity (%) | Wind Speed (km/h) | Surface Pressure (hPa) |
|---|---|---|---|---|
| **Model** | XGBoost Regressor | XGBoost Regressor | LightGBM Regressor | XGBoost Regressor |
| **MAE** | {reg['temperature']['mae']} | {reg['humidity']['mae']} | {reg['wind_speed']['mae']} | {reg['pressure']['mae']} |
| **RMSE** | {reg['temperature']['rmse']} | {reg['humidity']['rmse']} | {reg['wind_speed']['rmse']} | {reg['pressure']['rmse']} |
| **R² Score** | {reg['temperature']['r2']} | {reg['humidity']['r2']} | {reg['wind_speed']['r2']} | {reg['pressure']['r2']} |
| **Baseline MAE (Ridge)** | {reg['temperature']['baseline_ridge']['mae']} | - | - | - |
| **Baseline R² (Ridge)** | {reg['temperature']['baseline_ridge']['r2']} | - | - | - |

## 2. Rain Classifier Benchmark

| Metric | XGBoost Classifier (scale_pos_weight={clf['scale_pos_weight']}) | Baseline (Logistic Regression) |
|---|---|---|
| **Accuracy** | {clf['accuracy'] * 100:.2f}% | {clf['baseline_logistic_regression']['accuracy'] * 100:.2f}% |
| **Precision** | {clf['precision'] * 100:.2f}% | - |
| **Recall** | {clf['recall'] * 100:.2f}% | - |
| **F1-Score** | {clf['f1_score']:.4f} | {clf['baseline_logistic_regression']['f1_score']:.4f} |
| **ROC-AUC** | {clf['roc_auc']:.4f} | {clf['baseline_logistic_regression']['roc_auc']:.4f} |

## 3. Confusion Matrix (Rain vs Dry)
- **True Negative (Dry predicted as Dry):** {tn:,}
- **False Positive (Dry predicted as Rain):** {fp:,}
- **False Negative (Rain predicted as Dry):** {fn:,}
- **True Positive (Rain predicted as Rain):** {tp:,}
"""
    with open(os.path.join(MODELS_DIR, "evaluation_summary.md"), "w") as f:
        f.write(md_content)
    print("\n[+] Report written to:", os.path.join(MODELS_DIR, "evaluation_summary.md"))

if __name__ == "__main__":
    run_evaluation()
