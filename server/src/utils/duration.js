const UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

// Converts JWT-style durations ('15m', '7d', '3600') to milliseconds for cookie maxAge
export default function ms(value) {
  const match = /^(\d+)\s*([smhd]?)$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const [, amount, unit] = match;
  return Number(amount) * (unit ? UNITS[unit] : 1000);
}
