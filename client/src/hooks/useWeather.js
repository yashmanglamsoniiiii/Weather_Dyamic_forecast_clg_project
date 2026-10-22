import { useState, useEffect, useCallback } from 'react';
import { getForecast, getModelMetrics } from '../services/api';

const DEFAULT_CITY = 'Tokyo';

export function useWeather() {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const [activeTab, setActiveTab] = useState('forecast'); // 'forecast' | 'scene' | 'metrics'

  const loadForecast = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const forecastData = await getForecast(params);
      setData(forecastData);
    } catch (err) {
      console.error('Forecast fetch failed:', err);
      setError(err.message || 'Unable to fetch weather forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const metricsData = await getModelMetrics();
      if (metricsData) setMetrics(metricsData);
    } catch (err) {
      console.warn('Metrics fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    loadForecast({ city: DEFAULT_CITY });
    loadMetrics();
  }, [loadForecast, loadMetrics]);

  const toggleUnit = () => {
    setUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  };

  const convertTemp = (tempC) => {
    if (tempC === undefined || tempC === null) return '--';
    if (unit === 'F') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  };

  return {
    data,
    metrics,
    loading,
    error,
    unit,
    activeTab,
    setActiveTab,
    toggleUnit,
    convertTemp,
    loadForecast
  };
}
