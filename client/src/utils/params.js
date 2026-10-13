// Drops empty filters so the API's enum validation doesn't reject ''
export function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
}
