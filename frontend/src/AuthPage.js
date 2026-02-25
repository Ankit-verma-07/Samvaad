import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import './AuthPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Calculate password strength
const calculatePasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[@#$%^&*!]/.test(password)
  };

  Object.values(checks).forEach(check => {
    if (check) strength += 20;
  });

  return { strength: Math.min(strength, 100), checks };
};

export function AuthPage({ onAuthenticate }) {
  const [authView, setAuthView] = useState('login');
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: ''
  });
  const [registerFormData, setRegisterFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [registerEmailError, setRegisterEmailError] = useState('');
  const [loginEmailError, setLoginEmailError] = useState('');
  const [loginPasswordError, setLoginPasswordError] = useState('');
  const [rememberMeError, setRememberMeError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthChecks, setStrengthChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    special: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (authView === 'login') {
      setLoginFormData({
        ...loginFormData,
        [name]: value
      });
      
      if (name === 'password') {
        setLoginPasswordError('');
        const { strength, checks } = calculatePasswordStrength(value);
        setPasswordStrength(strength);
        setStrengthChecks(checks);
      }
      
      if (name === 'email') {
        setLoginEmailError('');
      }
    } else {
      setRegisterFormData({
        ...registerFormData,
        [name]: value
      });
      
      if (name === 'password') {
        setPasswordError('');
        const { strength, checks } = calculatePasswordStrength(value);
        setPasswordStrength(strength);
        setStrengthChecks(checks);
      }

      if (name === 'confirmPassword') {
        setConfirmPasswordError('');
      }

      if (name === 'username') {
        setUsernameError('');
      }

      if (name === 'email') {
        setRegisterEmailError('');
      }
    }
  };

  const resetMessages = () => {
    setAuthError('');
    setAuthMessage('');
    setTermsError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setUsernameError('');
    setRegisterEmailError('');
    setLoginEmailError('');
    setLoginPasswordError('');
    setRememberMeError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    let hasError = false;
    if (!loginFormData.email) {
      setLoginEmailError('Email is required.');
      hasError = true;
    }
    if (!loginFormData.password) {
      setLoginPasswordError('Password is required.');
      hasError = true;
    }
    if (!rememberMe) {
      setRememberMeError('Please check Remember me to continue.');
      hasError = true;
    }
    if (hasError) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginFormData.email,
          password: loginFormData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Login failed');
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      onAuthenticate();
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!registerFormData.username) {
      setUsernameError('Username is required.');
      return;
    }

    if (!registerFormData.email) {
      setRegisterEmailError('Email is required.');
      return;
    }

    if (!registerFormData.password || registerFormData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (registerFormData.password !== registerFormData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setTermsError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerFormData.username,
          email: registerFormData.email,
          password: registerFormData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Registration failed');
        return;
      }

      setOtpStep(true);
      setAuthMessage('OTP sent to your email');
      setOtp(['', '', '', '', '', '']);
    } catch (error) {
      setAuthError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = (provider) => {
    console.log(`Login with ${provider}`);
  };

  const handleSwitchView = (view) => {
    setAuthView(view);
    setOtpStep(false);
    setOtp(['', '', '', '', '', '']);
    setLoginFormData({ email: '', password: '' });
    setRegisterFormData({ username: '', email: '', password: '', confirmPassword: '' });
    resetMessages();
    setTermsAccepted(false);
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setAuthError('Please enter all 6 digits');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerFormData.email,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'OTP verification failed');
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      onAuthenticate();
    } catch (error) {
      setAuthError('OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Sidebar */}
      <div className="auth-left">
        <div className="auth-branding">
          <div className="brand-logo">💬</div>
          <h1>SAMVAAD</h1>
          <p>Connect with your community in real-time</p>
        </div>

        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <div>
              <h3>Instant Messaging</h3>
              <p>Real-time conversations with lightning-fast delivery</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <div>
              <h3>Community Rooms</h3>
              <p>Join channels and connect with people who share your interests</p>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🔒</div>
            <div>
              <h3>Secure & Private</h3>
              <p>End-to-end encryption keeps your conversations safe</p>
            </div>
          </div>
        </div>

        <div className="chat-bubbles">
          <div className="bubble bubble-user">
            <p>Hey! This app is amazing. 🚀</p>
          </div>
          <div className="bubble bubble-response">
            <p>I know right! The real-time features are incredible!</p>
          </div>
          <div className="bubble bubble-user">
            <p>Can't wait to join the community! ❤️</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat">
            <div className="stat-number">1M+</div>
            <div className="stat-label">Messages Sent</div>
          </div>
          <div className="stat">
            <div className="stat-number">500+</div>
            <div className="stat-label">Communities</div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Form */}
      <div className="auth-right">
        <div className={`auth-form-wrapper ${authView === 'register' && !otpStep ? 'is-register' : ''}`}>
          {/* OTP Verification Screen - Full Screen */}
          {otpStep ? (
            <>
              <div className="otp-verification-screen">
                <div className="otp-header">
                  <div className="otp-lock-icon">🔒</div>
                  <h2>Verify Your Email</h2>
                  <p>We've sent a 6-digit OTP to</p>
                  <p className="otp-email"><strong>{registerFormData.email}</strong></p>
                  <p className="otp-hint">Check your console for the OTP code (demo mode)</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="otp-form">
                  <div className="otp-inputs">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="otp-input"
                        disabled={isSubmitting}
                      />
                    ))}
                  </div>

                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    Verify OTP
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="resend-otp-btn"
                    disabled={isSubmitting}
                    onClick={() => setAuthMessage('OTP resent to your email')}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    className="back-to-registration-btn"
                    onClick={() => {
                      setOtpStep(false);
                      setOtp(['', '', '', '', '', '']);
                      resetMessages();
                    }}
                    disabled={isSubmitting}
                  >
                    ← Back to registration
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div className="auth-tabs-container">
                <button
                  className={`auth-tab ${authView === 'login' ? 'active' : ''}`}
                  onClick={() => handleSwitchView('login')}
                >
                  Login
                </button>
                <button
                  className={`auth-tab ${authView === 'register' ? 'active' : ''}`}
                  onClick={() => handleSwitchView('register')}
                >
                  Register
                </button>
              </div>

              {authError && <div className="auth-error">{authError}</div>}
              {authMessage && <div className="auth-message">{authMessage}</div>}

              {/* Login Form */}
              {authView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={loginFormData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                </div>
                {loginEmailError && <div className="field-error">{loginEmailError}</div>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginFormData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginPasswordError && <div className="field-error">{loginPasswordError}</div>}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      setRememberMe(e.target.checked);
                      if (e.target.checked) setRememberMeError('');
                    }}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-password">
                  Forgot password?
                </button>
              </div>
              {rememberMeError && <div className="field-error">{rememberMeError}</div>}

              {/* Submit Button */}
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                Sign In
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Register Form */}
          {authView === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form register-grid">
              {/* Username Input */}
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={registerFormData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    disabled={isSubmitting}
                  />
                </div>
                {usernameError && <div className="field-error">{usernameError}</div>}
              </div>

              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="register-email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    value={registerFormData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {registerEmailError && <div className="field-error">{registerEmailError}</div>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="register-password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={registerFormData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <div className="field-error">{passwordError}</div>}
                
                {/* Password Strength Indicator */}
                {registerFormData.password && (
                  <div className="strength-indicator-wrapper">
                    <div className="strength-indicator-bg"></div>
                    <div className="password-strength-container">
                      <div className="strength-meter">
                        <svg viewBox="0 0 120 120" className="strength-circle">
                          <circle cx="60" cy="60" r="54" className="strength-bg" />
                          <circle 
                            cx="60" 
                            cy="60" 
                            r="54" 
                            className="strength-fill" 
                            style={{
                              strokeDasharray: `${(passwordStrength / 100) * 339.29} 339.29`,
                              stroke: passwordStrength < 40 ? '#ef4444' : passwordStrength < 70 ? '#f59e0b' : '#10b981'
                            }}
                          />
                          <text 
                            x="60" 
                            y="65" 
                            className="strength-text"
                            style={{fill: passwordStrength < 40 ? '#ef4444' : passwordStrength < 70 ? '#f59e0b' : '#10b981'}}
                          >
                            {passwordStrength}%
                          </text>
                        </svg>
                      </div>
                      
                      <div className="strength-badges">
                        <span className={`badge ${strengthChecks.length ? 'active' : ''}`}>
                          8+ chars
                        </span>
                        <span className={`badge ${strengthChecks.uppercase ? 'active' : ''}`}>
                          A-Z
                        </span>
                        <span className={`badge ${strengthChecks.lowercase ? 'active' : ''}`}>
                          a-z
                        </span>
                        <span className={`badge ${strengthChecks.numbers ? 'active' : ''}`}>
                          0-9
                        </span>
                        <span className={`badge ${strengthChecks.special ? 'active' : ''}`}>
                          @#$
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerFormData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && <div className="field-error">{confirmPasswordError}</div>}
              </div>

              {/* Terms Agreement */}
              <div className="terms-agreement">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (e.target.checked) setTermsError('');
                  }}
                  disabled={isSubmitting}
                />
                <label htmlFor="terms">
                  I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
                </label>
              </div>

              {termsError && <div className="terms-error">{termsError}</div>}

              {/* Submit Button */}
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                Create Account
                <ArrowRight size={18} />
              </button>
            </form>
          )}

            {/* Divider */}
            <div className="divider">
              <span>Or continue with</span>
            </div>

            {/* Social Buttons */}
            <div className="social-buttons">
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialAuth('Google')}
              >
                <Chrome size={18} />
                <span>Google</span>
              </button>
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialAuth('GitHub')}
              >
                <Github size={18} />
                <span>GitHub</span>
              </button>
            </div>

            {/* Footer */}
            <div className="auth-footer">
              <p>By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></p>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
