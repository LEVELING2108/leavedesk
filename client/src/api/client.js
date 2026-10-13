import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// The access token lives only in memory: an XSS payload can't read it from storage,
// and a page reload recovers it through the httpOnly refresh cookie
let accessToken = null;
let onSessionExpired = () => {};

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => { accessToken = token; };
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

// Single-flight: concurrent 401s (and StrictMode's double mount) share one refresh call.
// Without this, two requests would present the same refresh token and trip reuse detection.
let refreshing = null;
export function refreshSession() {
  refreshing ??= api
    .post('/auth/refresh')
    .then(({ data }) => {
      setAccessToken(data.data.accessToken);
      return data.data;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (err.response?.status !== 401 || isAuthCall || original._retried) throw err;

    original._retried = true;
    try {
      await refreshSession();
    } catch {
      setAccessToken(null);
      onSessionExpired();
      throw err;
    }
    return api(original);
  },
);

export function getErrorMessage(err) {
  const data = err?.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join(', ');
  return data?.message ?? err?.message ?? 'Something went wrong';
}
