import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ChatPage_1 from './components/ChatPage_1';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/chat/:user1Id/chats" element={<ChatPage_1 />} />
                <Route path="/chat/:user1Id/:user2Id" element={<ChatPage_1 />} />
            </Routes>
        </Router>
    );
}

export default App;
