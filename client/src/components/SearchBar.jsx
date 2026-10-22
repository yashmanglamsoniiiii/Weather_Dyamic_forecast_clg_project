import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { searchCities } from '../services/api';

const QUICK_CITIES = ['Tokyo', 'London', 'New York', 'Mumbai', 'Paris', 'Sydney'];

export default function SearchBar({ onSelectCity, currentCityName }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const results = await searchCities(query);
      setSuggestions(results);
      setLoading(false);
      setIsOpen(true);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery('');
    setIsOpen(false);
    onSelectCity({
      city: item.name,
      lat: item.latitude,
      lon: item.longitude,
      elevation: item.elevation
    });
  };

  const handleQuickSelect = (cityName) => {
    onSelectCity({ city: cityName });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      onSelectCity({ city: query.trim() });
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {/* Search Input Bar */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}
      >
        <Search size={20} color="#38bdf8" style={{ marginRight: '12px', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search global city or area (e.g., Tokyo, London, Mumbai)..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '1rem',
            fontFamily: 'var(--font-heading)'
          }}
        />

        {loading ? (
          <Loader2 size={18} color="#94a3b8" className="pulse-glow" style={{ animation: 'spin 1s linear infinite' }} />
        ) : query ? (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="glass-panel-elevated"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 50,
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '8px',
            boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}
        >
          {suggestions.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={16} color="#38bdf8" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {[item.admin1, item.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick City Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '4px' }}>Trending:</span>
        {QUICK_CITIES.map((c) => (
          <button
            key={c}
            onClick={() => handleQuickSelect(c)}
            className="btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: '9999px',
              border: currentCityName?.toLowerCase().includes(c.toLowerCase())
                ? '1px solid rgba(56, 189, 248, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              color: currentCityName?.toLowerCase().includes(c.toLowerCase()) ? '#38bdf8' : 'var(--text-muted)'
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
