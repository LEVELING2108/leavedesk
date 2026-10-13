import { capitalize } from '../utils/format';

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{capitalize(status)}</span>;
}
