import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  ComposedChart
} from 'recharts';
import { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudLightning, Droplets } from 'lucide-react';

function getHourIcon(icon, size = 18) {
  switch (icon) {
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

export default function ForecastChart({ hourlyData, unit, convertTemp }) {
  if (!hourlyData || hourlyData.length === 0) return null;

  // Format chart data
  const chartData = hourlyData.map((item) => ({
    time: item.time,
    temp: convertTemp(item.temperature),
    tempRaw: item.temperature,
    humidity: item.humidity,
    rainProb: item.rain_probability,
    wind: item.wind_speed,
    condition: item.condition
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="glass-panel-elevated"
          style={{
            padding: '12px 16px',
            fontSize: '0.85rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
            {data.time} — {data.condition}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-main)' }}>
            <div>Temperature: <strong>{data.temp}°{unit}</strong></div>
            <div>Rain Probability: <strong style={{ color: '#38bdf8' }}>{data.rainProb}%</strong></div>
            <div>Humidity: <strong>{data.humidity}%</strong></div>
            <div>Wind Speed: <strong>{data.wind} km/h</strong></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>24-Hour ML Autoregressive Forecast</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Hourly projections synthesized via recursive multi-step XGBoost inference
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
            <span style={{ color: 'var(--text-muted)' }}>Temperature (°{unit})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(99, 102, 241, 0.6)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Rain Probability (%)</span>
          </div>
        </div>
      </div>

      {/* Recharts 24-Hour Curve */}
      <div style={{ width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide={true} />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="right" dataKey="rainProb" fill="#6366f1" fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={20} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#tempGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Strip Cards */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          marginTop: '20px',
          paddingBottom: '8px'
        }}
      >
        {hourlyData.slice(0, 16).map((hour, idx) => (
          <div
            key={idx}
            className="glass-panel-elevated"
            style={{
              minWidth: '82px',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              background: idx === 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.5)',
              border: idx === 0 ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <span style={{ fontSize: '0.75rem', color: idx === 0 ? '#38bdf8' : 'var(--text-muted)' }}>
              {idx === 0 ? 'Now' : hour.time}
            </span>
            {getHourIcon(hour.icon, 20)}
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>
              {convertTemp(hour.temperature)}°
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#38bdf8' }}>
              <Droplets size={10} />
              <span>{Math.round(hour.rain_probability)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
