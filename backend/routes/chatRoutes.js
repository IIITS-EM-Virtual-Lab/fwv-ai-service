const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const CHATBOT_API_URL =
  process.env.CHATBOT_API_URL || 'https://fwvlab-fwv-ai-service.hf.space';

router.post('/ask', auth, async (req, res) => {
  try {
    const { query, session_id } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    const response = await fetch(`${CHATBOT_API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        session_id: session_id || `user-${req.user._id}`,
        user_id: req.user._id,
        user_email: req.user.email,
        user_name: req.user.name,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || 'Chatbot service error',
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Chat proxy error:', error);
    return res.status(502).json({
      success: false,
      message: 'Unable to reach chatbot service',
    });
  }
});

module.exports = router;
