import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultProducts from '../data/products.json';
import defaultSettings from '../data/settings.json';
import defaultUsers from '../data/users.json';
import { FaUser, FaLock, FaUserTag, FaFire, FaCode, FaUserShield } from 'react-icons/fa';
import './AuthPage.css';

const getUsers = () => {
  const data = localStorage.getItem('crackers_users');
  if (!data) {
    localStorage.setItem('crackers_users', JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }
  return JSON.parse(data);
};

const getSettings = () => {
  const data = localStorage.getItem('crackers_settings');
  if (!data) {
    localStorage.setItem('crackers_settings', JSON.stringify(defaultSettings));
    return { ...defaultSettings };
  }
  return JSON.parse(data);
};

const syncWithServer = async (updatedFields = {}) => {
  try {
    const products = updatedFields.products || JSON.parse(localStorage.getItem('crackers_db')) || defaultProducts;
    const settings = updatedFields.settings || JSON.parse(localStorage.getItem('crackers_settings')) || defaultSettings;
    const users = updatedFields.users || JSON.parse(localStorage.getItem('crackers_users')) || defaultUsers;
    
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, settings, users })
    });
  } catch (e) {
    console.error('Failed to sync changes with server', e);
  }
};

const registerUser = (username, password, role) => {
  const users = getUsers();
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return { success: false, error: 'Username already exists!' };
  }
  const newUser = { username, password, role };
  const updated = [...users, newUser];
  localStorage.setItem('crackers_users', JSON.stringify(updated));
  syncWithServer({ users: updated });
  return { success: true };
};

const loginUser = (username, password) => {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) {
    return { success: false, error: 'Invalid username or password!' };
  }
  localStorage.setItem('crackers_current_user', JSON.stringify({ username: user.username, role: user.role }));
  window.dispatchEvent(new Event('store-updated'));
  return { success: true, user: { username: user.username, role: user.role } };
};

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (isLogin) {
      const res = loginUser(username.trim(), password);
      if (res.success) {
        setSuccess('Logged in successfully! Redirecting...');
        setTimeout(() => {
          if (res.user.role === 'developer') {
            navigate('/developer');
          } else if (res.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        setError(res.error);
      }
    } else {
      const res = registerUser(username.trim(), password, role);
      if (res.success) {
        setSuccess('Account created successfully! Switching to Login...');
        setTimeout(() => {
          setIsLogin(true);
          setUsername(username.trim());
          setPassword('');
          setSuccess('');
        }, 1500);
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-bubbles">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="auth-logo-img" style={{ maxHeight: '60px', objectFit: 'contain', display: 'block', margin: '0 auto 16px' }} />
          ) : (
            <span className="auth-logo">🎆</span>
          )}
          <h2>Welcome to {settings.siteName || 'Sri Murugan Crackers'}</h2>
          <p>{isLogin ? 'Sign in to access your dashboard' : 'Create an account to order premium crackers'}</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-group">
            <label><FaUser /> Username</label>
            <div className="input-with-icon">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="auth-group">
            <label><FaLock /> Password</label>
            <div className="input-with-icon">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </div>


          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button className="auth-toggle-link" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

        {/* Credentials helper panel for demo convenience */}
        <div className="demo-credentials">
          <h4>🔑 Demo Login Accounts:</h4>
          <div className="cred-badges">
            <div className="cred-badge" onClick={() => { setUsername('customer'); setPassword('customer'); }}>
              <span className="badge-role"><FaFire /> Customer</span>
              <span className="badge-details">user: customer / pass: customer</span>
            </div>
            <div className="cred-badge" onClick={() => { setUsername('admin'); setPassword('admin'); }}>
              <span className="badge-role"><FaUserShield /> Admin</span>
              <span className="badge-details">user: admin / pass: admin</span>
            </div>
            <div className="cred-badge" onClick={() => { setUsername('dev'); setPassword('dev'); }}>
              <span className="badge-role"><FaCode /> Developer</span>
              <span className="badge-details">user: dev / pass: dev</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
