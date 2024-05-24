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