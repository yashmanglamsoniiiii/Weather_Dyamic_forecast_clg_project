import React from 'react';
import { X, Award, CheckCircle2, BarChart2, ShieldCheck, Database, Layers } from 'lucide-react';

export default function MetricsModal({ isOpen, onClose, metrics }) {
  if (!isOpen || !metrics) return null;

  const reg = metrics.regression || {};
  const clf = metrics.classification?.rain || {};
  const dataset = metrics.dataset_info || {};

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '32px',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Machine Learning Model Architecture</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Official ECMWF Copernicus ERA5 Hourly Reanalysis Benchmark Evaluation
            </p>
          </div>
        </div>

        {/* Dataset Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            marginBottom: '24px'
          }}
        >
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Database size={14} color="#38bdf8" />
              <span>Training Samples</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
              {dataset.train_samples?.toLocaleString() || '41,928'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Test Samples (Out-of-Time)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
              {dataset.test_samples?.toLocaleString() || '10,482'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Layers size={14} color="#a855f7" />
              <span>Engineered Features</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
              {dataset.features_count || 35}
            </div>
          </div>
        </div>

        {/* Section 1: Regression Models */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#38bdf8' }}>
          1. Regression Models (MAE, RMSE, R² Score)
        </h3>
        <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Target Variable</th>
                <th style={{ padding: '8px 12px' }}>Model Architecture</th>
                <th style={{ padding: '8px 12px' }}>MAE</th>
                <th style={{ padding: '8px 12px' }}>RMSE</th>
                <th style={{ padding: '8px 12px' }}>R² Score</th>
                <th style={{ padding: '8px 12px' }}>Baseline (Ridge)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Temperature (°C)</td>
                <td style={{ padding: '10px 12px' }}>{reg.temperature?.model || 'XGBoost Regressor'}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8', fontWeight: 600 }}>{reg.temperature?.mae} °C</td>
                <td style={{ padding: '10px 12px' }}>{reg.temperature?.rmse} °C</td>
                <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>{reg.temperature?.r2}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>MAE {reg.temperature?.baseline_ridge?.mae} °C (R² {reg.temperature?.baseline_ridge?.r2})</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Humidity (%)</td>
                <td style={{ padding: '10px 12px' }}>{reg.humidity?.model || 'XGBoost Regressor'}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8', fontWeight: 600 }}>{reg.humidity?.mae} %</td>
                <td style={{ padding: '10px 12px' }}>{reg.humidity?.rmse} %</td>
                <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>{reg.humidity?.r2}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>--</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Wind Speed (km/h)</td>
                <td style={{ padding: '10px 12px' }}>{reg.wind_speed?.model || 'LightGBM Regressor'}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8', fontWeight: 600 }}>{reg.wind_speed?.mae} km/h</td>
                <td style={{ padding: '10px 12px' }}>{reg.wind_speed?.rmse} km/h</td>
                <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>{reg.wind_speed?.r2}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>--</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Pressure (hPa)</td>
                <td style={{ padding: '10px 12px' }}>{reg.pressure?.model || 'XGBoost Regressor'}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8', fontWeight: 600 }}>{reg.pressure?.mae} hPa</td>
                <td style={{ padding: '10px 12px' }}>{reg.pressure?.rmse} hPa</td>
                <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>{reg.pressure?.r2}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>--</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Rain Classifier */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#a855f7' }}>
          2. Rain Classifier (Class-Imbalance Weighted XGBoost)
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accuracy</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
              {(clf.accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROC-AUC</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
              {clf.roc_auc?.toFixed(4)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recall (Rain Hit)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc' }}>
              {(clf.recall * 100).toFixed(1)}%
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>F1-Score</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {clf.f1_score?.toFixed(4)}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scale Pos Weight</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>
              {clf.scale_pos_weight}x
            </div>
          </div>
        </div>

        {/* Feature Importance Highlights */}
        {metrics.feature_importance && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#fbbf24' }}>
              3. Top Meteorological Predictor Weights
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Temperature Predictors:</div>
                {metrics.feature_importance.temperature_top_10?.slice(0, 5).map(([feat, imp], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{feat}</span>
                    <span style={{ fontWeight: 600, color: '#38bdf8' }}>{(imp * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div className="glass-panel" style={{ padding: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Rain Event Predictors:</div>
                {metrics.feature_importance.rain_top_10?.slice(0, 5).map(([feat, imp], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{feat}</span>
                    <span style={{ fontWeight: 600, color: '#a855f7' }}>{(imp * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
