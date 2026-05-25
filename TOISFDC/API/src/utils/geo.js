const axios = require('axios');

/**
 * Haversine distance between two lat/lng points — returns metres.
 * Equivalent to Salesforce Location.getDistance(..., 'km') * 1000
 */
function haversineMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getLocationName(lat, lng) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return '';
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
    const { data } = await axios.get(url);
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address || '';
    }
  } catch (e) {
    console.error('Geocoding error:', e.message);
  }
  return '';
}

module.exports = { haversineMetres, getLocationName };
