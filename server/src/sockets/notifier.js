// Services call this instead of importing socket.io, so they stay testable without a server.
// Until setIo() runs (e.g. under Jest), notifications are silently dropped.
let io = null;

export function setIo(instance) {
  io = instance;
}

export const userRoom = (userId) => `user:${userId}`;

export function notifyUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(userRoom(userId.toString())).emit(event, payload);
}
