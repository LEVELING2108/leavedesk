import * as userService from '../services/userService.js';

export async function team(req, res) {
  res.json({ success: true, data: await userService.listTeam(req.user) });
}

export async function list(req, res) {
  res.json({ success: true, data: await userService.listUsers(req.query) });
}

export async function approvers(_req, res) {
  res.json({ success: true, data: await userService.listApprovers() });
}

export async function update(req, res) {
  res.json({ success: true, data: await userService.updateUser(req.user, req.params.id, req.body) });
}
