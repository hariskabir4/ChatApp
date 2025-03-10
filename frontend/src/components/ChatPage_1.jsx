import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { FaSmile, FaPaperclip } from 'react-icons/fa';
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
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

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

    const handleEmojiClick = (emoji) => {
        setMessage(message + emoji);
        setEmojiPickerVisible(false);
    };

    return (
        <div className="chat-box_chat">
            <div className="chat-container_chat">
                {/* Sidebar */}
                <div className="chat-sidebar_chat">
                    <div className="user-info_chat">
                        <div className="user-avatar_chat">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon_chat">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M12 14c-5 0-9 2-9 4.5V20h18v-1.5c0-2.5-4-4.5-9-4.5z" />
                            </svg>
                        </div>
                        <h3>{user1Id}</h3>
                        <span className="user-status_chat">Active Now</span>
                    </div>
                    <div className="search-bar_chat">
                        <input type="text" placeholder="Search" />
                    </div>
                    <div className="chat-categories_chat">
                        <button className="category_chat">All</button>
                    </div>
                    <ul className="chat-list_chat">
                        <li className="chat-item_chat">
                            <div className="user-avatar_chat">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon_chat">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M12 14c-5 0-9 2-9 4.5V20h18v-1.5c0-2.5-4-4.5-9-4.5z" />
                                </svg>
                            </div>
                            <div className="chat-details_chat">
                                <h4>{user2Id}</h4>
                                <p>{messages.length > 0 ? `${messages[messages.length - 1].sender === user1Id ? 'You' : user2Id}: ${messages[messages.length - 1].content}` : 'No messages yet'}</p>
                            </div>
                            <span className="chat-time_chat">Now</span>
                        </li>
                    </ul>
                </div>

                {/* Main Chat Area */}
                <div className="chat-main_chat">
                    <div className="chat-header_chat">
                        <div className="user-avatar_chat">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon_chat">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M12 14c-5 0-9 2-9 4.5V20h18v-1.5c0-2.5-4-4.5-9-4.5z" />
                            </svg>
                        </div>
                        <h3>{user2Id}</h3>
                        <span className="user-status_chat">Active Now</span>
                    </div>
                    <div className="chat-messages_chat">
                        {messages.map((msg, index) => (
                            <div
                                key={msg._id || index}
                                className={`message_chat ${msg.sender === user1Id ? 'sent_chat' : 'received_chat'}`}
                            >
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    <div className="chat-input_chat">
                        <div className="input-actions_chat">
                            <FaSmile className="emoji-icon_chat" onClick={() => setEmojiPickerVisible(!emojiPickerVisible)} />
                            <FaPaperclip className="attachment-icon_chat" />
                        </div>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button className="send-button_chat" onClick={sendMessage}>Send</button>
                    </div>
                    {emojiPickerVisible && (
                        <div className="emoji-picker_chat">
                            <span onClick={() => handleEmojiClick('😊')}>😊</span>
                            <span onClick={() => handleEmojiClick('😂')}>😂</span>
                            <span onClick={() => handleEmojiClick('😍')}>😍</span>
                            <span onClick={() => handleEmojiClick('🥺')}>🥺</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage_1;
