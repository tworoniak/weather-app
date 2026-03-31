export function cityLabel(name: string, region?: string, country?: string) {
  return `${name}${region ? `, ${region}` : ''}${country ? `, ${country}` : ''}`;
}
