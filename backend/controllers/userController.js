const User = require('../models/User');
const Chat = require('../models/Chat');

exports.registerUser = async (req, res) => {
    const { name, email } = req.body;

    try {
        const user = new User({ name, email });
        await user.save();
        res.status(201).json({ message: 'User registered', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserChats = async (req, res) => {
    const { userId } = req.params;

    try {
        console.log('Fetching chats for user:', userId);
        
        // First, find all unique users this user has chatted with
        const uniqueChats = await Chat.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { receiver: userId }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$sender", userId] },
                            then: "$receiver",
                            else: "$sender"
                        }
                    },
                    lastMessage: { $first: "$content" },
                    lastMessageTime: { $first: "$timestamp" },
                    lastMessageSender: { $first: "$sender" },
                    messageCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    otherUser: "$_id",
                    lastMessage: 1,
                    lastMessageTime: 1,
                    lastMessageSender: 1,
                    messageCount: 1
                }
            },
            {
                $sort: { lastMessageTime: -1 }
            }
        ]);

        console.log('Found chat history:', uniqueChats);
        res.status(200).json(uniqueChats);
    } catch (error) {
        console.error('Error in getUserChats:', error);
        res.status(500).json({ error: 'Failed to fetch user chats' });
    }
};