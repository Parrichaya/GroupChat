const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = (req, res, next) => {
    try {
        const token = req.header('Authorization');
        console.log(token);
        const user = jwt.verify(token, process.env.TOKEN_SECRET);
        console.log(user.userId, user.username);
        User.findByPk(user.userId)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => {
            console.log(err);
        })
    } catch (error) {
        res.status(401).json({error: "Authentication failed"});
    }    
}

module.exports = {authenticate};