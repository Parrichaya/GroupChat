const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const chatController = require('../controllers/chat');

router.post('/add-chat', userAuth.authenticate, chatController.addChat);
router.get('/get-chats', userAuth.authenticate, chatController.getChats);

module.exports = router;