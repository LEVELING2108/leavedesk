import { useContext, useEffect } from 'react';
import { SocketContext } from '../context/socket-context';

// Calls `onEvent(event, leave)` for every real-time leave notification while mounted
export function useLeaveEvents(onEvent) {
  const { subscribe } = useContext(SocketContext);
  useEffect(() => subscribe(onEvent), [subscribe, onEvent]);
}
