import http from 'node:http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

const app = createApp();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: env.clientUrl, credentials: true },
});
// TODO: authenticate sockets with the JWT and join a per-user room (src/sockets/)

async function start() {
  await connectDB(env.mongoUri);
  server.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
