const Group = require("../models/group");
const GroupMember = require("../models/group-member");
const User = require("../models/user");

const { Op } = require("sequelize");

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

        io.emit('newGroup', { group: group });
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

exports.getUsersFromGroup = async (req, res, next) => {
    const groupId = req.query.groupId; 

    try {
        const groupMembers = await GroupMember.findAll({
            where: { groupId: groupId },
            include: [{
                model: User,
                attributes: ['id', 'username']
            }],
            attributes: ['isAdmin']
        });

        // Extract user data from groupMembers
        const users = groupMembers.map(member => {
            return {
                id: member.user.id,
                username: member.user.username,
                isAdmin: member.isAdmin
            };
        });
        
        res.status(200).json({ members: users });
    } catch (error) {
        console.error('Error occurred while fetching group members', error);
        res.status(500).json({ message: 'Failed to fetch group members' });
    }
};

exports.addUsersToGroup = async (req, res, next) => {
    const groupId = req.body.groupId;
    const userIds = req.body.userIds;

    try {
        // ensure if the user is an admin
        const isAdmin = await GroupMember.findOne({
            where: {
                groupId: groupId,
                userId: req.user.id,
                isAdmin: true
            }
        })

        if (!isAdmin) {
            return res.status(401).json({ message: 'Unauthorized! Only admins can modify the group' });
        }

        // If the user is an admin, proceed to add users to the group
        for (const userId of userIds) {
            await GroupMember.create({
                groupId: groupId,
                userId: userId,
                isAdmin: false
            });
        }

        res.status(201).json({ message: 'Users added to group!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add users to group' });
    }
}

exports.makeUserAdmin = async (req, res, next) => {
    const groupId = req.body.groupId;
    const userIds = req.body.userIds;

    try {
        // ensure if the user is an admin
        const isAdmin = await GroupMember.findOne({
            where: {
                groupId: groupId,
                userId: req.user.id,
                isAdmin: true
            }
        })

        if (!isAdmin) {
            return res.status(401).json({ message: 'Unauthorized! Only admins can modify the group' });
        }

        // Update the group members to be admins
        await GroupMember.update({ isAdmin: true }, {
            where: {
                groupId: groupId,
                userId: { [Op.in]: userIds }
            }
        });

        res.status(201).json({ message: 'Users made admin!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to make users admin' });
    }
}

exports.removeUsersFromGroup = async (req, res, next) => {
    const groupId = req.body.groupId;
    const userIds = req.body.userIds;

    try {
        // ensure if the user is an admin
        const isAdmin = await GroupMember.findOne({
            where: {
                groupId: groupId,
                userId: req.user.id,
                isAdmin: true
            }
        })

        if (!isAdmin) {
            return res.status(401).json({ message: 'Unauthorized! Only admins can modify the group' });
        }

        // Remove users from the group
        await GroupMember.destroy({
            where: {
                groupId: groupId,
                userId: { [Op.in]: userIds }
            }
        });

        res.status(201).json({ message: 'Users removed from group!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove users from group' });
    }
}