import express from 'express';
import { processUserData } from '../controllers/mlController.js';

const router = express.Router();
router.post('/process', processUserData);

export default router;
