/**
 * AeroCast Client API Service
 * Interacts with Node.js Express backend proxying to Python ML Microservice
 */

const API_BASE = '/api/weather';

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error('searchCities error:', err);
    return [];
  }
}

export async function getForecast({ city, lat, lon }) {
  let url = `${API_BASE}/forecast?`;
  if (city) {
    url += `city=${encodeURIComponent(city)}`;
  } else if (lat !== undefined && lon !== undefined) {
    url += `lat=${lat}&lon=${lon}`;
  } else {
    throw new Error('Either city or lat/lon required for forecast');
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Forecast request failed (${res.status})`);
  }
  const data = await res.json();
  return data.data;
}

export async function getModelMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error('Failed to load metrics');
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('getModelMetrics error:', err);
    return null;
  }
}

export async function getSystemHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
