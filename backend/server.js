const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the CORS package

const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', // Allow only this origin (frontend)
        methods: ['GET', 'POST'], // Allow these methods
    },
});

// Middleware
app.use(express.json());  // Parse JSON bodies
app.use(cors());  // Enable CORS for all routes (or specify specific origins as needed)

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/messages', chatRoutes);  // Use your chat routes for handling messages
app.use('/api/users', userRoutes);     // Use your user routes for handling user data

// Socket.io for real-time communication
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinChat', ({ senderId, receiverId }) => {
        const room = `${senderId}_${receiverId}`;
        socket.join(room);
        console.log(`User joined chat room: ${room}`);
    });

    socket.on('sendMessage', (message) => {
        const room = message.room;
        console.log('Message received:', message);
        io.to(room).emit('receiveMessage', message);  // Emit to the room
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
