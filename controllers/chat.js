const User = require("../models/user");
const Chat = require("../models/chat");
// const Group = require("../models/group");
// const GroupMember = require("../models/group-member");
const S3Service = require('../services/S3services');

const { Op } = require("sequelize");

const io = require('../services/socket');

io.on('connection', (socket) => {
    console.log('A USER CONNECTED.........')

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId)
        console.log('User joined group ${groupId}');
    })
})

exports.addChat = async (req, res, next) => {
    try {
        const message = req.body.message;
        const groupId = req.body.groupId;
        const chatMessage = await req.user.createChat({
            username: req.user.username,
            message: message,
            groupId: groupId
        });

        io.emit('newMessage', { 
            message: message,
            username: req.user.username,
            id: chatMessage.id,
            groupId: groupId
        })
        console.log('Message sent and stored!');
        res.status(201).json({ message: "Message sent and stored!", chatMessage: chatMessage });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "An error occurred", error: err });
    }
}

exports.uploadFile = async (req, res, next) => {
    try {
        const groupId = req.body.groupId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const s3Url = await S3Service.uploadToS3(file.buffer, `chat-files/${Date.now()}_${file.originalname}`);

        console.log('File uploaded and message created!');
        res.status(201).json({ message: "File uploaded and message created!", fileUrl: s3Url });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "An error occurred", error: err });
    }
};

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

      