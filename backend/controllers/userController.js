const User = require('../models/User');

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