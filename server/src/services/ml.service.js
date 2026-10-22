import axios from 'axios';

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export async function checkMLServiceHealth() {
  try {
    const res = await axios.get(`${ML_BASE_URL}/health`, { timeout: 3000 });
    return res.data;
  } catch (error) {
    return {
      status: 'offline',
      error: error.message
    };
  }
}

export async function getMLMetrics() {
  try {
    const res = await axios.get(`${ML_BASE_URL}/metrics`, { timeout: 4000 });
    return res.data;
  } catch (error) {
    console.warn('[ML Service Warning] Failed to get metrics from Python service:', error.message);
    return null;
  }
}

export async function predictWithML(payload) {
  try {
    const res = await axios.post(`${ML_BASE_URL}/predict`, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  } catch (error) {
    console.error('[ML Service Error] /predict failed:', error.message);
    throw new Error(`ML Service prediction error: ${error.message}`);
  }
}

export async function forecast24hWithML(payload) {
  try {
    const res = await axios.post(`${ML_BASE_URL}/forecast-24h`, payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  } catch (error) {
    console.error('[ML Service Error] /forecast-24h failed:', error.message);
    throw new Error(`ML Service 24h forecast error: ${error.message}`);
  }
}
