const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const userController = require('../controllers/user');

router.post('/signup', userController.addUser);
router.post('/login', userController.loginUser);

router.get('/get-users', userAuth.authenticate, userController.getUsers);

module.exports = router;