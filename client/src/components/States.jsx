export function Loading({ label = 'Loading…' }) {
  return <p className="state" role="status">{label}</p>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && <button type="button" className="btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ children }) {
  return <p className="state state-empty">{children}</p>;
}
