import { Router } from 'express';
import { analyzeToothShade } from '../controllers/analysis.controller.js';

const router = Router();

/**
 * Tooth shade analysis route
 * @route POST /analyze
 * @desc Analyze tooth images and return shade recommendations
 * @access Public
 */
router.post('/analyze', analyzeToothShade);

export default router;