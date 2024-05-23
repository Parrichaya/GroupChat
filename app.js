const express = require('express');
const app = express();

require('dotenv').config();

const sequelize = require('./util/database');

const path = require('path');
const fs = require('fs');

const bodyParser = require('body-parser');
app.use(bodyParser.json({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let cors = require('cors');
app.use(cors({
    origin: 'http://127.0.0.1:5000',
    options: ['GET', 'POST', 'DELETE'],
    credentials: true
}));

const userRoutes = require('./routes/user');
app.use('/user', userRoutes);

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, `public/${req.url}`));
})

const User = require('./models/user');

sequelize.sync({})
    .then(() => {
        console.log('Listening...');
        app.listen(process.env.PORT || 5000);
    })
    .catch(err => console.log(err))