const User = require("../models/user");
const Chat = require("../models/chat");
const Group = require("../models/group");
const GroupMember = require("../models/group-member");

const { Op } = require("sequelize");

exports.addChat = async (req, res, next) => {
    try {
        const message = req.body.message;
        const groupId = req.body.groupId;
        const chatMessage = await req.user.createChat({
            username: req.user.username,
            message: message,
            groupId: groupId
        })
        console.log('Message sent and stored!');
        res.status(201).json({ message: "Message sent and stored!", chatMessage: chatMessage });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "An error occurred", error: err });
    }
}

exports.getChats = async (req, res, next) => {
    try {
        const lastId = req.query.lastId || 0;
        const groupId = req.query.groupId || 0;
        const chats = await Chat.findAll({ 
            where: { 
                groupId: groupId, 
                id: { [Op.gt]: lastId }
            },
            include: {
                model: User,
                attributes: ['username']
        }
     });
        res.status(200).json({ chats: chats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred", error: err });
    }
}

exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username']
        });
        res.status(200).json({ users: users });
    } catch (err) {
        res.status(500).json({ message: "An error occurred", error: err });
    }
}

exports.addGroup = async (req, res, next) => {
    try {
        const name = req.body.name;
        let userIds = req.body.userIds;
        const adminId = req.user.id;

        const group = await req.user.createGroup({
            name: name,
            adminId: adminId
        })

        const groupMembers = userIds.map(userId => {
            return {
                groupId: group.id,
                userId: userId,
                isAdmin: false
            };
        });

        // Ensure the admin is not added twice
        if (!userIds.includes(adminId.toString())) {
            groupMembers.push({ groupId: group.id, userId: adminId, isAdmin: true });
        }
        console.log(groupMembers);
    
        // Insert group members
        await GroupMember.bulkCreate(groupMembers, { ignoreDuplicates: true, updateOnDuplicate: ['isAdmin'] });

        res.status(201).json({ group: group });
    } catch (err) {
        res.status(500).json({ message: "An error occurred", error: err });
    }
}

exports.getGroups = async (req, res, next) => {
    try {
        const groups = await Group.findAll({
            include: [{
                model: User,
                where: { id: req.user.id },
                through: { attributes: [] }
            }]
        })
        res.status(200).json({ groups: groups });
    } catch (err) {
        res.status(500).json({ message: "An error occurred", error: err });
    }
}