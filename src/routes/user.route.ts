import { Router } from 'express';
import { signup } from '../controllers/user.controller.js';

const router = Router();

/**
 * User signup route
 * @route POST /signup
 * @desc Register a new user (patient or doctor)
 * @access Public
 */
router.post('/signup', signup);

export default router;