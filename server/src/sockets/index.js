import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';
import { setIo, userRoom } from './notifier.js';

export function initSockets(io) {
  // Same access token as the REST API; a bad token rejects the handshake
  io.use(async (socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth?.token);
      const user = await User.findById(payload.sub);
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(userRoom(socket.data.userId));
  });

  setIo(io);
}
