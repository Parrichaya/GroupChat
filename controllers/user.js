const User = require("../models/user");

const bcrypt = require('bcrypt');

// Add a new user in the database after Signup
exports.addUser = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    // const phone = req.body.phone;
    const password = req.body.password;
    
    bcrypt.hash(password, 10, (err, hash) => {
        if(err) {
            return res.status(500).json({
                error: err
            });
        }
        
        User.create({
            username: username,
            email: email,
            // phone: phone,
            password: hash
        })
        .then((newUser) => {
            console.log('User added!');
            res.status(201).json({message: "Successfully Signed Up!"});
        })
        .catch((err) => {
            if(err.name === "SequelizeUniqueConstraintError") {
                res.status(409).json({message: "User already exists!"});
            } else {
                console.log(err);
                res.status(500).json({error: err});
            }
        })
    })
}

// Login user with email and password
const jwt = require('jsonwebtoken');

function createToken(id,username) {
    return jwt.sign({userId: id, username: username}, process.env.TOKEN_SECRET);
}

exports.loginUser = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({where: {email: email}})
    .then((user) => {
        if(!user) {
            return res.status(404).json({
                message: "User not found!"
            });
        } 
        bcrypt.compare(password, user.password, (err, result) => {
            if(err) {
                return res.status(500).json({
                    message: "Authentication failed!"
                });
            }
            if(!result) {
                return res.status(401).json({
                    message: "Password is incorrect!"
                });
            } else {
                return res.status(200).json({
                    message: "Login Successful!", token: createToken(user.id, user.username)
                })
            }
        })
    })
    .catch(err => console.log(err));
}