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

    // Fetch chat history on component mount
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

        // Add user to the socket server
        socket.emit('joinChat', { senderId: user1Id, receiverId: user2Id });

        // Listen for incoming messages in real-time
        socket.on('receiveMessage', (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        // Cleanup listener on unmount
        return () => {
            socket.off('receiveMessage');
        };
    }, [user1Id, user2Id]);

    // Send a message
    const sendMessage = async () => {
        if (message.trim() === '') return;

        const newMessage = { sender: user1Id, receiver: user2Id, content: message };

        try {
            // Send message to the backend
            const res = await axios.post('http://localhost:5000/api/messages', newMessage);

            // Emit message to the other user via socket
            socket.emit('sendMessage', { ...res.data, room: `${user1Id}_${user2Id}` });

            // Add the sent message to the UI
            setMessages((prevMessages) => [...prevMessages, res.data]);

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
