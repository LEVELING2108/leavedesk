import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { createLeaveSchema, reviewLeaveSchema, listLeavesQuery } from '../validators/leave.js';
import * as leaves from '../controllers/leaveController.js';

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createLeaveSchema }), leaves.create);
router.get('/mine', validate({ query: listLeavesQuery }), leaves.listMine);
router.get('/approvals', authorize('manager', 'admin'), validate({ query: listLeavesQuery }), leaves.listApprovals);
router.patch('/:id/cancel', validate({ params: idParams }), leaves.cancel);
router.patch(
  '/:id/review',
  authorize('manager', 'admin'),
  validate({ params: idParams, body: reviewLeaveSchema }),
  leaves.review,
);

export default router;
