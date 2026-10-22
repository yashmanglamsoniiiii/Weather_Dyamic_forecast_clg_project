"""
Weather Forecast ML Project - Training Pipeline
Trains XGBoost / LightGBM models for regression (temp, humidity, wind, pressure)
and XGBoost Classifier for rain detection (with scale_pos_weight for imbalance).
Compares against baseline models, calculates metrics (MAE, RMSE, R2, ROC-AUC, F1),
and exports artifacts to models/ directory.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor, XGBClassifier
from lightgbm import LGBMRegressor
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

PROCESSED_DIR = "D:/weather forecast_clg_project/ml-service/data/processed"
MODELS_DIR = "D:/weather forecast_clg_project/ml-service/models"

def load_data():
    """Loads preprocessed train and test data."""
    train_df = pd.read_csv(os.path.join(PROCESSED_DIR, "train.csv"))
    test_df = pd.read_csv(os.path.join(PROCESSED_DIR, "test.csv"))
    
    with open(os.path.join(MODELS_DIR, "feature_names.json"), "r") as f:
        feature_cols = json.load(f)

    X_train = train_df[feature_cols]
    X_test = test_df[feature_cols]
    
    return train_df, test_df, X_train, X_test, feature_cols

def train_and_evaluate():
    os.makedirs(MODELS_DIR, exist_ok=True)
    train_df, test_df, X_train, X_test, feature_cols = load_data()
    
    metrics = {
        "dataset_info": {
            "train_samples": int(len(train_df)),
            "test_samples": int(len(test_df)),
            "features_count": len(feature_cols),
            "features": feature_cols
        },
        "regression": {},
        "classification": {}
    }
    
    print("\n=======================================================")
    print("  WEATHER FORECAST ML TRAINING PIPELINE (ERA5 REANALYSIS)")
    print("=======================================================\n")
    
    # ---------------------------------------------------------
    # 1. TEMPERATURE REGRESSOR (XGBoost vs Baseline Ridge)
    # ---------------------------------------------------------
    print("[1/5] Training Temperature Regressor (XGBoost)...")
    y_train_temp = train_df["target_temp"]
    y_test_temp = test_df["target_temp"]

    xgb_temp = XGBRegressor(
        n_estimators=180,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1
    )
    xgb_temp.fit(X_train, y_train_temp)
    pred_temp = xgb_temp.predict(X_test)
    
    # Baseline comparison
    ridge_temp = Ridge(alpha=1.0)
    ridge_temp.fit(X_train, y_train_temp)
    pred_temp_baseline = ridge_temp.predict(X_test)

    temp_mae = float(mean_absolute_error(y_test_temp, pred_temp))
    temp_rmse = float(root_mean_squared_error(y_test_temp, pred_temp))
    temp_r2 = float(r2_score(y_test_temp, pred_temp))
    
    base_temp_mae = float(mean_absolute_error(y_test_temp, pred_temp_baseline))
    base_temp_rmse = float(root_mean_squared_error(y_test_temp, pred_temp_baseline))
    base_temp_r2 = float(r2_score(y_test_temp, pred_temp_baseline))

    metrics["regression"]["temperature"] = {
        "model": "XGBoost Regressor",
        "mae": round(temp_mae, 3),
        "rmse": round(temp_rmse, 3),
        "r2": round(temp_r2, 4),
        "baseline_ridge": {
            "mae": round(base_temp_mae, 3),
            "rmse": round(base_temp_rmse, 3),
            "r2": round(base_temp_r2, 4)
        }
    }
    print(f"    --> XGBoost Temperature MAE: {temp_mae:.3f} C | RMSE: {temp_rmse:.3f} C | R2: {temp_r2:.4f}")
    print(f"    --> Baseline Ridge  MAE: {base_temp_mae:.3f} C | RMSE: {base_temp_rmse:.3f} C | R2: {base_temp_r2:.4f}")
    joblib.dump(xgb_temp, os.path.join(MODELS_DIR, "temp_model.joblib"))

    # ---------------------------------------------------------
    # 2. RELATIVE HUMIDITY REGRESSOR (XGBoost)
    # ---------------------------------------------------------
    print("\n[2/5] Training Relative Humidity Regressor (XGBoost)...")
    y_train_hum = train_df["target_humidity"]
    y_test_hum = test_df["target_humidity"]

    xgb_hum = XGBRegressor(
        n_estimators=160,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        random_state=42,
        n_jobs=-1
    )
    xgb_hum.fit(X_train, y_train_hum)
    pred_hum = xgb_hum.predict(X_test)
    pred_hum = np.clip(pred_hum, 0.0, 100.0)

    hum_mae = float(mean_absolute_error(y_test_hum, pred_hum))
    hum_rmse = float(root_mean_squared_error(y_test_hum, pred_hum))
    hum_r2 = float(r2_score(y_test_hum, pred_hum))

    metrics["regression"]["humidity"] = {
        "model": "XGBoost Regressor",
        "mae": round(hum_mae, 3),
        "rmse": round(hum_rmse, 3),
        "r2": round(hum_r2, 4)
    }
    print(f"    --> Humidity MAE: {hum_mae:.3f} % | RMSE: {hum_rmse:.3f} % | R2: {hum_r2:.4f}")
    joblib.dump(xgb_hum, os.path.join(MODELS_DIR, "humidity_model.joblib"))

    # ---------------------------------------------------------
    # 3. WIND SPEED REGRESSOR (LightGBM)
    # ---------------------------------------------------------
    print("\n[3/5] Training Wind Speed Regressor (LightGBM)...")
    y_train_wind = train_df["target_wind"]
    y_test_wind = test_df["target_wind"]

    lgb_wind = LGBMRegressor(
        n_estimators=160,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )
    lgb_wind.fit(X_train, y_train_wind)
    pred_wind = lgb_wind.predict(X_test)
    pred_wind = np.clip(pred_wind, 0.0, None)

    wind_mae = float(mean_absolute_error(y_test_wind, pred_wind))
    wind_rmse = float(root_mean_squared_error(y_test_wind, pred_wind))
    wind_r2 = float(r2_score(y_test_wind, pred_wind))

    metrics["regression"]["wind_speed"] = {
        "model": "LightGBM Regressor",
        "mae": round(wind_mae, 3),
        "rmse": round(wind_rmse, 3),
        "r2": round(wind_r2, 4)
    }
    print(f"    --> Wind Speed MAE: {wind_mae:.3f} km/h | RMSE: {wind_rmse:.3f} km/h | R2: {wind_r2:.4f}")
    joblib.dump(lgb_wind, os.path.join(MODELS_DIR, "wind_model.joblib"))

    # ---------------------------------------------------------
    # 4. SURFACE PRESSURE REGRESSOR (XGBoost)
    # ---------------------------------------------------------
    print("\n[4/5] Training Surface Pressure Regressor (XGBoost)...")
    y_train_press = train_df["target_pressure"]
    y_test_press = test_df["target_pressure"]

    xgb_press = XGBRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=6,
        subsample=0.85,
        random_state=42,
        n_jobs=-1
    )
    xgb_press.fit(X_train, y_train_press)
    pred_press = xgb_press.predict(X_test)

    press_mae = float(mean_absolute_error(y_test_press, pred_press))
    press_rmse = float(root_mean_squared_error(y_test_press, pred_press))
    press_r2 = float(r2_score(y_test_press, pred_press))

    metrics["regression"]["pressure"] = {
        "model": "XGBoost Regressor",
        "mae": round(press_mae, 3),
        "rmse": round(press_rmse, 3),
        "r2": round(press_r2, 4)
    }
    print(f"    --> Pressure MAE: {press_mae:.3f} hPa | RMSE: {press_rmse:.3f} hPa | R2: {press_r2:.4f}")
    joblib.dump(xgb_press, os.path.join(MODELS_DIR, "pressure_model.joblib"))

    # ---------------------------------------------------------
    # 5. RAIN CLASSIFIER (XGBoost Classifier with scale_pos_weight)
    # ---------------------------------------------------------
    print("\n[5/5] Training Rain Classifier (XGBoost Classifier)...")
    y_train_rain = train_df["target_rain"].astype(int)
    y_test_rain = test_df["target_rain"].astype(int)

    num_neg = (y_train_rain == 0).sum()
    num_pos = (y_train_rain == 1).sum()
    pos_weight = float(num_neg / max(1, num_pos))
    print(f"    Class balance: Negative (dry) = {num_neg}, Positive (rain) = {num_pos} (scale_pos_weight = {pos_weight:.2f})")

    xgb_rain = XGBClassifier(
        n_estimators=180,
        learning_rate=0.08,
        max_depth=6,
        scale_pos_weight=pos_weight,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1,
        eval_metric="logloss"
    )
    xgb_rain.fit(X_train, y_train_rain)

    pred_rain_prob = xgb_rain.predict_proba(X_test)[:, 1]
    pred_rain = (pred_rain_prob >= 0.50).astype(int)

    # Baseline comparison: Logistic Regression
    lr_rain = LogisticRegression(class_weight="balanced", max_iter=1000)
    lr_rain.fit(X_train, y_train_rain)
    pred_rain_lr_prob = lr_rain.predict_proba(X_test)[:, 1]
    pred_rain_lr = (pred_rain_lr_prob >= 0.50).astype(int)

    rain_acc = float(accuracy_score(y_test_rain, pred_rain))
    rain_prec = float(precision_score(y_test_rain, pred_rain, zero_division=0))
    rain_rec = float(recall_score(y_test_rain, pred_rain, zero_division=0))
    rain_f1 = float(f1_score(y_test_rain, pred_rain, zero_division=0))
    rain_auc = float(roc_auc_score(y_test_rain, pred_rain_prob))

    base_rain_acc = float(accuracy_score(y_test_rain, pred_rain_lr))
    base_rain_f1 = float(f1_score(y_test_rain, pred_rain_lr, zero_division=0))
    base_rain_auc = float(roc_auc_score(y_test_rain, pred_rain_lr_prob))

    metrics["classification"]["rain"] = {
        "model": "XGBoost Classifier",
        "scale_pos_weight": round(pos_weight, 2),
        "accuracy": round(rain_acc, 4),
        "precision": round(rain_prec, 4),
        "recall": round(rain_rec, 4),
        "f1_score": round(rain_f1, 4),
        "roc_auc": round(rain_auc, 4),
        "baseline_logistic_regression": {
            "accuracy": round(base_rain_acc, 4),
            "f1_score": round(base_rain_f1, 4),
            "roc_auc": round(base_rain_auc, 4)
        }
    }
    print(f"    --> Rain Accuracy: {rain_acc:.4f} | Precision: {rain_prec:.4f} | Recall: {rain_rec:.4f} | F1: {rain_f1:.4f} | ROC-AUC: {rain_auc:.4f}")
    print(f"    --> Baseline LR Accuracy: {base_rain_acc:.4f} | F1: {base_rain_f1:.4f} | ROC-AUC: {base_rain_auc:.4f}")
    joblib.dump(xgb_rain, os.path.join(MODELS_DIR, "rain_model.joblib"))

    # Feature Importance analysis (Temperature & Rain)
    temp_importance = dict(zip(feature_cols, [float(x) for x in xgb_temp.feature_importances_]))
    sorted_temp_imp = sorted(temp_importance.items(), key=lambda x: x[1], reverse=True)[:10]
    rain_importance = dict(zip(feature_cols, [float(x) for x in xgb_rain.feature_importances_]))
    sorted_rain_imp = sorted(rain_importance.items(), key=lambda x: x[1], reverse=True)[:10]

    metrics["feature_importance"] = {
        "temperature_top_10": sorted_temp_imp,
        "rain_top_10": sorted_rain_imp
    }

    # Save metrics JSON
    metrics_path = os.path.join(MODELS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n[+] Training complete! All models & metrics saved to:", MODELS_DIR)
    return metrics

if __name__ == "__main__":
    train_and_evaluate()
