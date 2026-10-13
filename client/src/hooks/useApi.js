import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/client';

// Runs `fetcher` whenever it changes (wrap it in useCallback) and tracks loading/error state.
// Each result remembers which request produced it: loading is derived from that, and
// stale responses are dropped so fast filter changes can't overwrite newer results.
export function useApi(fetcher) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ fetcher: null, version: -1, data: null, error: null });

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => active && setResult({ fetcher, version, data, error: null }))
      .catch((err) => active && setResult((r) => ({ fetcher, version, data: r.data, error: getErrorMessage(err) })));
    return () => { active = false; };
  }, [fetcher, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const loading = result.fetcher !== fetcher || result.version !== version;
  return { data: result.data, error: loading ? null : result.error, loading, reload };
}
