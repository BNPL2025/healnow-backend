import { Router } from 'express';
import { signup, login, logout } from '../controllers/auth.controller.js';

const router = Router();

/**
 * User signup route
 * @route POST /signup
 * @desc Register a new user (patient or doctor)
 * @access Public
 */
router.post('/signup', signup);

/**
 * User login route
 * @route POST /login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', login);

/**
 * User logout route
 * @route POST /logout
 * @desc Logout user and clear token
 * @access Public
 */
router.post('/logout', logout);

export default router;