const express = require('express');
const { registerUser, getUserChats } = require('../controllers/userController');
const router = express.Router();

// Route for user registration
router.post('/register', registerUser);

// Route for getting user's chat history
router.get('/:userId/chats', getUserChats);

module.exports = router;
