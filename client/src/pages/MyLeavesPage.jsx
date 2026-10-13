import { useCallback, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { LeaveForm } from '../components/LeaveForm';
import { LeaveFilters } from '../components/LeaveFilters';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { capitalize, formatDate } from '../utils/format';

export default function MyLeavesPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState({ page: 1, status: '', type: '' });
  const [actionError, setActionError] = useState('');

  const fetchLeaves = useCallback(
    () => api.get('/leaves/mine', { params: clean(query) }).then((r) => r.data.data),
    [query],
  );
  const { data, loading, error, reload } = useApi(fetchLeaves);

  async function cancel(id) {
    if (!window.confirm('Cancel this leave request?')) return;
    setActionError('');
    try {
      await api.patch(`/leaves/${id}/cancel`);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  const needsManager = user.role !== 'admin' && !user.manager;

  return (
    <>
      <h1>My leaves</h1>
      {needsManager ? (
        <p className="notice">You don’t have a manager assigned yet, so you can’t apply for leave. Ask an admin to assign one.</p>
      ) : (
        <LeaveForm onCreated={() => setQuery((q) => ({ ...q, page: 1 }))} />
      )}

      <section className="card">
        <div className="section-head">
          <h2>History</h2>
          <LeaveFilters status={query.status} type={query.type} onChange={(f) => setQuery((q) => ({ ...q, ...f, page: 1 }))} />
        </div>
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
        {loading && !data && <Loading />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && !error && (data.items.length === 0 ? (
          <EmptyState>No leave requests yet.</EmptyState>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Reviewer note</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l._id}>
                    <td>{capitalize(l.type)}</td>
                    <td>{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                    <td>{l.days}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>{l.reviewComment || (l.reviewedBy ? `by ${l.reviewedBy.name}` : '—')}</td>
                    <td>
                      {l.status === 'pending' && (
                        <button type="button" className="btn btn-ghost" onClick={() => cancel(l._id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(page) => setQuery((q) => ({ ...q, page }))} />
          </>
        ))}
      </section>
    </>
  );
}

// Drops empty filters so the API's enums don't reject ''
function clean(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
}
