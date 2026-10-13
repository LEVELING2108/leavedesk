import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function listTeam(manager) {
  return User.find({ manager: manager._id }).sort({ name: 1 });
}

export function listUsers({ role, search, ...page }) {
  const filter = { ...(role && { role }) };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  return paginate(User, filter, { ...page, sort: { name: 1 }, populate: { path: 'manager', select: 'name email' } });
}

// People who can be assigned as someone's manager
export function listApprovers() {
  return User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('name email role').sort({ name: 1 });
}

export async function updateUser(admin, id, { role, manager, isActive }) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  const isSelf = user._id.equals(admin._id);
  // Stops the last admin from locking everyone out
  if (isSelf && role && role !== 'admin') throw ApiError.badRequest('You cannot change your own role');
  if (isSelf && isActive === false) throw ApiError.badRequest('You cannot deactivate your own account');

  if (role && role !== user.role && user.role !== 'employee' && role === 'employee') {
    if (await User.exists({ manager: user._id })) {
      throw ApiError.conflict('Reassign this user’s team members before making them an employee');
    }
  }

  if (manager !== undefined) {
    if (manager !== null) {
      if (user._id.equals(manager)) throw ApiError.badRequest('A user cannot be their own manager');
      const target = await User.findById(manager);
      if (!target || !target.isActive || !['manager', 'admin'].includes(target.role)) {
        throw ApiError.badRequest('Manager must be an active manager or admin');
      }
    }
    user.manager = manager;
  }

  if (role) user.role = role;
  if (isActive !== undefined) {
    user.isActive = isActive;
    // Deactivation also kills the refresh session
    if (!isActive) user.refreshTokenHash = null;
  }

  await user.save();
  return user.populate('manager', 'name email');
}
