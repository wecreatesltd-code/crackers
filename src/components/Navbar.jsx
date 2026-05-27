import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaUserShield, FaCode, FaInfoCircle, FaFileContract, FaLink, FaQuestionCircle, FaShoppingBag, FaStore, FaEnvelope, FaPhone, FaSignOutAlt, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import defaultSettings from '../data/settings.json';
import './Navbar.css';

const getSettings = () => {
  const data = localStorage.getItem('crackers_settings');
  if (!data) {
    localStorage.setItem('crackers_settings', JSON.stringify(defaultSettings));
    return { ...defaultSettings };
  }
  const settings = JSON.parse(data);
  // Auto-migrate: filter out default role routing options to keep navbar clean
  if (settings.navbarLinks && settings.navbarLinks.some(l => ['/', '/admin', '/developer'].includes(l.path))) {
    settings.navbarLinks = settings.navbarLinks.filter(l => !['/', '/admin', '/developer'].includes(l.path));
    if (settings.navbarLinks.length === 0) {
      settings.navbarLinks = [...defaultSettings.navbarLinks];
    }
    localStorage.setItem('crackers_settings', JSON.stringify(settings));
  }
  return settings;
};

const getCurrentUser = () => {
  const data = localStorage.getItem('crackers_current_user');
  return data ? JSON.parse(data) : null;
};

const logoutUser = () => {
  localStorage.removeItem('crackers_current_user');
  window.dispatchEvent(new Event('store-updated'));
};

const ICON_MAP = {
  FaHome: <FaHome />,
  FaUserShield: <FaUserShield />,
  FaCode: <FaCode />,
  FaInfoCircle: <FaInfoCircle />,
  FaFileContract: <FaFileContract />,
  FaLink: <FaLink />,
  FaQuestionCircle: <FaQuestionCircle />,
  FaShoppingBag: <FaShoppingBag />,
  FaStore: <FaStore />,
  FaEnvelope: <FaEnvelope />,
  FaPhone: <FaPhone />
};

function getIcon(iconName) {
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  if (iconName && iconName.length <= 2) return <span style={{ marginRight: '6px' }}>{iconName}</span>;
  return <FaLink />;
}

function Navbar() {
  const [settings, setSettings] = useState(getSettings());
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getSettings());
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('store-updated', handleUpdate);
    return () => window.removeEventListener('store-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!isUserDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.user-profile-menu')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isUserDropdownOpen]);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const navHeight = settings.navbarSize || 64;

  return (
    <nav className="navbar" style={{ '--navbar-height': `${navHeight}px` }}>
      <div className="navbar-inner">
        <div className="navbar-brand">
          {settings.logo ? (
            <img src={settings.logo} alt="Brand Logo" className="brand-logo-img" style={{ maxHeight: '40px', objectFit: 'contain', marginRight: '8px' }} />
          ) : (
            <span className="brand-icon">🎆</span>
          )}
          <span className="brand-text">{settings.siteName || 'Sri Murugan Crackers'}</span>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        {currentUser ? (
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="nav-links-group" style={{ display: 'flex', gap: '12px' }}>
              {(settings.navbarLinks || [
                { id: '1', label: 'Customer', path: '/', icon: 'FaHome' },
                { id: '2', label: 'Admin', path: '/admin', icon: 'FaUserShield' },
                { id: '3', label: 'Developer', path: '/developer', icon: 'FaCode' }
              ]).map((link) => {
                // Filter out default systemic navigation options from primary customer menu
                if (['/', '/admin', '/developer'].includes(link.path)) return null;

                const isExternal = link.path.startsWith('http') || link.path.startsWith('#');
                if (isExternal) {
                  return (
                    <a key={link.id} href={link.path} className="nav-link" target={link.path.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                      {getIcon(link.icon)}
                      <span>{link.label}</span>
                    </a>
                  );
                }
                return (
                  <NavLink key={link.id} to={link.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end={link.path === '/'}>
                    {getIcon(link.icon)}
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="user-profile-menu" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--border)', paddingLeft: '20px', position: 'relative' }}>
              {/* Quick Admin/Dev icon links only visible to authorized roles */}
              {currentUser.role === 'developer' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <NavLink to="/developer" className="nav-icon-link" title="Developer Console">
                    <FaCode />
                  </NavLink>
                  <NavLink to="/admin" className="nav-icon-link" title="Admin Panel">
                    <FaUserShield />
                  </NavLink>
                </div>
              )}
              {currentUser.role === 'admin' && (
                <NavLink to="/admin" className="nav-icon-link" title="Admin Panel">
                  <FaUserShield />
                </NavLink>
              )}

              {/* Clickable user-badge to toggle sign out dropdown */}
              <div 
                className={`user-badge ${isUserDropdownOpen ? 'active' : ''}`} 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}
              >
                <span className="user-avatar" style={{ background: 'var(--accent-light)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  {currentUser.username[0].toUpperCase()}
                </span>
                <span className="user-name" style={{ textTransform: 'capitalize' }}>{currentUser.username}</span>
              </div>

              {/* Click-triggered Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-info">
                    <span className="dropdown-username">{currentUser.username}</span>
                    <span className="dropdown-role">{currentUser.role}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={() => { handleLogout(); setIsUserDropdownOpen(false); }} className="dropdown-item btn-signout">
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="navbar-links">
            <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FaUser />
              <span>Login / Register</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Mobile Drawer Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-panel">
          {settings.navbarLinks && settings.navbarLinks.length > 0 && (
            <div className="mobile-menu-links">
              {settings.navbarLinks.map((link) => {
                if (['/', '/admin', '/developer'].includes(link.path)) return null;
                const isExternal = link.path.startsWith('http') || link.path.startsWith('#');
                if (isExternal) {
                  return (
                    <a key={link.id} href={link.path} className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                      {getIcon(link.icon)}
                      <span>{link.label}</span>
                    </a>
                  );
                }
                return (
                  <NavLink key={link.id} to={link.path} className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    {getIcon(link.icon)}
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}

          {currentUser ? (
            <div className="mobile-menu-user">
              <div className="mobile-user-info">
                <span className="mobile-user-avatar">
                  {currentUser.username[0].toUpperCase()}
                </span>
                <div className="mobile-user-details">
                  <span className="mobile-username" style={{ textTransform: 'capitalize' }}>{currentUser.username}</span>
                </div>
              </div>

              {/* Quick Admin/Developer shortcuts inside mobile menu */}
              {['admin', 'developer'].includes(currentUser.role) && (
                <div className="mobile-quick-links">
                  {currentUser.role === 'developer' && (
                    <NavLink to="/developer" className="mobile-quick-link" onClick={() => setIsMobileMenuOpen(false)}>
                      <FaCode /> Developer Console
                    </NavLink>
                  )}
                  <NavLink to="/admin" className="mobile-quick-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <FaUserShield /> Admin Panel
                  </NavLink>
                </div>
              )}

              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="mobile-btn-signout">
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          ) : (
            <div className="mobile-menu-user">
              <NavLink to="/login" className="mobile-btn-login" onClick={() => setIsMobileMenuOpen(false)}>
                <FaUser /> Sign In / Register
              </NavLink>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
