import { useCallback, useMemo, useState } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; coords: { lat: number; lon: number } }
  | { status: 'error'; message: string };

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const canUse = useMemo(
    () => typeof navigator !== 'undefined' && 'geolocation' in navigator,
    [],
  );

  const request = useCallback(() => {
    if (!canUse) {
      setState({
        status: 'error',
        message: 'Geolocation is not supported in this browser.',
      });
      return;
    }

    setState({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'ready',
          coords: { lat: pos.coords.latitude, lon: pos.coords.longitude },
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Search for a city instead.'
            : err.code === err.TIMEOUT
              ? 'Location request timed out. Try again, or turn on Wi-Fi / move near a window.'
              : err.code === err.POSITION_UNAVAILABLE
                ? 'Location unavailable right now. Try again or use city search.'
                : err.message || 'Unable to get location.';

        setState({ status: 'error', message: msg });
      },
      options,
    );
  }, [canUse, options]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, request, reset, canUse } as const;
}
