import axios from 'axios';

const GEOCODING_BASE_URL = process.env.GEOCODING_API_URL || 'https://geocoding-api.open-meteo.com/v1';

export async function searchCities(query, count = 6) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await axios.get(`${GEOCODING_BASE_URL}/search`, {
      params: {
        name: query.trim(),
        count: count,
        language: 'en',
        format: 'json'
      },
      timeout: 8000
    });

    const results = response.data?.results || [];
    return results.map((item) => ({
      id: item.id,
      name: item.name,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || '',
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation || 0,
      timezone: item.timezone || 'UTC',
      formattedName: [item.name, item.admin1, item.country].filter(Boolean).join(', ')
    }));
  } catch (error) {
    console.error('[Geocoding Service Error]:', error.message);
    throw new Error(`Failed to geocode query "${query}": ${error.message}`);
  }
}
