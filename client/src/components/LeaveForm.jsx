import { useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { capitalize, todayISO } from '../utils/format';
import { LEAVE_TYPES } from '../utils/constants';

const EMPTY = { type: 'casual', startDate: '', endDate: '', reason: '' };

export function LeaveForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    // Mirrors the server rule for instant feedback; the API still validates
    if (form.endDate < form.startDate) return setError('End date must be on or after start date');

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/leaves', form);
      setForm(EMPTY);
      onCreated?.(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Apply for leave</h2>
      <label>
        Type
        <select value={form.type} onChange={set('type')}>
          {LEAVE_TYPES.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>
      </label>
      <label>
        From
        <input type="date" required min={todayISO()} value={form.startDate} onChange={set('startDate')} />
      </label>
      <label>
        To
        <input type="date" required min={form.startDate || todayISO()} value={form.endDate} onChange={set('endDate')} />
      </label>
      <label className="span-full">
        Reason <small>(optional)</small>
        <textarea rows={2} maxLength={500} value={form.reason} onChange={set('reason')} />
      </label>
      {error && <p className="form-error span-full" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}
