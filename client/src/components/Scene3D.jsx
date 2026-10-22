import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from './objects/Globe';
import AtmosphericRadar from './objects/AtmosphericRadar';
import { Globe2, Radio, Layers, Compass } from 'lucide-react';

export default function Scene3D({ sceneConfig, location }) {
  // Default to the high-tech 3D Planetary Radar Globe!
  const [viewMode, setViewMode] = useState('globe'); // 'globe' or 'sounding'

  const {
    isDay = true,
    condition = 'Clear',
    rain = { active: false, intensity: 0.5 },
    snow = { active: false }
  } = sceneConfig || {};

  const lat = location?.latitude ?? 35.6762;
  const lon = location?.longitude ?? 139.6503;
  const elevation = location?.elevation ?? 20;
  const cityName = location?.name || 'Selected City';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '440px' }}>
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0.4, 5.8], fov: 42 }}
        style={{
          background: 'radial-gradient(ellipse at center, #0a1124 0%, #030712 100%)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <Suspense fallback={null}>
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3.8}
            maxDistance={8.5}
            autoRotate={false}
          />

          {/* Balanced cinematic lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[6, 8, 6]} intensity={1.4} color="#f0f9ff" />
          <pointLight position={[-6, -4, -4]} intensity={0.6} color="#0284c7" />

          {/* Deep Space Background Stars */}
          <Stars
            radius={60}
            depth={25}
            count={2000}
            factor={3}
            saturation={0.4}
            fade
            speed={0.4}
          />

          {viewMode === 'globe' ? (
            /* Mode 1: High-Tech 3D Planetary Radar Digital Twin */
            <Globe lat={lat} lon={lon} cityName={cityName} />
          ) : (
            /* Mode 2: Atmospheric LiDAR Sounding Chamber */
            <AtmosphericRadar sceneConfig={sceneConfig} />
          )}
        </Suspense>
      </Canvas>

      {/* Top-Left Telemetry HUD Badge */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            padding: '5px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#38bdf8'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#34d399',
              boxShadow: '0 0 8px #34d399'
            }}
          />
          <span>LIVE METEOROLOGICAL RADAR</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
          ECMWF Copernicus Digital Twin • Sentinel-3 Feed
        </div>
      </div>

      {/* Top-Right Mode Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '6px',
          zIndex: 10
        }}
      >
        <button
          onClick={() => setViewMode('globe')}
          className="btn-ghost"
          style={{
            padding: '6px 12px',
            fontSize: '0.78rem',
            background: viewMode === 'globe' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.75)',
            border: viewMode === 'globe' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: viewMode === 'globe' ? '#38bdf8' : 'var(--text-muted)'
          }}
          title="Planetary Radar Globe"
        >
          <Globe2 size={13} />
          <span>Planetary Radar</span>
        </button>

        <button
          onClick={() => setViewMode('sounding')}
          className="btn-ghost"
          style={{
            padding: '6px 12px',
            fontSize: '0.78rem',
            background: viewMode === 'sounding' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.75)',
            border: viewMode === 'sounding' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: viewMode === 'sounding' ? '#c084fc' : 'var(--text-muted)'
          }}
          title="Atmospheric Sounding Chamber"
        >
          <Layers size={13} />
          <span>LiDAR Sounding</span>
        </button>
      </div>

      {/* Bottom Telemetry HUD Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(14px)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)' }}>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>TARGET: </span>
            <strong style={{ color: 'var(--text-main)' }}>{cityName}</strong>
          </div>
          <div style={{ color: 'var(--accent-cyan)' }}>
            [{lat.toFixed(2)}°N, {lon.toFixed(2)}°E]
          </div>
          <div style={{ opacity: 0.6 }}>
            ELEV: {elevation}m
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={12} color="#34d399" />
          <span>Interactive Orbit • Drag to Rotate • Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
}
