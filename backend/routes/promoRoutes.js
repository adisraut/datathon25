import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Example condition: Show a message if a special product exists in the database
router.get('/promo-message', asyncHandler(async (req, res) => {
  const showMessage = true; // Replace with real condition from your DB
  const message = showMessage ? "🔥 Limited Time Offer! 20% off on selected items!" : null;

  res.json({ showMessage, message });
}));

export default router;
