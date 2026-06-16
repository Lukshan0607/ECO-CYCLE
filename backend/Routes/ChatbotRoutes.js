const express = require('express');
const router = express.Router();
const { chat, getChatHistory, getChatSessions, markResolved, deleteSession } = require('../Controllers/ChatbotController');

// Chat endpoint - main interaction point
router.post('/chat', chat);

// Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// Get all chat sessions (for admin/management)
router.get('/sessions', getChatSessions);

// Mark chat session as resolved
router.patch('/resolve/:sessionId', markResolved);

// Delete chat session
router.delete('/session/:sessionId', deleteSession);

module.exports = router;
