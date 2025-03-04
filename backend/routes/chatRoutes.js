const express = require('express');
const { sendMessage, getChatHistory } = require('../controllers/chatController');
const router = express.Router();

// Route to get chat history between two users
router.get('/:senderId/:receiverId', getChatHistory);

// Route to send a new message
router.post('/', sendMessage);

module.exports = router;
