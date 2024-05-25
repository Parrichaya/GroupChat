const User = require("../models/user");
const Chat = require("../models/chat");

exports.addChat = async (req, res, next) => {
    try {
        const message = req.body.message;
        const chatMessage = await req.user.createChat({
            username: req.user.username,
            message: message
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
        const chats = await Chat.findAll({ include: {
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