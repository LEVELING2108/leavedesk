import { capitalize } from '../utils/format';
import { LEAVE_STATUSES, LEAVE_TYPES } from '../utils/constants';

export function LeaveFilters({ status, type, onChange }) {
  return (
    <div className="filters">
      <select aria-label="Filter by status" value={status} onChange={(e) => onChange({ status: e.target.value })}>
        <option value="">All statuses</option>
        {LEAVE_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
      </select>
      <select aria-label="Filter by type" value={type} onChange={(e) => onChange({ type: e.target.value })}>
        <option value="">All types</option>
        {LEAVE_TYPES.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
      </select>
    </div>
  );
}
