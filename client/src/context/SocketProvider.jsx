import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken, refreshSession } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { capitalize } from '../utils/format';
import { SocketContext } from './socket-context';

const EVENTS = ['leave:created', 'leave:cancelled', 'leave:reviewed'];
const TOAST_MS = 5000;

function describe(event, leave) {
  const who = leave.employee?.name ?? 'Someone';
  switch (event) {
    case 'leave:created': return `${who} requested ${leave.type} leave (${leave.days} day${leave.days > 1 ? 's' : ''})`;
    case 'leave:cancelled': return `${who} cancelled a ${leave.type} leave request`;
    case 'leave:reviewed': return `Your ${leave.type} leave was ${leave.status}${leave.reviewComment ? `: “${leave.reviewComment}”` : ''}`;
    default: return capitalize(event);
  }
}

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id;
  const listeners = useRef(new Set());
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!userId) return undefined;

    // auth as a function: re-read on every (re)connect, so a refreshed token is picked up
    const socket = io({ auth: (cb) => cb({ token: getAccessToken() }) });

    socket.on('connect_error', (err) => {
      // Access token expired while connected: refresh once, then retry the handshake
      if (err.message === 'Unauthorized') refreshSession().then(() => socket.connect()).catch(() => {});
    });

    for (const event of EVENTS) {
      socket.on(event, (leave) => {
        const id = crypto.randomUUID();
        setToasts((t) => [...t, { id, text: describe(event, leave) }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS);
        listeners.current.forEach((fn) => fn(event, leave));
      });
    }

    return () => socket.disconnect();
  }, [userId]);

  // Pages subscribe to refetch their lists when something changes
  const subscribe = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);
  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <SocketContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
      </div>
    </SocketContext.Provider>
  );
}
