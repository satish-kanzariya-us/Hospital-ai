const express = require('express');
const router = express.Router();
const { callLLM } = require('../utils/llm');

/**
 * POST /chat
 * Body: { message, context: { city, specialty, hospitalId } }
 * Returns AI assistant response
 */
router.post('/', async (req, res) => {
  const { message, context = {} } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const reply = await callLLM(message, context);
    res.json({ reply, context });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: err.message || 'AI assistant unavailable. Please try again.' });
  }
});

module.exports = router;
