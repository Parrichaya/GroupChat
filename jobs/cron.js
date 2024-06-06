const Chat = require("../models/chat");
const ArchivedChat = require('../models/archive');
const { CronJob } = require('cron');

const { Op } = require("sequelize");
const sequelize = require("../util/database");

// // Function to archive old messages
const archiveChats = async () => {
    try {
        const previousDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const chatsToArchive = await Chat.findAll({
            where: {
                createdAt: {
                    [Op.lt]: previousDay
                }
            }
        });

        await sequelize.transaction(async (t) => {
            const archivedChats = chatsToArchive.map(chat => {
                return {
                    username: chat.username,
                    message: chat.message,
                    groupId: chat.groupId
                }
            })
            await ArchivedChat.bulkCreate(archivedChats, { transaction: t });
            await Chat.destroy({
                where: {
                    createdAt: {
                        [Op.lt]: previousDay
                    }
                },
                transaction: t
            });
        })
        console.log("Chats archived successfully");
    } catch (err) {
        console.log("An error occurred:", err);
    }
}

// Create a new cron job to run every day at midnight
const job = new CronJob('0 0 * * *', () => {
    console.log('Running cron job to archive old messages');
    archiveChats();
});

module.exports = job