import './App.css';
import { useState } from 'react';
import AuthPage from './AuthPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('Communities');
  const [activeChannel, setActiveChannel] = useState('Tech Discussions');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'Alex Chen',
      time: '10:30 AM',
      text: 'Has anyone tried the new React 19 features yet?',
      avatar: 'AC',
      type: 'user'
    },
    {
      id: 2,
      author: 'Sarah Johnson',
      time: '10:32 AM',
      text: 'Yes! The new use() hook is incredible. Makes data fetching so much cleaner.',
      avatar: 'SJ',
      type: 'user'
    },
    {
      id: 3,
      author: 'Saarthi AI',
      time: '10:33 AM',
      text: 'React 19 introduces several powerful features including the use() hook for data fetching, Server Components improvements, and automatic batching optimizations. Would you like specific implementation examples?',
      avatar: 'SA',
      badge: 'AI Assistant',
      type: 'assistant'
    },
    {
      id: 4,
      author: 'Mike Thompson',
      time: '10:35 AM',
      text: 'The Server Components integration is a game changer for performance!',
      avatar: 'MT',
      type: 'user'
    },
    {
      id: 5,
      author: 'Emma Davis',
      time: '10:38 AM',
      text: 'I\'m particularly excited about the improvements to Suspense boundaries.',
      avatar: 'ED',
      type: 'user'
    }
  ]);
  const [privateMessages, setPrivateMessages] = useState({
    'Alex Chen': [
      { id: 1, sender: 'You', text: 'Hey Alex!', time: '9:15 AM' },
      { id: 2, sender: 'Alex Chen', text: 'Hi! How are you?', time: '9:16 AM' },
      { id: 3, sender: 'You', text: 'Doing great! What about you?', time: '9:17 AM' }
    ],
    'Sarah Johnson': [
      { id: 1, sender: 'You', text: 'Hey Sarah', time: '8:45 AM' },
      { id: 2, sender: 'Sarah Johnson', text: 'Hi there!', time: '8:46 AM' }
    ],
    'Mike Thompson': [],
    'Emma Davis': []
  });
  const [input, setInput] = useState('');

  const communities = [
    { name: 'Tech Discussions', icon: '💻', unread: 3 },
    { name: 'Design Club', icon: '🎨', unread: 0 },
    { name: 'Startup Hub', icon: '🚀', unread: 1 },
    { name: 'AI Research', icon: '🤖', unread: 0 },
    { name: 'Web3 Space', icon: '👥', unread: 0 }
  ];

  const users = ['Alex Chen', 'Sarah Johnson', 'Mike Thompson', 'Emma Davis'];

  const handleSendMessage = () => {
    if (input.trim()) {
      if (activeTab === 'Communities') {
        const newMessage = {
          id: messages.length + 1,
          author: 'You',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: input,
          avatar: 'U',
          type: 'user'
        };
        setMessages([...messages, newMessage]);
      } else if (activeTab === 'Messages' && selectedUser) {
        const newMessage = {
          id: (privateMessages[selectedUser]?.length || 0) + 1,
          sender: 'You',
          text: input,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setPrivateMessages({
          ...privateMessages,
          [selectedUser]: [...(privateMessages[selectedUser] || []), newMessage]
        });
      }
      setInput('');
    }
  };

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('Communities');
    setSelectedUser(null);
  };

  // Show AuthPage if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthenticate={handleAuthenticate} />;
  }

  return (
    <div className="App">
      {/* Left Sidebar */}
      <aside className="sidebar-left">
        <div className="logo">
          <div className="logo-icon">💬</div>
          <span>SAMVAAD</span>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'Communities' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Communities');
              setSelectedUser(null);
            }}
          >
            # Communities
          </button>
          <button
            className={`tab ${activeTab === 'Messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('Messages')}
          >
            💬 Messages
          </button>
        </div>

        {activeTab === 'Communities' ? (
          <>
            <button className="create-btn">+ Create Community</button>

            <div className="communities-list">
              {communities.map((community) => (
                <div
                  key={community.name}
                  className={`community-item ${activeChannel === community.name ? 'active' : ''}`}
                  onClick={() => setActiveChannel(community.name)}
                >
                  <span className="icon">{community.icon}</span>
                  <span className="name">{community.name}</span>
                  {community.unread > 0 && (
                    <span className="badge">{community.unread}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="search-box">
              <input type="text" placeholder="Search users..." />
            </div>

            <div className="users-list">
              {users.map((user) => (
                <div
                  key={user}
                  className={`user-item ${selectedUser === user ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-avatar">{user.charAt(0)}{user.split(' ')[1].charAt(0)}</div>
                  <div className="user-info">
                    <div className="user-name">{user}</div>
                    <div className="user-preview">
                      {privateMessages[user]?.[privateMessages[user].length - 1]?.text || 'No messages yet'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sidebar-footer">
          <button className="sign-out" onClick={handleLogout}>↪ Sign Out</button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        {activeTab === 'Communities' ? (
          <>
            {/* Header */}
            <header className="chat-header">
              <div className="channel-info">
                <span className="channel-icon">#</span>
                <h2>{activeChannel}</h2>
              </div>
              <div className="member-count">👥 247 members</div>
            </header>

            {/* Messages Area */}
            <div className="messages-container">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-item ${msg.type}`}>
                  <div className="avatar" style={{ backgroundColor: msg.type === 'assistant' ? '#4CAF50' : '#E0E7FF' }}>
                    {msg.avatar}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="author">{msg.author}</span>
                      {msg.badge && <span className="ai-badge">{msg.badge}</span>}
                      <span className="time">{msg.time}</span>
                    </div>
                    <div className={`message-text ${msg.type === 'assistant' ? 'assistant-text' : ''}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </div>
              <button className="send-btn" onClick={handleSendMessage}>
                ✈️ Send
              </button>
            </div>
          </>
        ) : selectedUser ? (
          <>
            {/* Private Chat Header */}
            <header className="chat-header private-header">
              <div className="channel-info">
                <div className="user-avatar-large">{selectedUser.charAt(0)}{selectedUser.split(' ')[1].charAt(0)}</div>
                <h2>{selectedUser}</h2>
              </div>
            </header>

            {/* Private Messages Area */}
            <div className="messages-container private-messages">
              {privateMessages[selectedUser]?.map((msg) => (
                <div key={msg.id} className={`private-message ${msg.sender === 'You' ? 'sent' : 'received'}`}>
                  <div className="private-message-bubble">
                    {msg.text}
                  </div>
                  <span className="private-time">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </div>
              <button className="send-btn" onClick={handleSendMessage}>
                ✈️ Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <div className="no-selection-content">
              <div className="no-selection-icon">💬</div>
              <h2>Select a user to start messaging</h2>
              <p>Choose a user from the list to begin your private conversation</p>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      <aside className="sidebar-right">
        {/* Saarthi AI Widget */}
        <div className="ai-widget">
          <div className="ai-header">
            <span className="ai-icon">🌱</span>
            <span className="ai-title">Saarthi AI</span>
            <span className="ai-subtitle">Your intelligent assistant</span>
          </div>
        </div>

        {/* Quick Help */}
        <div className="quick-help">
          <div className="section-title">✨ Quick Help</div>
          <p className="help-text">
            I can help you with community-specific questions, provide insights, and moderate discussions.
          </p>
          <div className="help-actions">
            <button className="help-action">Summarize recent discussions</button>
            <button className="help-action">Community guidelines</button>
            <button className="help-action">Suggest related topics</button>
          </div>
        </div>

        {/* Community Stats */}
        <div className="community-stats">
          <div className="section-title">Community Stats</div>
          <div className="stat-row">
            <span>Messages today:</span>
            <strong>142</strong>
          </div>
          <div className="stat-row">
            <span>Active members:</span>
            <strong>89</strong>
          </div>
          <div className="stat-row">
            <span>AI responses:</span>
            <strong>23</strong>
          </div>
        </div>

        {/* AI Chat Input */}
        <div className="ai-chat-input">
          <input
            type="text"
            placeholder="Ask Saarthi AI anything..."
            className="ai-input"
          />
          <button className="ai-send-btn">Send</button>
        </div>
      </aside>
    </div>
  );
}

export default App;
