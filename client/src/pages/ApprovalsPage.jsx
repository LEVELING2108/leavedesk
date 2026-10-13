import { useCallback, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useLeaveEvents } from '../hooks/useLeaveEvents';
import { LeaveFilters } from '../components/LeaveFilters';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { capitalize, formatDate } from '../utils/format';
import { cleanParams } from '../utils/params';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState({ page: 1, status: 'pending', type: '' });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchApprovals = useCallback(
    () => api.get('/leaves/approvals', { params: cleanParams(query) }).then((r) => r.data.data),
    [query],
  );
  const { data, loading, error, reload } = useApi(fetchApprovals);
  useLeaveEvents(reload);

  async function review(leave, status) {
    const comment = window.prompt(`${status === 'approved' ? 'Approve' : 'Reject'} ${leave.employee.name}'s leave. Comment (optional):`, '');
    if (comment === null) return; // dialog dismissed
    setBusyId(leave._id);
    setActionError('');
    try {
      await api.patch(`/leaves/${leave._id}/review`, { status, comment });
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <h1>{user.role === 'admin' ? 'All leave requests' : 'Team approvals'}</h1>
      <section className="card">
        <div className="section-head">
          <h2>Requests</h2>
          <LeaveFilters status={query.status} type={query.type} onChange={(f) => setQuery((q) => ({ ...q, ...f, page: 1 }))} />
        </div>
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
        {loading && !data && <Loading />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && !error && (data.items.length === 0 ? (
          <EmptyState>{query.status === 'pending' ? 'Nothing waiting for your review.' : 'No requests match these filters.'}</EmptyState>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {data.items.map((l) => {
                  const isOwn = l.employee._id === user._id;
                  return (
                    <tr key={l._id}>
                      <td>{l.employee.name}<br /><small>{l.employee.email}</small></td>
                      <td>{capitalize(l.type)}</td>
                      <td>{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                      <td>{l.days}</td>
                      <td>{l.reason || '—'}</td>
                      <td>
                        <StatusBadge status={l.status} />
                        {l.reviewComment && <><br /><small>{l.reviewComment}</small></>}
                      </td>
                      <td>
                        {l.status === 'pending' && !isOwn && (
                          <div className="actions">
                            <button type="button" className="btn btn-primary" disabled={busyId === l._id} onClick={() => review(l, 'approved')}>Approve</button>
                            <button type="button" className="btn btn-danger" disabled={busyId === l._id} onClick={() => review(l, 'rejected')}>Reject</button>
                          </div>
                        )}
                        {l.status === 'pending' && isOwn && <small>Your own request</small>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(page) => setQuery((q) => ({ ...q, page }))} />
          </>
        ))}
      </section>
    </>
  );
}
