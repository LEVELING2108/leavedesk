import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <h1>Page not found</h1>
        <p><Link to="/">Back to LeaveDesk</Link></p>
      </div>
    </main>
  );
}
