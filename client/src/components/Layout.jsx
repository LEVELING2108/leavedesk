import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <header className="navbar">
        <span className="brand">LeaveDesk</span>
        <nav>
          <NavLink to="/" end>My leaves</NavLink>
          {['manager', 'admin'].includes(user.role) && <NavLink to="/approvals">Approvals</NavLink>}
          {user.role === 'admin' && <NavLink to="/admin/users">Users</NavLink>}
        </nav>
        <div className="navbar-user">
          <span>{user.name} · <em>{user.role}</em></span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
