const express = require('express');
const router = express.Router();
const { startConversation, getConversations, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.route('/conversations').post(protect, startConversation).get(protect, getConversations);
router.route('/messages/:conversationId').get(protect, getMessages);

module.exports = router;