const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const multer = require('multer');
const upload = multer();

const chatController = require('../controllers/chat');

router.post('/add-chat', userAuth.authenticate, chatController.addChat);
router.post('/upload-file', userAuth.authenticate, upload.single('file'), chatController.uploadFile);

router.get('/get-chats', userAuth.authenticate, chatController.getChats);

module.exports = router;