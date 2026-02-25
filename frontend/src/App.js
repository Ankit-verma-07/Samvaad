import './App.css';
import { useEffect, useState } from 'react';
import AuthPage from './AuthPage';
import Profile from './Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem('token'))
  );
  const [activeTab, setActiveTab] = useState('Communities');
  const [activeChannel, setActiveChannel] = useState('Home');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState({ username: '' });
  const [joinedCommunities, setJoinedCommunities] = useState(['General']);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const userInitials = (() => {
    const seed = currentUser.name || currentUser.username || '';
    if (!seed) {
      return 'U';
    }

    const parts = seed.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  })();

  const communities = [
    { name: 'General', icon: '💬', unread: 0 },
    { name: 'Tech Talk', icon: '💻', unread: 3 },
    { name: 'Random', icon: '🎲', unread: 0 },
    { name: 'Gaming', icon: '🎮', unread: 1 },
    { name: 'Music', icon: '🎵', unread: 0 },
  ];

  // Filter communities based on search query
  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use searched users from API
  const filteredUsers = searchedUsers;

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

  const loadCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      const user = data.user || {};
      setCurrentUser({
        username: user.username || '',
        name: user.fullName || '',
        avatarUrl: user.avatarUrl || ''
      });
    } catch (error) {
      // Ignore load errors for now.
    }
  };

  const handleAuthenticate = () => {
    setIsAuthenticated(true);
    loadCurrentUser();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowProfile(false);
    setActiveTab('Communities');
    setSelectedUser(null);
    localStorage.removeItem('token');
    setCurrentUser({ username: '', avatarUrl: '' });
    setSearchedUsers([]);
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length === 0) {
      setSearchedUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();

      if (response.ok) {
        setSearchedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinCommunity = (communityName) => {
    if (!joinedCommunities.includes(communityName)) {
      setJoinedCommunities([...joinedCommunities, communityName]);
      setActiveChannel(communityName);
      setSearchQuery('');
    }
  };

  const handleSendRequest = (userName) => {
    if (!sentRequests.includes(userName)) {
      setSentRequests([...sentRequests, userName]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchedUsers([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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
              setShowProfile(false);
            }}
          >
            # Communities
          </button>
          <button
            className={`tab ${activeTab === 'Messages' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('Messages');
              setShowProfile(false);
            }}
          >
            💬 Messages
          </button>
        </div>

        {activeTab === 'Communities' ? (
          <>
            <button className="create-btn">+ Create Community</button>

            <div className="communities-list">
              {filteredCommunities.length > 0 ? (
                filteredCommunities.map((community) => (
                  <div
                    key={community.name}
                    className={`community-item ${activeChannel === community.name ? 'active' : ''}`}
                    onClick={() => {
                      setActiveChannel(community.name);
                      setSearchQuery('');
                    }}
                  >
                    <span className="icon">{community.icon}</span>
                    <span className="name">{community.name}</span>
                    {community.unread > 0 && (
                      <span className="badge">{community.unread}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No communities found</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="users-list">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const displayName = user.fullName || user.username || 'User';
                  const nameParts = displayName.split(' ').filter(Boolean);
                  const avatar = nameParts.length > 1 
                    ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}` 
                    : displayName.charAt(0);
                  return (
                  <div
                    key={user.id || user.username}
                    className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery('');
                    }}
                  >
                    <div className="user-avatar">{avatar}</div>
                    <div className="user-info">
                      <div className="user-name">{displayName}</div>
                      <div className="user-preview">
                        {privateMessages[user.id]?.[privateMessages[user.id].length - 1]?.text || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                );
                })
              ) : (
                <div className="no-results">
                  <p>No users found</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="sidebar-footer">
          <button
            className="sign-out"
            onClick={() => setShowProfile(true)}
          >
            <div className="user-summary">
              <div className="user-avatar">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt="Profile"
                    className="user-avatar-image"
                  />
                ) : (
                  <span className="user-avatar-initials">{userInitials}</span>
                )}
              </div>
              <div className="user-meta">
                <div className="user-name">
                  {currentUser.username || 'Your Username'}
                </div>
                <div className="user-status">
                  <span className="user-status-dot" />
                  Online
                </div>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        {showProfile ? (
          <Profile onLogout={handleLogout} onProfileUpdate={loadCurrentUser} />
        ) : activeTab === 'Communities' ? (
          <>
            {/* Header */}
            <header className="chat-header">
              <div className="channel-info">
                <span className="channel-icon">#</span>
                <h2 
                  className="channel-name-clickable"
                  onClick={() => {
                    setActiveChannel('Home');
                    setSearchQuery('');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {activeChannel}
                </h2>
              </div>
              <div className="header-search">
                <input
                  type="text"
                  placeholder="Search users or communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>
            </header>

            {/* Search Results Overlay */}
            {searchQuery.trim() && (
              <div className="search-results-overlay">
                <div className="search-results-content">
                  <div className="search-results-header">
                    <h3>Search Results for "{searchQuery}"</h3>
                    <button 
                      className="close-search"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Communities Results */}
                  {filteredCommunities.length > 0 && (
                    <div className="search-section">
                      <h4>Communities</h4>
                      <div className="search-items">
                        {filteredCommunities.map((community) => (
                          <div key={community.name} className="search-result-item">
                            <div className="search-item-info">
                              <span className="search-item-icon">{community.icon}</span>
                              <div>
                                <div className="search-item-name">{community.name}</div>
                                <div className="search-item-meta">
                                  {joinedCommunities.includes(community.name) ? 'Joined' : 'Public Community'}
                                </div>
                              </div>
                            </div>
                            {joinedCommunities.includes(community.name) ? (
                              <button 
                                className="search-action-btn joined-btn"
                                onClick={() => {
                                  setActiveChannel(community.name);
                                  setSearchQuery('');
                                }}
                              >
                                View
                              </button>
                            ) : (
                              <button 
                                className="search-action-btn"
                                onClick={() => handleJoinCommunity(community.name)}
                              >
                                Join
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Users Results */}
                  {filteredUsers.length > 0 && (
                    <div className="search-section">
                      <h4>Users</h4>
                      <div className="search-items">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="search-result-item">
                            <div className="search-item-info">
                              <div className="search-user-avatar">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt={user.username}
                                    className="search-avatar-image"
                                  />
                                ) : (
                                  <span>
                                    {user.fullName 
                                      ? user.fullName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                                      : user.username.slice(0, 2).toUpperCase()
                                    }
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="search-item-name">
                                  {user.fullName || user.username}
                                </div>
                                <div className="search-item-meta">@{user.username}</div>
                              </div>
                            </div>
                            {sentRequests.includes(user.id) ? (
                              <button className="search-action-btn sent-btn" disabled>
                                Request Sent
                              </button>
                            ) : (
                              <button 
                                className="search-action-btn"
                                onClick={() => handleSendRequest(user.id)}
                              >
                                Send Request
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!isSearching && filteredCommunities.length === 0 && filteredUsers.length === 0 && (
                    <div className="no-search-results">
                      <div className="no-results-icon">🔍</div>
                      <p>No results found for "{searchQuery}"</p>
                      <span>Try searching with different keywords</span>
                    </div>
                  )}

                  {/* Loading */}
                  {isSearching && (
                    <div className="search-loading">
                      <div className="loading-spinner"></div>
                      <p>Searching...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                {typeof selectedUser === 'object' ? (
                  <>
                    <div className="user-avatar-large">
                      {(() => {
                        const displayName = selectedUser.fullName || selectedUser.username || 'User';
                        const nameP = displayName.split(' ').filter(Boolean);
                        return nameP.length > 1 ? `${nameP[0].charAt(0)}${nameP[1].charAt(0)}` : displayName.charAt(0);
                      })()}
                    </div>
                    <h2>{selectedUser.fullName || selectedUser.username}</h2>
                  </>
                ) : (
                  <>
                    <div className="user-avatar-large">{selectedUser.charAt(0)}{selectedUser.split(' ')[1]?.charAt(0) || ''}</div>
                    <h2>{selectedUser}</h2>
                  </>
                )}
              </div>
            </header>

            {/* Private Messages Area */}
            <div className="messages-container private-messages">
              {privateMessages[selectedUser.id || selectedUser]?.map((msg) => (
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
