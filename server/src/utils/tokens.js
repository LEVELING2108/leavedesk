import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpires,
  });
}

// jti makes every refresh token unique, so rotation always produces a new hash
export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires,
  });
}

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

// Refresh tokens are stored hashed so a database leak doesn't hand out live sessions
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
