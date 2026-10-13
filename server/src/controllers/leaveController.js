import * as leaveService from '../services/leaveService.js';

export async function create(req, res) {
  const leave = await leaveService.createLeave(req.user, req.body);
  res.status(201).json({ success: true, data: leave });
}

export async function listMine(req, res) {
  res.json({ success: true, data: await leaveService.listMine(req.user, req.query) });
}

export async function listApprovals(req, res) {
  res.json({ success: true, data: await leaveService.listApprovals(req.user, req.query) });
}

export async function cancel(req, res) {
  res.json({ success: true, data: await leaveService.cancelLeave(req.user, req.params.id) });
}

export async function review(req, res) {
  res.json({ success: true, data: await leaveService.reviewLeave(req.user, req.params.id, req.body) });
}
