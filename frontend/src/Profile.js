import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Lock,
  Shield,
  User,
  Globe
} from 'lucide-react';
import './Profile.css';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="profile-toggle-row">
      <div>
        <div className="profile-toggle-title">{label}</div>
        <div className="profile-toggle-subtitle">{description}</div>
      </div>
      <button
        type="button"
        className={`profile-toggle ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className="profile-toggle-thumb" />
      </button>
    </div>
  );
}

function Profile({ onLogout, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSeenEnabled, setLastSeenEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('everyone');
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const toastTimerRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    presence: 'Online',
    avatarUrl: ''
  });
  const [formData, setFormData] = useState(profileData);

  const initials = useMemo(() => {
    if (profileData.name) {
      return profileData.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    }
    if (profileData.username) {
      return profileData.username.slice(0, 2).toUpperCase();
    }
    return '';
  }, [profileData.name, profileData.username]);

  const handleStartEdit = () => {
    setFormData(profileData);
    setSaveError('');
    setSaveMessage('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(profileData);
    setSaveError('');
    setSaveMessage('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaveError('');
      setSaveMessage('');
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('You are not logged in.');
        toastTimerRef.current = setTimeout(() => {
          setSaveError('');
        }, 5000);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setSaveError(data.message || 'Failed to save profile.');
        toastTimerRef.current = setTimeout(() => {
          setSaveError('');
        }, 5000);
        return;
      }

      const updated = data.user || {};
      const nextProfile = {
        name: updated.fullName || '',
        username: updated.username || '',
        email: updated.email || '',
        bio: updated.bio || '',
        presence: 'Online',
        avatarUrl: updated.avatarUrl || ''
      };

      setProfileData(nextProfile);
      setFormData(nextProfile);
      setIsEditing(false);
      setSaveMessage('Profile saved.');
      toastTimerRef.current = setTimeout(() => {
        setSaveMessage('');
      }, 5000);
      
      // Notify parent to refresh user data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      setSaveError('Failed to save profile.');
      toastTimerRef.current = setTimeout(() => {
        setSaveError('');
      }, 5000);
      // Keep UI state unchanged on failure.
    }
  };

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAvatarPick = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({
        ...prev,
        avatarUrl: previewUrl
      }));
      setSaveError('');
      setSaveMessage('');
      setIsEditing(true);
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const visibilityOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'friends', label: 'Friends' },
    { value: 'noone', label: 'No one' }
  ];

  useEffect(() => {
    if (!visibilityOpen) {
      return undefined;
    }

    const handleClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setVisibilityOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setVisibilityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visibilityOpen]);

  useEffect(() => {
    const loadProfile = async () => {
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
        const nextProfile = {
          name: user.fullName || '',
          username: user.username || '',
          email: user.email || '',
          bio: user.bio || '',
          presence: 'Online',
          avatarUrl: user.avatarUrl || ''
        };

        setProfileData(nextProfile);
        setFormData(nextProfile);
      } catch (error) {
        // Ignore load errors for now.
      }
    };

    loadProfile();
  }, [API_BASE_URL]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-backdrop" aria-hidden="true">
        <div className="profile-orb orb-one" />
        <div className="profile-orb orb-two" />
        <div className="profile-gridlines" />
      </div>
      <div className="profile-content">
        {(saveError || saveMessage) && (
          <div className={`profile-toast ${saveError ? 'is-error' : 'is-success'}`} role="status">
            <div className="profile-toast-dot" />
            <span>{saveError || saveMessage}</span>
          </div>
        )}
        <div className="profile-hero">
          <div>
            <h1>Profile Settings</h1>
            <p>Manage your account settings and preferences</p>
          </div>
          <button
            type="button"
            className="profile-logout-btn"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>

        <section className="profile-card">
        <div className="profile-card-left">
          <button
            type="button"
            className="profile-avatar"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload profile picture"
          >
            {isEditing && formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar-initials">{initials}</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-avatar-input"
              onChange={handleAvatarPick}
            />
          </button>
          <div>
            {profileData.name && (
              <div className="profile-name">{profileData.name}</div>
            )}
            {profileData.username && (
              <div className="profile-handle">@{profileData.username}</div>
            )}
            {profileData.bio && (
              <div className="profile-bio">{profileData.bio}</div>
            )}
            <div className="profile-presence">
              <span className="profile-presence-dot" />
              {profileData.presence}
            </div>
          </div>
        </div>
        <div className="profile-edit-actions">
          {isEditing && (
            <button
              className="profile-cancel-btn"
              type="button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
          <button
            className="profile-edit-btn"
            type="button"
            onClick={isEditing ? handleSave : handleStartEdit}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>
        </section>

        <div className="profile-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`profile-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
        </div>

        {activeTab === 'profile' && (
          <section className="profile-panel">
          <div className="panel-header">
            <h2>Profile Information</h2>
            <p>Update your personal information and status</p>
          </div>
          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                value={isEditing ? formData.name : profileData.name}
                onChange={handleFieldChange('name')}
                disabled={!isEditing}
              />
            </div>
            <div className="profile-field">
              <label>Username</label>
              <input
                type="text"
                value={isEditing ? formData.username : profileData.username}
                onChange={handleFieldChange('username')}
                disabled={!isEditing}
              />
            </div>
            <div className="profile-field">
              <label>Email Address</label>
              <input
                type="email"
                value={isEditing ? formData.email : profileData.email}
                onChange={handleFieldChange('email')}
                disabled={!isEditing}
              />
            </div>
            <div className="profile-field">
              <label>Bio</label>
              <textarea
                value={isEditing ? formData.bio : profileData.bio}
                onChange={handleFieldChange('bio')}
                disabled={!isEditing}
                rows={3}
              />
              <div className="field-counter">
                {(isEditing ? formData.bio : profileData.bio).length}/150 characters
              </div>
            </div>
          </div>
          </section>
        )}

        {activeTab === 'privacy' && (
          <section className="profile-panel">
          <div className="panel-header">
            <h2>Privacy & Security</h2>
            <p>Control who can see your information</p>
          </div>

          <div className="privacy-grid">
            <div>
              <div className="privacy-title">Profile Visibility</div>
              <div className="privacy-subtitle">Who can see your profile</div>
            </div>
            <div
              className={`profile-dropdown ${visibilityOpen ? 'is-open' : ''}`}
              ref={dropdownRef}
            >
              <button
                type="button"
                className="profile-dropdown-trigger"
                onClick={() => setVisibilityOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={visibilityOpen}
              >
                <Globe size={16} />
                <span>
                  {visibilityOptions.find((item) => item.value === profileVisibility)?.label}
                </span>
                <ChevronDown size={16} />
              </button>
              {visibilityOpen && (
                <div className="profile-dropdown-menu" role="listbox">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`profile-dropdown-item ${profileVisibility === option.value ? 'is-selected' : ''}`}
                      onClick={() => {
                        setProfileVisibility(option.value);
                        setVisibilityOpen(false);
                      }}
                      role="option"
                      aria-selected={profileVisibility === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          <ToggleRow
            label="Last Seen"
            description="Show when you were last active"
            checked={lastSeenEnabled}
            onChange={setLastSeenEnabled}
          />
          <ToggleRow
            label="Read Receipts"
            description="Let others know when you have read their messages"
            checked={readReceiptsEnabled}
            onChange={setReadReceiptsEnabled}
          />

          <div className="profile-action">
            <button type="button" className="outline-action">
              <Lock size={16} />
              Change Password
            </button>
          </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="profile-panel">
          <div className="panel-header">
            <h2>Notification Preferences</h2>
            <p>Manage how you receive notifications</p>
          </div>

          <ToggleRow
            label="Email Notifications"
            description="Receive notifications via email"
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <ToggleRow
            label="Push Notifications"
            description="Receive push notifications on your device"
            checked={pushNotifications}
            onChange={setPushNotifications}
          />
          <ToggleRow
            label="Message Preview"
            description="Show message content in notifications"
            checked={messagePreview}
            onChange={setMessagePreview}
          />

          <div className="divider" />

          <div className="profile-field full">
            <label>Notification Sound</label>
            <div className="select-pill select-outline">Default</div>
          </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Profile;
