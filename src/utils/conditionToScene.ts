export type SceneId =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'thunder';

function normalize(condition: string) {
  return condition.trim().toLowerCase();
}

/**
 * Map your normalized condition strings (from weatherCodeToCondition)
 * + isDay to a background "scene".
 */
export function conditionToScene(condition: string, isDay: boolean): SceneId {
  const c = normalize(condition);

  // Thunder first
  if (c.includes('thunder')) return 'thunder';

  // Wintry
  if (c.includes('snow')) return 'snow';

  // Fog/mist/haze
  if (c.includes('fog') || c.includes('mist') || c.includes('haze'))
    return 'fog';

  // Rainy
  if (c.includes('rain') || c.includes('drizzle') || c.includes('showers'))
    return 'rain';

  // Cloudy/overcast
  if (c.includes('cloud')) return 'cloudy';

  // Default: clear day/night
  return isDay ? 'clear-day' : 'clear-night';
}
