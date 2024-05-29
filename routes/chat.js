const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const chatController = require('../controllers/chat');

router.post('/add-chat', userAuth.authenticate, chatController.addChat);
router.get('/get-chats', userAuth.authenticate, chatController.getChats);

router.get('/get-users', userAuth.authenticate, chatController.getUsers);
router.post('/add-group', userAuth.authenticate, chatController.addGroup);
router.get('/get-groups', userAuth.authenticate, chatController.getGroups);

module.exports = router;