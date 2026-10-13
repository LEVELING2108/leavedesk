import { LeaveRequest, ACTIVE_STATUSES } from '../models/LeaveRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

const EMPLOYEE_FIELDS = 'name email role';

function listFilter({ status, type }) {
  return { ...(status && { status }), ...(type && { type }) };
}

export async function createLeave(user, { type, startDate, endDate, reason }) {
  // Admins have no approver; any admin can review their requests
  if (user.role !== 'admin' && !user.manager) {
    throw ApiError.badRequest('You have no manager assigned yet. Ask an admin to assign one.');
  }

  // Two ranges overlap when each starts on or before the other ends
  const overlapping = await LeaveRequest.exists({
    employee: user._id,
    status: { $in: ACTIVE_STATUSES },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
  if (overlapping) throw ApiError.conflict('You already have a pending or approved leave for these dates');

  const leave = await LeaveRequest.create({
    employee: user._id,
    approver: user.role === 'admin' ? null : user.manager,
    type,
    startDate,
    endDate,
    reason,
  });
  return leave.populate('employee', EMPLOYEE_FIELDS);
}

export function listMine(user, query) {
  return paginate(LeaveRequest, { employee: user._id, ...listFilter(query) }, {
    ...query,
    sort: { startDate: -1 },
    populate: { path: 'reviewedBy', select: 'name' },
  });
}

// Managers see requests routed to them; admins see everything
export function listApprovals(user, query) {
  const scope = user.role === 'admin' ? {} : { approver: user._id };
  return paginate(LeaveRequest, { ...scope, ...listFilter(query) }, {
    ...query,
    populate: [
      { path: 'employee', select: EMPLOYEE_FIELDS },
      { path: 'reviewedBy', select: 'name' },
    ],
  });
}

export async function cancelLeave(user, id) {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (!leave.employee.equals(user._id)) throw ApiError.forbidden('You can only cancel your own requests');
  if (leave.status !== 'pending') throw ApiError.conflict(`Cannot cancel a request that is ${leave.status}`);

  leave.status = 'cancelled';
  await leave.save();
  return leave;
}

export async function reviewLeave(user, id, { status, comment }) {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.employee.equals(user._id)) throw ApiError.forbidden('You cannot review your own request');
  if (user.role !== 'admin' && !leave.approver?.equals(user._id)) {
    throw ApiError.forbidden('This request is not assigned to you');
  }
  if (leave.status !== 'pending') throw ApiError.conflict(`Request is already ${leave.status}`);

  // Conditional on status so two reviewers acting at once can't both decide it
  const updated = await LeaveRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { status, reviewComment: comment, reviewedBy: user._id, reviewedAt: new Date() },
    { returnDocument: 'after' },
  ).populate([
    { path: 'employee', select: EMPLOYEE_FIELDS },
    { path: 'reviewedBy', select: 'name' },
  ]);
  if (!updated) throw ApiError.conflict('Request was already decided');
  return updated;
}
