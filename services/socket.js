const io = require('socket.io')(4000, {
    cors: {
        origin: "http://localhost:5000",
        methods: ['GET', 'POST'],
        credentials: true
    }
});

module.exports = io