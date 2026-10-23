import { useEffect, useEffectEvent } from 'react';

type SettledFetcher = {
  state: 'idle' | 'loading' | 'submitting';
  data?: { success: boolean };
};

// A routed form panel closes once its write has settled and succeeded. `close` is read as an effect event, so a
// new close function on each render does not re-run the check (and never closes twice).
export function useCloseOnSuccess(fetcher: SettledFetcher, close: () => void) {
  const closeOnSuccess = useEffectEvent(close);
  const isSettledSuccess = fetcher.state === 'idle' && fetcher.data?.success === true;

  useEffect(() => {
    if (isSettledSuccess) closeOnSuccess();
  }, [isSettledSuccess, fetcher.data]);
}
