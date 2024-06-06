const io = require('socket.io')(4000, {
    cors: {
        origin: "http://13.236.146.218:5000",
        methods: ['GET', 'POST'],
        credentials: true
    }
});

module.exports = io