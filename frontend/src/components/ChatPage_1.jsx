import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSmile, FaPaperclip } from 'react-icons/fa';
import './ChatPage_1.css';

// Create socket connection with auto-reconnect
const socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionAttempts: Infinity
});

const ChatPage_1 = () => {
    const { user1Id, user2Id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChatHistory = async () => {
        try {
            console.log('Fetching chat history for user:', user1Id);
            const response = await axios.get(`http://localhost:5000/api/users/${user1Id}/chats`);
            console.log('Received chat history:', response.data);
            setChatHistory(response.data);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

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
                console.log('Fetched messages:', res.data);
                // Sort messages by timestamp
                const sortedMessages = res.data.sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                setMessages(sortedMessages);
            } catch (err) {
                console.error('Error fetching messages:', err);
            }
        };
        fetchMessages();

        // Fetch initial chat history
        fetchChatHistory();

        // Message listener
        const handleNewMessage = async (newMsg) => {
            console.log('New message received:', newMsg);
            
            // Update messages in current chat
            setMessages(prev => {
                const exists = prev.some(m => m._id === newMsg._id);
                if (!exists) {
                    // Sort messages by timestamp when adding new message
                    const updatedMessages = [...prev, newMsg].sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp)
                    );
                    return updatedMessages;
                }
                return prev;
            });

            // Refresh chat history to show latest messages
            await fetchChatHistory();
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
            setMessages(prev => {
                // Sort messages by timestamp when adding new message
                const updatedMessages = [...prev, res.data].sort((a, b) => 
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                return updatedMessages;
            });
            setMessage('');

            // Refresh chat history to show latest message
            await fetchChatHistory();
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleEmojiClick = (emoji) => {
        setMessage(message + emoji);
        setEmojiPickerVisible(false);
    };

    const handleChatClick = (otherUserId) => {
        navigate(`/chat/${user1Id}/${otherUserId}`);
    };

    const filteredChats = chatHistory.filter(chat => 
        chat.otherUser.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <input 
                            type="text" 
                            placeholder="Search chats" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="chat-categories_chat">
                        <button className="category_chat active_chat">All</button>
                    </div>
                    <ul className="chat-list_chat">
                        {filteredChats.map((chat) => (
                            <li 
                                key={chat.otherUser}
                                className={`chat-item_chat ${chat.otherUser === user2Id ? 'active_chat' : ''}`}
                                onClick={() => handleChatClick(chat.otherUser)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="user-avatar_chat">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon_chat">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M12 14c-5 0-9 2-9 4.5V20h18v-1.5c0-2.5-4-4.5-9-4.5z" />
                                    </svg>
                                </div>
                                <div className="chat-details_chat">
                                    <h4>{chat.otherUser}</h4>
                                    <p>{chat.lastMessage}</p>
                                </div>
                                <span className="chat-time_chat">
                                    {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </li>
                        ))}
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
                        <div ref={messagesEndRef} />
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
