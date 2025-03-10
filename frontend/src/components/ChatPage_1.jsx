import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ChatPage_1.css';

const socket = io('http://localhost:5000'); // Connect to backend WebSocket server

const ChatPage_1 = () => {
    const { user1Id, user2Id } = useParams();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/messages/${user1Id}/${user2Id}`);
                setMessages(res.data);
            } catch (err) {
                console.error('Error fetching chat history:', err);
            }
        };

        fetchMessages();

        // Create a room that works for both sender and receiver
        const room = [user1Id, user2Id].sort().join('_');
        socket.emit('joinChat', { senderId: user1Id, receiverId: user2Id });

        // Listen for incoming messages in real-time
        socket.on('receiveMessage', (newMessage) => {
            setMessages((prevMessages) => {
                // Check if message already exists to prevent duplicates
                const messageExists = prevMessages.some(
                    msg => msg._id === newMessage._id
                );
                if (messageExists) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });
        });

        // Cleanup listener on unmount
        return () => {
            socket.off('receiveMessage');
        };
    }, [user1Id, user2Id]);

    const sendMessage = async () => {
        if (message.trim() === '') return;

        const newMessage = { sender: user1Id, receiver: user2Id, content: message };

        try {
            // Send message to the backend
            const res = await axios.post('http://localhost:5000/api/messages', newMessage);
            
            // Create a consistent room name for both users
            const room = [user1Id, user2Id].sort().join('_');
            
            // Emit message to all users in the room via socket
            socket.emit('sendMessage', { ...res.data, room });

            // Clear the input field
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div>
            <h2>Chat with {user2Id}</h2>
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={msg.sender === user1Id ? 'message-sent' : 'message-received'}
                    >
                        <p>{msg.content}</p>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatPage_1;
