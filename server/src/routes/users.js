import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import { listUsersQuery, updateUserSchema } from '../validators/user.js';
import * as users from '../controllers/userController.js';

const router = Router();

router.use(authenticate);

router.get('/team', authorize('manager', 'admin'), users.team);
router.get('/approvers', authorize('admin'), users.approvers);
router.get('/', authorize('admin'), validate({ query: listUsersQuery }), users.list);
router.patch('/:id', authorize('admin'), validate({ params: idParams, body: updateUserSchema }), users.update);

export default router;
