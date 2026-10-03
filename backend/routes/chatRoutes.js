/**
 * chatRoutes.js
 * Express routing for Mitra Assistant Chatbot
 * HarvestMitra AI - ISSUE-09
 */

const express = require('express');
const router = express.Router();
const { handleChatMessage, handleChatStatus } = require('../controllers/chatController');

/**
 * Route: POST /api/chat/message
 * Desc: Send a question to Mitra Assistant
 */
router.post('/message', handleChatMessage);

/**
 * Route: GET /api/chat/status
 * Desc: Check AI service configuration status safely
 */
router.get('/status', handleChatStatus);

module.exports = router;
