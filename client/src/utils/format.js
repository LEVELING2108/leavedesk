// Leave dates are stored at UTC midnight, so format them in UTC to avoid off-by-one days
export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

// Today's date in the user's timezone as YYYY-MM-DD, for <input type="date" min>
export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
