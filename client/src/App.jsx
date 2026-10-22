import React, { useState } from 'react';
import { useWeather } from './hooks/useWeather';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';
import ForecastChart from './components/ForecastChart';
import Scene3D from './components/Scene3D';
import MetricsModal from './components/MetricsModal';
import {
  CloudLightning,
  Cpu,
  BarChart2,
  RefreshCw,
  AlertCircle,
  Compass,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const {
    data,
    metrics,
    loading,
    error,
    unit,
    toggleUnit,
    convertTemp,
    loadForecast
  } = useWeather();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectCity = (locationParams) => {
    loadForecast(locationParams);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(7, 11, 20, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 50%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
              }}
            >
              <CloudLightning size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AeroCast AI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                ML Weather Intelligence
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              title="Inspect Model Performance & Benchmark Reports"
            >
              <Cpu size={15} color="#c084fc" />
              <span>Model Transparency</span>
            </button>

            <button
              onClick={toggleUnit}
              className="btn-ghost"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <span>°{unit}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px 60px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Search Bar Row */}
        <section style={{ maxWidth: '720px', width: '100%', margin: '0 auto' }}>
          <SearchBar
            onSelectCity={handleSelectCity}
            currentCityName={data?.location?.name}
          />
        </section>

        {/* Error Alert */}
        {error && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <AlertCircle size={20} color="#f43f5e" />
            <div style={{ color: '#fecdd3', fontSize: '0.9rem' }}>{error}</div>
            <button
              onClick={() => loadForecast({ city: 'Tokyo' })}
              className="btn-ghost"
              style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Reset to Tokyo
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && !data && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px' }}>
            <RefreshCw size={36} color="#38bdf8" className="pulse-glow" style={{ animation: 'spin 1.5s linear infinite' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Synthesizing ECMWF Reanalysis & Running ML Models...</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculating lags, barometric tendencies, and XGBoost next-hour predictions</div>
          </div>
        )}

        {/* Main Content Grid */}
        {data && (
          <>
            {/* Top Row: Weather Card (Left) & 3D Interactive Scene (Right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '24px',
                alignItems: 'stretch'
              }}
            >
              {/* Left Column: Weather Card */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <WeatherCard
                  data={data}
                  unit={unit}
                  convertTemp={convertTemp}
                  onToggleUnit={toggleUnit}
                />
              </div>

              {/* Right Column: 3D Scene Viewport */}
              <div
                className="glass-panel"
                style={{
                  minHeight: '440px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Scene3D
                  sceneConfig={data.scene_3d}
                  location={data.location}
                />
              </div>
            </div>

            {/* Bottom Row: 24-Hour ML Autoregressive Forecast */}
            <ForecastChart
              hourlyData={data.hourly_forecast}
              unit={unit}
              convertTemp={convertTemp}
            />
          </>
        )}
      </main>

      {/* Model Transparency Modal */}
      <MetricsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metrics={metrics}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-glass)',
          background: 'rgba(7, 11, 20, 0.9)',
          padding: '24px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          textAlign: 'center'
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            AeroCast AI — Weather Forecast ML College Project • Powered by <strong>ECMWF Copernicus ERA5 Reanalysis</strong>, <strong>XGBoost</strong>, <strong>LightGBM</strong>, <strong>Node.js Express</strong> & <strong>React Three Fiber</strong>
          </div>
          <div>
            Built with real trained machine learning models across global meteorological datasets.
          </div>
        </div>
      </footer>
    </div>
  );
}
