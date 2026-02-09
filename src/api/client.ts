import axios from 'axios';

// For many weather providers you may not need a baseURL.
// Keep it here if you later proxy via /api (Vercel/Netlify) or swap providers.
export const api = axios.create({
  baseURL: import.meta.env.VITE_WEATHER_BASE_URL || '',
  timeout: 15_000,
});
