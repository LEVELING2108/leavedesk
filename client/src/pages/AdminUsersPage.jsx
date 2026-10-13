import { useCallback, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Pagination } from '../components/Pagination';
import { EmptyState, ErrorState, Loading } from '../components/States';
import { capitalize } from '../utils/format';
import { cleanParams } from '../utils/params';
import { ROLES } from '../utils/constants';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [query, setQuery] = useState({ page: 1, role: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  // Debounce typing so every keystroke doesn't hit the API
  useEffect(() => {
    const t = setTimeout(() => setQuery((q) => (q.search === searchInput ? q : { ...q, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = useCallback(
    () => api.get('/users', { params: cleanParams(query) }).then((r) => r.data.data),
    [query],
  );
  const fetchApprovers = useCallback(() => api.get('/users/approvers').then((r) => r.data.data), []);
  const users = useApi(fetchUsers);
  const approvers = useApi(fetchApprovers);

  async function update(user, changes) {
    setBusyId(user._id);
    setActionError('');
    try {
      await api.patch(`/users/${user._id}`, changes);
      users.reload();
      if ('role' in changes) approvers.reload(); // manager list depends on roles
    } catch (err) {
      setActionError(`${user.name}: ${getErrorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  const { data, loading, error, reload } = users;

  return (
    <>
      <h1>Users</h1>
      <section className="card">
        <div className="section-head">
          <h2>All users</h2>
          <div className="filters">
            <input type="search" placeholder="Search name or email" aria-label="Search users" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <select aria-label="Filter by role" value={query.role} onChange={(e) => setQuery((q) => ({ ...q, role: e.target.value, page: 1 }))}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{capitalize(r)}</option>)}
            </select>
          </div>
        </div>
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
        {loading && !data && <Loading />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && !error && (data.items.length === 0 ? (
          <EmptyState>No users match.</EmptyState>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Role</th><th>Manager</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.items.map((u) => {
                  const isMe = u._id === me._id;
                  const busy = busyId === u._id;
                  return (
                    <tr key={u._id}>
                      <td>{u.name}{isMe && ' (you)'}<br /><small>{u.email}</small></td>
                      <td>
                        <select aria-label={`Role for ${u.name}`} value={u.role} disabled={busy || isMe} onChange={(e) => update(u, { role: e.target.value })}>
                          {ROLES.map((r) => <option key={r} value={r}>{capitalize(r)}</option>)}
                        </select>
                      </td>
                      <td>
                        <select
                          aria-label={`Manager for ${u.name}`}
                          value={u.manager?._id ?? ''}
                          disabled={busy}
                          onChange={(e) => update(u, { manager: e.target.value || null })}
                        >
                          <option value="">— None —</option>
                          {(approvers.data ?? []).filter((a) => a._id !== u._id).map((a) => (
                            <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button type="button" className={`btn ${u.isActive ? 'btn-danger' : ''}`} disabled={busy || isMe} onClick={() => update(u, { isActive: !u.isActive })}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
