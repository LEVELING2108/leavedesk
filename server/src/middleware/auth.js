import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

// Verifies the Bearer access token and loads the user, so role changes and
// deactivation take effect immediately rather than when the token expires
export async function authenticate(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Missing access token');

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or deactivated');

  req.user = user;
  next();
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden('You do not have access to this resource');
    next();
  };
}
