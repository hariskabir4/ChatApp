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

    // Check if we're on the chats overview page
    const isChatsOverview = user2Id === 'chats' || !user2Id;

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
            
            // Join room after connection if not in overview
            if (!isChatsOverview) {
                const room = [user1Id, user2Id].sort().join('_');
                socket.emit('joinRoom', room);
            }
        });

        // Fetch initial messages only if not in overview
        const fetchMessages = async () => {
            if (!isChatsOverview) {
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
        if (otherUserId) {
            navigate(`/chat/${user1Id}/${otherUserId}`);
            // Reset message state when changing chats
            setMessage('');
            setEmojiPickerVisible(false);
        }
    };

    const filteredChats = chatHistory.filter(chat => 
        chat.otherUser.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatLastMessage = (chat) => {
        if (chat.lastMessageSender === user1Id) {
            return `You: ${chat.lastMessage}`;  // Show "You:" for messages from current user
        } else {
            return `${chat.otherUser}: ${chat.lastMessage}`;  // Show "UserID:" for messages from other users
        }
    };

    // Add these helper functions at the top of your component
    const formatMessageTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDateHeader = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const groupMessagesByDate = (messages) => {
        const groups = {};
        
        messages.forEach(message => {
            const date = new Date(message.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = {
                    timestamp: message.timestamp,
                    messages: []
                };
            }
            groups[date].messages.push(message);
        });

        return Object.values(groups);
    };

    // Update the messages section in your render method
    const renderMessages = () => (
        <div className="chat-messages_chat">
            {groupMessagesByDate(messages).map((group, groupIndex) => (
                <div key={groupIndex} className="message-group">
                    <div className="date-header">
                        <span>{formatDateHeader(group.timestamp)}</span>
                    </div>
                    {group.messages.map((msg, msgIndex) => (
                        <div
                            key={msg._id || msgIndex}
                            className={`message-wrapper ${msg.sender === user1Id ? 'sent-wrapper' : 'received-wrapper'}`}
                        >
                            <div className="message-time">
                                {formatMessageTime(msg.timestamp)}
                            </div>
                            <div className={`message_chat ${msg.sender === user1Id ? 'sent_chat' : 'received_chat'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
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
                                    <p>{chat.lastMessageSender === user1Id ? 
                                        `You: ${chat.lastMessage}` : 
                                        `${chat.otherUser}: ${chat.lastMessage}`}</p>
                                </div>
                                <span className="chat-time_chat">
                                    {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Chat Area */}
                {isChatsOverview ? (
                    <div className="chat-main_chat" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            maxWidth: '600px'
                        }}>
                            <h2 style={{ 
                                marginBottom: '20px',
                                color: '#333',
                                fontSize: '24px'
                            }}>Welcome to Your Chat Space!</h2>
                            {chatHistory.length > 0 ? (
                                <div>
                                    <p style={{
                                        color: '#666',
                                        lineHeight: '1.6',
                                        marginBottom: '15px'
                                    }}>
                                        Your recent conversations appear in the sidebar.
                                    </p>
                                    <p style={{
                                        color: '#666',
                                        lineHeight: '1.6'
                                    }}>
                                        Click on any conversation to continue chatting!
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{
                                        color: '#666',
                                        lineHeight: '1.6',
                                        marginBottom: '15px'
                                    }}>
                                        You haven't started any conversations yet.
                                    </p>
                                    <p style={{
                                        color: '#666',
                                        lineHeight: '1.6'
                                    }}>
                                        Start chatting with others to build your chat history!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
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
                        {renderMessages()}
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
                )}
            </div>
        </div>
    );
};

export default ChatPage_1;
