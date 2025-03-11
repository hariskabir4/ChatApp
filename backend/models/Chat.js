const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        index: true
    },
    receiver: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: { 
        type: String, 
        enum: ['sent', 'delivered', 'seen'], 
        default: 'sent' 
    },
    isRead: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Compound index for faster querying of conversations between two users
chatSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
chatSchema.index({ timestamp: -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
