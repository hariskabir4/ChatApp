import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSmile, FaPaperclip } from 'react-icons/fa';
import './ChatPage_1.css';

const UserChatHistory = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [chatHistory, setChatHistory] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchChatHistory();
    }, [userId]);

    const fetchChatHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${userId}/chats`);
            setChatHistory(response.data);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const handleChatClick = (otherUserId) => {
        navigate(`/chat/${userId}/${otherUserId}`);
    };

    const filteredChats = chatHistory.filter(chat => 
        chat.otherUser.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="chat-box_chat">
            <div className="chat-container_chat">
                {/* Sidebar - Now showing full width since we don't need the chat area yet */}
                <div className="chat-sidebar_chat" style={{ width: '100%' }}>
                    <div className="user-info_chat">
                        <div className="user-avatar_chat">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="placeholder-icon_chat">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M12 14c-5 0-9 2-9 4.5V20h18v-1.5c0-2.5-4-4.5-9-4.5z" />
                            </svg>
                        </div>
                        <h3>{userId}</h3>
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
                        <button className="category_chat active_chat">All Chats</button>
                    </div>
                    <ul className="chat-list_chat">
                        {filteredChats.map((chat) => (
                            <li 
                                key={chat.otherUser} 
                                className="chat-item_chat"
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
                                <span className="chat-time_chat">{chat.lastMessageTime}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserChatHistory; 