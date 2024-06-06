const express = require('express');

const router = express.Router();

const userAuth = require('../middleware/auth');

const groupController = require('../controllers/group');

router.post('/add-group', userAuth.authenticate, groupController.addGroup);
router.post('/add-users-to-group', userAuth.authenticate, groupController.addUsersToGroup);
router.post('/make-admin', userAuth.authenticate, groupController.makeUserAdmin);
router.post('/remove-users-from-group', userAuth.authenticate, groupController.removeUsersFromGroup);

router.get('/get-groups', userAuth.authenticate, groupController.getGroups);
router.get('/get-group-members', userAuth.authenticate, groupController.getUsersFromGroup);

module.exports = router