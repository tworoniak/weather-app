import type { Coords, WeatherAlert } from './schemas';

type NwsFeatureCollection = {
  features?: Array<{
    id?: string;
    properties?: {
      event?: string;
      severity?: string;
      urgency?: string;
      certainty?: string;
      areaDesc?: string;
      headline?: string;
      description?: string;
      instruction?: string;
      effective?: string;
      expires?: string;
      senderName?: string;
      web?: string;
    };
  }>;
};

function toEpochMs(iso?: string): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : undefined;
}

function pickEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

const Severity = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'] as const;
const Urgency = ['Immediate', 'Expected', 'Future', 'Past', 'Unknown'] as const;
const Certainty = [
  'Observed',
  'Likely',
  'Possible',
  'Unlikely',
  'Unknown',
] as const;

export async function fetchNwsAlertsByCoords(
  coords: Coords,
): Promise<WeatherAlert[]> {
  // NWS endpoint (no API key)
  const url = `https://api.weather.gov/alerts/active?point=${coords.lat},${coords.lon}`;

  const res = await fetch(url, {
    headers: {
      // NWS asks for a descriptive User-Agent (contact info is ideal)
      'User-Agent':
        'WeatherAppButActuallyCool (https://github.com/tworoniak/weather-app)',
      Accept: 'application/geo+json',
    },
  });

  if (!res.ok) {
    // fail-soft: alerts shouldn't break the app
    return [];
  }

  const json = (await res.json()) as NwsFeatureCollection;
  const features = json.features ?? [];

  return features
    .map((f, i): WeatherAlert | null => {
      const p = f.properties ?? {};
      const title = p.event?.trim() || 'Weather Alert';

      const id =
        f.id?.toString() || `${coords.lat},${coords.lon}:${i}:${title}`;

      return {
        id,
        title,
        severity: pickEnum(p.severity, Severity, 'Unknown'),
        urgency: pickEnum(p.urgency, Urgency, 'Unknown'),
        certainty: pickEnum(p.certainty, Certainty, 'Unknown'),
        areaDesc: p.areaDesc || undefined,
        headline: p.headline || undefined,
        description: p.description || undefined,
        instruction: p.instruction || undefined,
        effective: toEpochMs(p.effective),
        expires: toEpochMs(p.expires),
        sender: p.senderName || undefined,
        link: p.web || undefined,
      };
    })
    .filter((a): a is WeatherAlert => a !== null);
}
