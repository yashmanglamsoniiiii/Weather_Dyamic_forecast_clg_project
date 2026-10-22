import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  CloudRain,
  Sun,
  CloudSun,
  Cloud,
  CloudLightning,
  Snowflake,
  Compass,
  Cpu,
  ArrowUpRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

function getWeatherIcon(iconName, size = 28) {
  switch (iconName) {
    case 'sun': return <Sun size={size} color="#f59e0b" />;
    case 'cloud-sun': return <CloudSun size={size} color="#fbbf24" />;
    case 'cloud': return <Cloud size={size} color="#94a3b8" />;
    case 'cloud-rain': return <CloudRain size={size} color="#38bdf8" />;
    case 'cloud-drizzle': return <CloudRain size={size} color="#06b6d4" />;
    case 'cloud-lightning': return <CloudLightning size={size} color="#a855f7" />;
    case 'snowflake': return <Snowflake size={size} color="#e0f2fe" />;
    default: return <Sun size={size} color="#f59e0b" />;
  }
}

export default function WeatherCard({ data, unit, convertTemp, onToggleUnit }) {
  if (!data) return null;

  const { location, live_current, ml_forecast } = data;
  const isRain = ml_forecast.rain_yes_no;
  const rainProb = ml_forecast.rain_probability;
  const icon = ml_forecast.condition?.icon || 'sun';

  const tempDisplay = convertTemp(ml_forecast.temperature_celsius);
  const liveTempDisplay = convertTemp(live_current.temperature_2m);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero Weather Summary Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)'
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: isRain ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.12)',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-model">
                <Cpu size={12} />
                <span>ERA5 ML FORECAST</span>
              </span>
              <span className={isRain ? 'badge badge-rain' : 'badge badge-dry'}>
                {isRain ? 'Rain Predicted' : 'No Rain Expected'}
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              {location.name}
              {location.country ? `, ${location.country}` : ''}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {location.latitude.toFixed(3)}°N, {location.longitude.toFixed(3)}°E • Elevation {location.elevation || 20}m
            </div>
          </div>

          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            className="btn-ghost"
            style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem' }}
            title="Toggle Celsius / Fahrenheit"
          >
            <Thermometer size={14} color="#38bdf8" />
            <span>°{unit}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Switch to °{unit === 'C' ? 'F' : 'C'}</span>
          </button>
        </div>

        {/* Main Temperature and Condition Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '24px',
            marginTop: '24px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '4.8rem', fontWeight: 800, lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
              {tempDisplay}
            </span>
            <span style={{ fontSize: '2rem', color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '8px' }}>
              °{unit}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {getWeatherIcon(icon, 32)}
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{ml_forecast.condition?.main}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ml_forecast.condition?.description}</div>
            </div>
          </div>
        </div>

        {/* Rain Probability Banner */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CloudRain size={20} color="#38bdf8" />
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Precipitation Chance: {rainProb}%</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                (XGBoost Weighted Classifier)
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '140px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, rainProb))}%`,
                height: '100%',
                background: rainProb > 50 ? 'linear-gradient(90deg, #38bdf8, #6366f1)' : '#38bdf8',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Atmospheric Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Humidity Card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Relative Humidity</span>
            <Droplets size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            {ml_forecast.relative_humidity}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Observation: {live_current.relative_humidity_2m}%
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wind Velocity</span>
            <Wind size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            {ml_forecast.wind_speed_kmh} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Bearing: {live_current.wind_direction_10m ?? 0}°
          </div>
        </div>

        {/* Surface Pressure Card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Surface Pressure</span>
            <Gauge size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            {ml_forecast.surface_pressure_hpa} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>hPa</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Tendency: Stable barometric trend
          </div>
        </div>

        {/* Model vs Live Comparison Card */}
        <div className="glass-panel" style={{ padding: '18px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#c084fc' }}>Live vs ML Forecast</span>
            <Cpu size={18} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Observed: {liveTempDisplay}°{unit}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginTop: '4px', fontWeight: 500 }}>
            ML Next-Hour: {tempDisplay}°{unit} (Δ {(ml_forecast.temperature_celsius - live_current.temperature_2m).toFixed(1)}°C)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            ECMWF Copernicus Reanalysis
          </div>
        </div>
      </div>
    </div>
  );
}
