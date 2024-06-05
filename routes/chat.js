const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const multer = require('multer');
const upload = multer();

const chatController = require('../controllers/chat');

router.post('/add-chat', userAuth.authenticate, chatController.addChat);
router.post('/upload-file', userAuth.authenticate, upload.single('file'), chatController.uploadFile);
router.get('/get-chats', userAuth.authenticate, chatController.getChats);

router.get('/get-users', userAuth.authenticate, chatController.getUsers);
router.post('/add-group', userAuth.authenticate, chatController.addGroup);
router.get('/get-groups', userAuth.authenticate, chatController.getGroups);
router.get('/get-group-members', userAuth.authenticate, chatController.getUsersFromGroup);
router.post('/add-users-to-group', userAuth.authenticate, chatController.addUsersToGroup);
router.post('/make-admin', userAuth.authenticate, chatController.makeUserAdmin);
router.post('/remove-users-from-group', userAuth.authenticate, chatController.removeUsersFromGroup);

module.exports = router;