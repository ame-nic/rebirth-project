/* Open-Meteo — no API key, no signup, CORS-friendly. */

import { resilientFetch } from "../../../shared/utils/fetchUtils.js";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/* WMO weather codes → human-readable Italian descriptions (subset).
   Reference: https://open-meteo.com/en/docs */
function wmoDescription(code) {
  const map = {
    0: "Sereno", 1: "Quasi sereno", 2: "Parzialmente nuvoloso", 3: "Nuvoloso",
    45: "Nebbia", 48: "Nebbia ghiacciata",
    51: "Pioggerella", 53: "Pioggerella", 55: "Pioggerella intensa",
    61: "Pioggia", 63: "Pioggia", 65: "Pioggia intensa",
    71: "Neve", 73: "Neve", 75: "Neve intensa",
    80: "Rovescio", 81: "Rovescio", 82: "Rovescio intenso",
    95: "Temporale", 96: "Temporale con grandine", 99: "Temporale forte",
  };
  return map[code] ?? "Variabile";
}

/* Map WMO code → Phosphor icon class. Aligned with Zeroth (no emoji). */
export function wmoIcon(code) {
  if (code === 0)  return "ph-sun";
  if (code <= 2)   return "ph-cloud-sun";
  if (code === 3)  return "ph-cloud";
  if (code <= 48)  return "ph-cloud-fog";
  if (code <= 67)  return "ph-cloud-rain";
  if (code <= 77)  return "ph-cloud-snow";
  if (code <= 82)  return "ph-cloud-rain";
  if (code >= 95)  return "ph-cloud-lightning";
  return "ph-thermometer";
}

function deriveTrainingNote({ temperature_2m: temp, precipitation: rain }) {
  if (rain > 0)   return "Pioggia · sessione indoor confermata.";
  if (temp < 5)   return "Freddo intenso · riscaldamento prolungato obbligatorio.";
  if (temp > 30)  return "Caldo · riduci i recuperi e idratati bene.";
  if (temp >= 15) return "Buone condizioni · considera una corsa esterna.";
  return null;
}

export async function fetchWeather(source) {
  const { lat, lon } = source.config;
  const url = `${ENDPOINT}?latitude=${lat}&longitude=${lon}`
    + "&current=temperature_2m,apparent_temperature,precipitation,"
    + "weathercode,windspeed_10m,relativehumidity_2m"
    + "&timezone=Europe%2FRome&forecast_days=1";

  const res = await resilientFetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = await res.json();
  const c = data.current;

  return {
    temp:         Math.round(c.temperature_2m),
    feelsLike:    Math.round(c.apparent_temperature),
    humidity:     c.relativehumidity_2m,
    wind:         Math.round(c.windspeed_10m),
    rain:         c.precipitation > 0,
    weatherCode:  c.weathercode,
    description:  wmoDescription(c.weathercode),
    icon:         wmoIcon(c.weathercode),
    trainingNote: deriveTrainingNote(c),
    fetchedAt:    new Date().toISOString(),
  };
}
