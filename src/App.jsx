import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';
import DeveloperPage from './pages/DeveloperPage';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import defaultStore from './data/store.json';
import './App.css';

const getSettings = () => {
  const data = localStorage.getItem('crackers_settings');
  if (!data) {
    localStorage.setItem('crackers_settings', JSON.stringify(defaultStore.settings));
    return { ...defaultStore.settings };
  }
  const settings = JSON.parse(data);
  // Auto-migrate: filter out default role routing options to keep navbar clean
  if (settings.navbarLinks && settings.navbarLinks.some(l => ['/', '/admin', '/developer'].includes(l.path))) {
    settings.navbarLinks = settings.navbarLinks.filter(l => !['/', '/admin', '/developer'].includes(l.path));
    if (settings.navbarLinks.length === 0) {
      settings.navbarLinks = [...defaultStore.settings.navbarLinks];
    }
    localStorage.setItem('crackers_settings', JSON.stringify(settings));
  }
  return settings;
};

const getCurrentUser = () => {
  const data = localStorage.getItem('crackers_current_user');
  return data ? JSON.parse(data) : null;
};

// Route Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'developer') return <Navigate to="/developer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const loadFromServer = async () => {
      try {
        const res = await fetch('/api/store');
        if (res.ok) {
          const data = await res.json();
          let updated = false;

          const currentDb = localStorage.getItem('crackers_db');
          const serverDb = JSON.stringify(data.products);
          if (currentDb !== serverDb) {
            localStorage.setItem('crackers_db', serverDb);
            updated = true;
          }

          const currentSettings = localStorage.getItem('crackers_settings');
          const serverSettings = JSON.stringify(data.settings);
          if (currentSettings !== serverSettings) {
            localStorage.setItem('crackers_settings', serverSettings);
            updated = true;
          }

          const currentUsers = localStorage.getItem('crackers_users');
          const serverUsers = JSON.stringify(data.users);
          if (currentUsers !== serverUsers) {
            localStorage.setItem('crackers_users', serverUsers);
            updated = true;
          }

          if (updated) {
            window.dispatchEvent(new Event('store-updated'));
          }
        }
      } catch (e) {
        console.error('Failed to load store from server', e);
      }
    };

    loadFromServer();
    const interval = setInterval(loadFromServer, 2000); // Sync every 2 seconds for real-time updates!

    const handleUpdate = () => setSettings(getSettings());
    window.addEventListener('store-updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('store-updated', handleUpdate);
    };
  }, []);

  // Update browser tab title dynamically based on Developer settings siteName and tagline
  useEffect(() => {
    const site = settings.siteName || 'Sri Murugan Crackers';
    const tag = settings.tagline || 'Premium Fireworks';
    document.title = `${site} | ${tag}`;
  }, [settings.siteName, settings.tagline]);

  // Apply dynamic theme from Developer settings (supports automatic light/dark switching based on background color)
  useEffect(() => {
    const bg = settings.bgColor || '#0a0a1a';
    document.documentElement.style.setProperty('--bg-dark', bg);
    document.documentElement.style.fontSize = `${settings.fontSize || 16}px`;
    document.documentElement.style.setProperty('--navbar-height', `${settings.navbarSize || 64}px`);

    // Helper to check if a hex color is light
    const isLightColor = (hex) => {
      if (!hex || hex[0] !== '#') return false;
      let color = hex.substring(1);
      if (color.length === 3) {
        color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
      }
      if (color.length !== 6) return false;
      const r = parseInt(color.substring(0, 2), 16);
      const g = parseInt(color.substring(2, 4), 16);
      const b = parseInt(color.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5;
    };

    const isLight = isLightColor(bg);

    if (isLight) {
      document.documentElement.style.setProperty('--bg-card', '#ffffff');
      document.documentElement.style.setProperty('--bg-card-hover', '#f1f5f9');
      document.documentElement.style.setProperty('--bg-surface', '#ffffff');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(0, 0, 0, 0.02)');
      document.documentElement.style.setProperty('--bg-glass-navbar', 'rgba(255, 255, 255, 0.85)');
      document.documentElement.style.setProperty('--text-primary', '#0f172a');
      document.documentElement.style.setProperty('--text-secondary', '#475569');
      document.documentElement.style.setProperty('--text-muted', '#64748b');
      document.documentElement.style.setProperty('--accent-light', '#7c3aed');
      document.documentElement.style.setProperty('--border', 'rgba(0, 0, 0, 0.08)');
      document.documentElement.style.setProperty('--border-hover', 'rgba(0, 0, 0, 0.15)');
      document.documentElement.style.setProperty('--shadow-sm', '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.05)');
      document.documentElement.style.setProperty('--shadow-md', '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)');
      document.documentElement.style.setProperty('--shadow-lg', '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08)');
      document.documentElement.style.setProperty('--shadow-glow', '0 10px 25px -5px rgba(255, 107, 53, 0.1)');
      document.documentElement.style.setProperty('--hero-bg', 'linear-gradient(135deg, #fff1f2 0%, #fffbeb 50%, #f0fdf4 100%)');
    } else {
      document.documentElement.style.setProperty('--bg-card', '#12122a');
      document.documentElement.style.setProperty('--bg-card-hover', '#1a1a3e');
      document.documentElement.style.setProperty('--bg-surface', '#161632');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.04)');
      document.documentElement.style.setProperty('--bg-glass-navbar', 'rgba(10, 10, 26, 0.85)');
      document.documentElement.style.setProperty('--text-primary', '#f0f0f5');
      document.documentElement.style.setProperty('--text-secondary', '#9a9abf');
      document.documentElement.style.setProperty('--text-muted', '#6a6a8e');
      document.documentElement.style.setProperty('--accent-light', '#a78bfa');
      document.documentElement.style.setProperty('--border', 'rgba(255, 255, 255, 0.08)');
      document.documentElement.style.setProperty('--border-hover', 'rgba(255, 255, 255, 0.15)');
      document.documentElement.style.setProperty('--shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.3)');
      document.documentElement.style.setProperty('--shadow-md', '0 4px 20px rgba(0, 0, 0, 0.4)');
      document.documentElement.style.setProperty('--shadow-lg', '0 8px 40px rgba(0, 0, 0, 0.5)');
      document.documentElement.style.setProperty('--shadow-glow', '0 0 30px rgba(255, 107, 53, 0.15)');
      document.documentElement.style.setProperty('--hero-bg', 'linear-gradient(135deg, #1a0a2e 0%, #0a0a1a 40%, #1a0520 100%)');
    }
  }, [settings.bgColor, settings.fontSize, settings.navbarSize]);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<CustomerPage />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'developer']}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/developer" element={
            <ProtectedRoute allowedRoles={['developer']}>
              <DeveloperPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
