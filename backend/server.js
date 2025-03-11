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
    let userId;

    socket.on('userConnected', (id) => {
        userId = id;
        socket.broadcast.emit('userStatus', { userId, status: 'online' });
    });

    socket.on('disconnect', () => {
        if (userId) {
            socket.broadcast.emit('userStatus', { userId, status: 'offline' });
        }
    });

    socket.on('messageSeen', ({ messageId, userId }) => {
        socket.broadcast.emit('messageSeen', { messageId, userId });
    });

    socket.on('joinRoom', (room) => {
        if (room) {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);
        }
    });

    socket.on('sendMessage', (messageData) => {
        const { room, ...message } = messageData;
        console.log(`Sending message in room ${room}:`, message);

        // Broadcast to all clients in the room
        io.to(room).emit('messageReceived', message);
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
