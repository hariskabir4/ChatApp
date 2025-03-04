const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: String, // Change from mongoose.Schema.Types.ObjectId to String
        required: true,
    },
    receiver: {
        type: String, // Change from mongoose.Schema.Types.ObjectId to String
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Chat', chatSchema);
