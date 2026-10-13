import ms from '../utils/duration.js';
import { env, isProd } from '../config/env.js';
import * as authService from '../services/authService.js';

export const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/api/auth', // only sent to auth endpoints, never to the rest of the API
};

function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: ms(env.jwt.refreshExpires) });
  res.status(status).json({ success: true, data: { user, accessToken } });
}

export async function register(req, res) {
  sendSession(res, 201, await authService.register(req.body));
}

export async function login(req, res) {
  sendSession(res, 200, await authService.login(req.body));
}

export async function refresh(req, res) {
  try {
    sendSession(res, 200, await authService.refresh(req.cookies[REFRESH_COOKIE]));
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    throw err;
  }
}

export async function logout(req, res) {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.json({ success: true, message: 'Logged out' });
}

export function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}
