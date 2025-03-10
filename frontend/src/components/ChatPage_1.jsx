import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ChatPage_1.css';

// Create socket connection with auto-reconnect
const socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionAttempts: Infinity
});

const ChatPage_1 = () => {
    const { user1Id, user2Id } = useParams();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // Connect socket event
        socket.on('connect', () => {
            console.log('Socket connected');
            setConnected(true);
            
            // Join room after connection
            const room = [user1Id, user2Id].sort().join('_');
            socket.emit('joinRoom', room);
        });

        // Fetch initial messages
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/messages/${user1Id}/${user2Id}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Error fetching messages:', err);
            }
        };
        fetchMessages();

        // Message listener
        const handleNewMessage = (newMsg) => {
            console.log('New message received:', newMsg);
            setMessages(prev => {
                // Check if message already exists
                const exists = prev.some(m => m._id === newMsg._id);
                if (!exists) {
                    return [...prev, newMsg];
                }
                return prev;
            });
        };

        // Set up message listener
        socket.on('messageReceived', handleNewMessage);

        // Cleanup
        return () => {
            socket.off('connect');
            socket.off('messageReceived');
        };
    }, [user1Id, user2Id]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!message.trim() || !connected) return;

        try {
            // Send to backend
            const res = await axios.post('http://localhost:5000/api/messages', {
                sender: user1Id,
                receiver: user2Id,
                content: message.trim()
            });

            // Emit through socket
            const room = [user1Id, user2Id].sort().join('_');
            socket.emit('sendMessage', { ...res.data, room });

            // Update local state immediately
            setMessages(prev => [...prev, res.data]);
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div className="chat-container">
            <h2>Chat with {user2Id}</h2>
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div
                        key={msg._id || index}
                        className={msg.sender === user1Id ? 'message-sent' : 'message-received'}
                    >
                        <p>{msg.content}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage} className="chat-input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatPage_1;
