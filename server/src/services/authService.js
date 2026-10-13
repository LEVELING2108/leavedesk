import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/tokens.js';

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(refreshToken) });
  return { accessToken, refreshToken };
}

export async function register({ name, email, password }) {
  if (await User.exists({ email })) throw ApiError.conflict('Email is already registered');
  const user = await User.create({ name, email, password, role: 'employee' });
  return { user, ...(await issueTokens(user)) };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, so accounts can't be enumerated
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account is deactivated');
  return { user, ...(await issueTokens(user)) };
}

// Rotation: each refresh token works once. The swap is a single conditional update,
// so two concurrent refreshes with the same token can't both succeed.
export async function refresh(token) {
  if (!token) throw ApiError.unauthorized('Missing refresh token');
  const payload = verifyRefreshToken(token);

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or deactivated');

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const swapped = await User.findOneAndUpdate(
    { _id: user._id, refreshTokenHash: hashToken(token) },
    { refreshTokenHash: hashToken(refreshToken) },
  );

  if (!swapped) {
    // A validly signed token that isn't the current one has been used before:
    // treat it as stolen and end the session everywhere
    await User.updateOne({ _id: user._id }, { refreshTokenHash: null });
    throw ApiError.unauthorized('Refresh token reuse detected, please log in again');
  }

  return { user, accessToken, refreshToken };
}

export async function logout(token) {
  if (!token) return;
  try {
    const payload = verifyRefreshToken(token);
    await User.updateOne(
      { _id: payload.sub, refreshTokenHash: hashToken(token) },
      { refreshTokenHash: null },
    );
  } catch {
    // An invalid or expired token has nothing to revoke; logout still succeeds
  }
}
