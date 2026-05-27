import { useState, useEffect } from 'react';
import defaultProducts from '../data/products.json';
import defaultSettings from '../data/settings.json';
import defaultUsers from '../data/users.json';
import { FaCode, FaPlus, FaTrash, FaEdit, FaSave, FaCog, FaDatabase, FaSync, FaChartBar, FaTimes, FaPaintBrush, FaStore, FaFont, FaLayerGroup, FaLink, FaUser, FaServer } from 'react-icons/fa';
import AddProductForm from '../components/AddProductForm';
import './DeveloperPage.css';

const getProducts = () => {
  const data = localStorage.getItem('crackers_db');
  if (!data) {
    localStorage.setItem('crackers_db', JSON.stringify(defaultProducts));
    return [...defaultProducts];
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

const saveProducts = (products) => {
  localStorage.setItem('crackers_db', JSON.stringify(products));
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ products });
};

const addProduct = (product) => {
  const products = getProducts();
  const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { ...product, id: newId };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

const deleteProduct = (id) => {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
};

const updateProduct = (id, updates) => {
  const products = getProducts().map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveProducts(products);
};

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

const saveSettings = (settings) => {
  localStorage.setItem('crackers_settings', JSON.stringify(settings));
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ settings });
};

const getUsers = () => {
  const data = localStorage.getItem('crackers_users');
  if (!data) {
    localStorage.setItem('crackers_users', JSON.stringify(defaultUsers));
    return [...defaultUsers];
  }
  return JSON.parse(data);
};

const saveUsers = (users) => {
  localStorage.setItem('crackers_users', JSON.stringify(users));
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ users });
};

const resetAll = () => {
  localStorage.setItem('crackers_db', JSON.stringify(defaultProducts));
  localStorage.setItem('crackers_settings', JSON.stringify(defaultSettings));
  localStorage.setItem('crackers_users', JSON.stringify(defaultUsers));
  localStorage.removeItem('crackers_current_user');
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ products: defaultProducts, settings: defaultSettings, users: defaultUsers });
};

const DEFAULT_CATEGORIES = ['Sparklers', 'Ground', 'Aerial', 'Loud', 'Fountain', 'Novelty'];

function renderProductImage(image) {
  if (image && (image.startsWith('http') || image.startsWith('data:image') || image.startsWith('/'))) {
    return <img src={image} alt="Product" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} />;
  }
  return <span style={{ fontSize: '24px' }}>{image || '🎆'}</span>;
}

function DeveloperPage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('products');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const activeCategories = settings.categories || DEFAULT_CATEGORIES;

  // User accounts states
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userEditForm, setUserEditForm] = useState({});
  const [userAddForm, setUserAddForm] = useState({ username: '', password: '', role: 'customer' });

  const loadData = () => {
    const p = getProducts();
    const s = getSettings();
    const u = getUsers();
    setProducts(p);
    setSettings(s);
    setUsers(u);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('store-updated', loadData);
    return () => window.removeEventListener('store-updated', loadData);
  }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const startEdit = (product) => { setEditingId(product.id); setEditForm({ ...product }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };
  const saveEdit = () => {
    updateProduct(editingId, { ...editForm, price: Number(editForm.price), stock: Number(editForm.stock), rating: Number(editForm.rating) });
    setEditingId(null);
    showToast('Product updated! Changes reflected everywhere ✅');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This will remove it from Customer & Admin pages too.`)) {
      deleteProduct(id);
      showToast(`"${name}" deleted from all pages 🗑️`);
    }
  };

  const handleAdd = (product) => {
    addProduct(product);
    setShowAddModal(false);
    showToast('Product added! Visible on Customer & Admin pages ✅');
  };

  const handleSettingsSave = () => { saveSettings(settings); showToast('Settings saved! All pages updated ✅'); };
  const handleReset = () => { if (window.confirm('Reset ALL data to defaults?')) { resetAll(); showToast('All data reset to defaults 🔄'); } };

  // User Accounts Handlers
  const handleDeleteUser = (usernameToDelete) => {
    const currentUser = JSON.parse(localStorage.getItem('crackers_current_user') || '{}');
    if (currentUser.username && currentUser.username.toLowerCase() === usernameToDelete.toLowerCase()) {
      showToast('You cannot delete your own logged-in account!', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${usernameToDelete}"?`)) {
      const updated = users.filter(u => u.username.toLowerCase() !== usernameToDelete.toLowerCase());
      saveUsers(updated);
      showToast(`User "${usernameToDelete}" deleted successfully! 🗑️`);
    }
  };

  const startEditUser = (user) => {
    setEditingUserId(user.username);
    setUserEditForm({ ...user });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setUserEditForm({});
  };

  const saveEditUser = () => {
    if (!userEditForm.password.trim()) {
      showToast('Password cannot be empty!', 'error');
      return;
    }
    const updated = users.map(u => u.username.toLowerCase() === editingUserId.toLowerCase() ? { ...u, password: userEditForm.password, role: userEditForm.role } : u);
    saveUsers(updated);
    setEditingUserId(null);
    showToast('User credentials updated! ✅');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!userAddForm.username.trim() || !userAddForm.password.trim()) {
      showToast('Username and password are required!', 'error');
      return;
    }
    const exists = users.some(u => u.username.toLowerCase() === userAddForm.username.trim().toLowerCase());
    if (exists) {
      showToast('Username already exists!', 'error');
      return;
    }
    const updated = [...users, { username: userAddForm.username.trim(), password: userAddForm.password, role: userAddForm.role }];
    saveUsers(updated);
    setUserAddForm({ username: '', password: '', role: 'customer' });
    showToast(`User "${userAddForm.username}" added successfully! ✅`);
  };

  // Category management
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const cat = newCategory.trim();
    if (activeCategories.includes(cat)) return showToast('Category already exists!', 'error');
    const updated = [...activeCategories, cat];
    
    const ns = { ...settings, categories: updated };
    const currentVisible = settings.visibleCategories || activeCategories;
    if (!currentVisible.includes(cat)) {
      ns.visibleCategories = [...currentVisible, cat];
    }
    
    setSettings(ns);
    saveSettings(ns);
    
    setNewCategory('');
    showToast(`Category "${cat}" added successfully! ✅`);
  };

  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Are you sure you want to delete the category "${cat}"? Products in this category will still exist but may not be filterable.`)) {
      const updated = activeCategories.filter(c => c !== cat);
      const currentVisible = settings.visibleCategories || activeCategories;
      
      const ns = { ...settings, categories: updated, visibleCategories: currentVisible.filter(c => c !== cat) };
      setSettings(ns);
      saveSettings(ns);
      showToast(`Category "${cat}" deleted! 🗑️`);
    }
  };

  const toggleCategory = (cat) => {
    const current = settings.visibleCategories || activeCategories;
    const updated = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    const newSettings = { ...settings, visibleCategories: updated };
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast(`${cat} ${updated.includes(cat) ? 'enabled ✅' : 'hidden 🚫'} on Customer & Admin`);
  };

  // Live settings update (auto-save for sliders/pickers)
  const updateSettingLive = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };



  // Footer links CRUD
  const addFooterLink = (newLink) => {
    const currentLinks = settings.footerLinks || [
      { id: '1', label: 'About Us', path: '#about', icon: 'FaInfoCircle' },
      { id: '2', label: 'Privacy & Terms', path: '#privacy', icon: 'FaFileContract' }
    ];
    const newId = String(currentLinks.length > 0 ? Math.max(...currentLinks.map(l => Number(l.id) || 0)) + 1 : 1);
    const updated = [...currentLinks, { ...newLink, id: newId }];
    updateSettingLive('footerLinks', updated);
    showToast('Footer link added successfully! ✅');
  };

  const deleteFooterLink = (id) => {
    const currentLinks = settings.footerLinks || [];
    const updated = currentLinks.filter(l => l.id !== id);
    updateSettingLive('footerLinks', updated);
    showToast('Footer link deleted! 🗑️');
  };

  const updateFooterLink = (id, updatedLink) => {
    const currentLinks = settings.footerLinks || [];
    const updated = currentLinks.map(l => l.id === id ? { ...l, ...updatedLink } : l);
    updateSettingLive('footerLinks', updated);
  };

  const emojis = ['🎆', '🎇', '🚀', '💥', '🧨', '🌺', '🎡', '⛲', '💨', '⭐', '🦋', '✏️', '🔥', '✨', '🎉'];
  const bgPresets = [
    { label: 'Default Dark', value: '#0a0a1a' },
    { label: 'Deep Navy', value: '#0d1117' },
    { label: 'Charcoal', value: '#1a1a1a' },
    { label: 'Pure White', value: '#ffffff' },
    { label: 'Soft Slate', value: '#f8fafc' },
    { label: 'Warm Cream', value: '#faf8f5' },
    { label: 'Ice Blue', value: '#f0f4f8' },
    { label: 'Mint Light', value: '#f4faf6' },
  ];

  return (
    <div className="dev-page">
      <div className="dev-header">
        <div className="dev-header-left">
          <h1><FaCode /> Developer Console</h1>
          <p>Full control — all changes sync to Admin & Customer pages in real-time</p>
        </div>
        <div className="dev-header-actions">
          <button className="btn-dev btn-reset" onClick={handleReset}><FaSync /> Reset All</button>
          <button className="btn-dev btn-add-new" onClick={() => setShowAddModal(true)}><FaPlus /> Add Product</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dev-stats">
        <div className="dev-stat"><FaDatabase /><span>{products.length} Products</span></div>
        <div className="dev-stat"><FaChartBar /><span>₹{products.reduce((s, p) => s + p.price * p.stock, 0).toLocaleString()} Value</span></div>
        <div className="dev-stat"><FaStore /><span>{settings.siteName}</span></div>
      </div>

      {/* Tabs */}
      <div className="dev-tabs">
        {[
          { id: 'products', icon: <FaDatabase />, label: 'Products (CRUD)' },
          { id: 'settings', icon: <FaCog />, label: 'Site Settings' },
          { id: 'main_settings', icon: <FaServer />, label: 'Main Settings' },
          { id: 'theme', icon: <FaPaintBrush />, label: 'Theme & Display' },
          { id: 'navigation', icon: <FaLink />, label: 'Navbar & Footer' },
          { id: 'categories', icon: <FaLayerGroup />, label: 'Categories' },
          { id: 'users', icon: <FaUser />, label: 'User Accounts' },
        ].map((tab) => (
          <button key={tab.id} className={`dev-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="dev-content">
          <div className="dev-table-wrap">
            <table className="dev-table">
              <thead>
                <tr><th>ID</th><th>Icon</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Featured</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={editingId === p.id ? 'editing-row' : ''}>
                    <td className="td-id">{p.id}</td>
                    <td className="td-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                      {editingId === p.id ? (
                        <input className="edit-input" value={editForm.image} onChange={(e) => setEditForm({ ...editForm, image: e.target.value })} style={{ width: '120px' }} placeholder="Emoji or Image URL" />
                      ) : (
                        renderProductImage(p.image)
                      )}
                    </td>
                    <td>{editingId === p.id ? <input className="edit-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /> : <span className="td-name">{p.name}</span>}</td>
                    <td>{editingId === p.id ? <select className="edit-input" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>{activeCategories.map((c) => <option key={c}>{c}</option>)}</select> : <span className="td-cat">{p.category}</span>}</td>
                    <td>{editingId === p.id ? <input className="edit-input edit-sm" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /> : <span className="td-price">₹{p.price}</span>}</td>
                    <td>{editingId === p.id ? <input className="edit-input edit-sm" type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} /> : p.stock}</td>
                    <td>{editingId === p.id ? <input className="edit-input edit-sm" type="number" step="0.1" min="0" max="5" value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} /> : <span className="td-rating">⭐ {p.rating}</span>}</td>
                    <td>{editingId === p.id ? <input type="checkbox" checked={editForm.featured} onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })} /> : (p.featured ? '✅' : '—')}</td>
                    <td className="td-actions">
                      {editingId === p.id ? (
                        <><button className="btn-icon btn-save" onClick={saveEdit}><FaSave /></button><button className="btn-icon btn-cancel" onClick={cancelEdit}><FaTimes /></button></>
                      ) : (
                        <><button className="btn-icon btn-edit" onClick={() => startEdit(p)}><FaEdit /></button><button className="btn-icon btn-del" onClick={() => handleDelete(p.id, p.name)}><FaTrash /></button></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="dev-content">
          <div className="settings-form">
            <h3>🏪 Site Configuration</h3>
            <p className="settings-note">Changes here reflect on Customer & Admin pages instantly</p>

            {/* Main Settings - Prominent */}
            <div className="main-settings-section">
              <h4 className="main-settings-header"><FaCog /> Main Settings</h4>
              
              <div className="logo-upload-wrap">
                <div className="logo-preview">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Store Logo" />
                  ) : (
                    <div className="logo-preview-placeholder"><FaStore /></div>
                  )}
                </div>
                <div className="logo-upload-btn-wrap">
                  <label className="btn-upload">
                    <FaPlus /> Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="logo-file-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSettings({ ...settings, logo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="settings-note" style={{ marginBottom: 0, fontSize: '12px' }}>Recommended: Square or wide image. Max 1MB.</p>
                </div>
              </div>

              <div className="store-name-preview">
                <FaStore className="store-icon" />
                <div>
                  <label>Store Name</label>
                  <p className="store-name-current">{settings.siteName}</p>
                </div>
              </div>
              <input
                type="text"
                className="store-name-input"
                value={settings.siteName || ''}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="Enter your store name..."
              />
            </div>

            <div className="settings-grid">
              {[
                { key: 'tagline', label: 'Tagline', type: 'text' },
                { key: 'bannerText', label: 'Banner Text', type: 'text' },
                { key: 'contactPhone', label: 'Phone', type: 'text' },
                { key: 'contactEmail', label: 'Email', type: 'text' },
                { key: 'address', label: 'Address', type: 'text' },
                { key: 'deliveryNote', label: 'Delivery Note', type: 'text' },
                { key: 'minOrder', label: 'Min Order (₹)', type: 'number' },
                { key: 'bannerHeight', label: 'Banner Height (px)', type: 'number' },
              ].map((field) => (
                <div key={field.key} className="setting-item">
                  <label>{field.label}</label>
                  <input type={field.type} value={settings[field.key] || ''} onChange={(e) => setSettings({ ...settings, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })} />
                </div>
              ))}
              <div className="setting-item setting-toggle">
                <label>Show Banner</label>
                <button className={`toggle-btn ${settings.showBanner ? 'on' : 'off'}`} onClick={() => setSettings({ ...settings, showBanner: !settings.showBanner })}>
                  {settings.showBanner ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <button className="btn-dev btn-save-settings" onClick={handleSettingsSave}><FaSave /> Save All Settings</button>
          </div>
        </div>
      )}



      {/* Main Settings Tab */}
      {activeTab === 'main_settings' && (
        <div className="dev-content">
          <div className="settings-form">
            <h3><FaServer /> Main Settings</h3>
            <p className="settings-note">Core application configurations and storage options.</p>
            
            <div className="settings-grid">
              {/* Category Switch */}
              <div className="setting-item setting-toggle">
                <label>Enable Categories Feature</label>
                <button 
                  className={`toggle-btn ${settings.enableCategories !== false ? 'on' : 'off'}`} 
                  onClick={() => updateSettingLive('enableCategories', settings.enableCategories !== false ? false : true)}
                >
                  {settings.enableCategories !== false ? 'ON' : 'OFF'}
                </button>
                <p className="settings-note" style={{marginTop: '8px', fontSize: '12px'}}>Toggle the categories feature globally across the application.</p>
              </div>

              {/* Storage Option */}
              <div className="setting-item">
                <label>Storage Option</label>
                <select 
                  className="edit-input" 
                  value={settings.storageMethod || 'json'} 
                  onChange={(e) => updateSettingLive('storageMethod', e.target.value)}
                  style={{ height: '42px', padding: '0 14px' }}
                >
                  <option value="json">JSON (Local Storage)</option>
                  <option value="firebase">Firebase Database</option>
                </select>
                <p className="settings-note" style={{marginTop: '8px', fontSize: '12px'}}>Select where data is saved (requires refresh).</p>
              </div>

              {/* Stock Switch */}
              <div className="setting-item setting-toggle">
                <label>Enable Stock Management</label>
                <button 
                  className={`toggle-btn ${settings.enableStock !== false ? 'on' : 'off'}`} 
                  onClick={() => updateSettingLive('enableStock', settings.enableStock !== false ? false : true)}
                >
                  {settings.enableStock !== false ? 'ON' : 'OFF'}
                </button>
                <p className="settings-note" style={{marginTop: '8px', fontSize: '12px'}}>Toggle stock limit and inventory tracking.</p>
              </div>

              {/* Method of Booking */}
              <div className="setting-item">
                <label>Method of Booking</label>
                <select 
                  className="edit-input" 
                  value={settings.bookingMethod || 'whatsapp'} 
                  onChange={(e) => updateSettingLive('bookingMethod', e.target.value)}
                  style={{ height: '42px', padding: '0 14px' }}
                >
                  <option value="whatsapp">Order share via WhatsApp</option>
                  <option value="local">Order store in Local Storage</option>
                  <option value="db">Order store in DB</option>
                </select>
                <p className="settings-note" style={{marginTop: '8px', fontSize: '12px'}}>Select how customer orders are processed.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme & Display Tab */}
      {activeTab === 'theme' && (
        <div className="dev-content">
          <div className="theme-section">
            <h3><FaPaintBrush /> Theme & Display Controls</h3>
            <p className="settings-note">Live preview — changes apply to all pages instantly</p>

            {/* Font Size */}
            <div className="theme-card">
              <div className="theme-card-header">
                <FaFont className="theme-card-icon" />
                <div>
                  <h4>Font Size</h4>
                  <p>Adjust the base font size across all pages</p>
                </div>
              </div>
              <div className="font-size-control">
                <span className="font-label-small">A</span>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.fontSize || 16}
                  onChange={(e) => updateSettingLive('fontSize', Number(e.target.value))}
                  className="font-slider"
                />
                <span className="font-label-large">A</span>
                <span className="font-size-value">{settings.fontSize || 16}px</span>
              </div>
              <div className="font-preview" style={{ fontSize: `${settings.fontSize || 16}px` }}>
                Preview: The quick brown fox jumps over the lazy dog
              </div>
            </div>

            {/* Navbar Size Adjust */}
            <div className="theme-card">
              <div className="theme-card-header">
                <FaStore className="theme-card-icon" />
                <div>
                  <h4>Navbar Size</h4>
                  <p>Adjust the height of the navigation bar across all pages</p>
                </div>
              </div>
              <div className="font-size-control">
                <span className="font-label-small" style={{ fontSize: '12px' }}>Thin</span>
                <input
                  type="range"
                  min="48"
                  max="120"
                  step="4"
                  value={settings.navbarSize || 64}
                  onChange={(e) => updateSettingLive('navbarSize', Number(e.target.value))}
                  className="font-slider"
                />
                <span className="font-label-large" style={{ fontSize: '18px' }}>Thick</span>
                <span className="font-size-value">{settings.navbarSize || 64}px</span>
              </div>
            </div>

            {/* Banner Size Adjust */}
            <div className="theme-card">
              <div className="theme-card-header">
                <FaStore className="theme-card-icon" style={{ color: 'var(--accent-light)' }} />
                <div>
                  <h4>Banner Height</h4>
                  <p>Adjust the height of the customer homepage festive banner</p>
                </div>
              </div>
              <div className="font-size-control">
                <span className="font-label-small" style={{ fontSize: '12px' }}>Short</span>
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="10"
                  value={settings.bannerHeight || 380}
                  onChange={(e) => updateSettingLive('bannerHeight', Number(e.target.value))}
                  className="font-slider"
                />
                <span className="font-label-large" style={{ fontSize: '18px' }}>Tall</span>
                <span className="font-size-value">{settings.bannerHeight || 380}px</span>
              </div>
            </div>

            {/* Footer Size Adjust */}
            <div className="theme-card">
              <div className="theme-card-header">
                <FaLayerGroup className="theme-card-icon" />
                <div>
                  <h4>Footer Size</h4>
                  <p>Adjust the vertical padding of the footer across pages</p>
                </div>
              </div>
              <div className="font-size-control">
                <span className="font-label-small" style={{ fontSize: '12px' }}>Compact</span>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="4"
                  value={settings.footerSize || 40}
                  onChange={(e) => updateSettingLive('footerSize', Number(e.target.value))}
                  className="font-slider"
                />
                <span className="font-label-large" style={{ fontSize: '18px' }}>Spacious</span>
                <span className="font-size-value">{settings.footerSize || 40}px</span>
              </div>
            </div>

            {/* Background Color */}
            <div className="theme-card">
              <div className="theme-card-header">
                <FaPaintBrush className="theme-card-icon" />
                <div>
                  <h4>Background Color</h4>
                  <p>Change the background color of the entire site</p>
                </div>
              </div>
              <div className="bg-color-control">
                <div className="color-picker-wrap">
                  <input
                    type="color"
                    value={settings.bgColor || '#0a0a1a'}
                    onChange={(e) => updateSettingLive('bgColor', e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-hex">{settings.bgColor || '#0a0a1a'}</span>
                </div>
                <div className="bg-presets">
                  <p className="preset-label">Quick Presets:</p>
                  <div className="preset-grid">
                    {bgPresets.map((preset) => (
                      <button
                        key={preset.value}
                        className={`preset-btn ${(settings.bgColor || '#0a0a1a') === preset.value ? 'active' : ''}`}
                        onClick={() => updateSettingLive('bgColor', preset.value)}
                        title={preset.label}
                      >
                        <span className="preset-swatch" style={{ background: preset.value }} />
                        <span className="preset-name">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="dev-content">
          <div className="categories-section">
            <h3><FaLayerGroup /> Category Visibility</h3>
            <p className="settings-note">Check/uncheck to show or hide categories on Customer & Admin pages</p>
            <div className="categories-grid">
              {activeCategories.map((cat) => {
                const isVisible = (settings.visibleCategories || activeCategories).includes(cat);
                const catProducts = products.filter((p) => p.category === cat);
                return (
                  <div key={cat} className={`category-toggle-card ${isVisible ? 'visible' : 'hidden'}`}>
                    <label className="category-toggle-label">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleCategory(cat)}
                        className="category-checkbox"
                      />
                      <div className="category-toggle-info">
                        <span className="category-toggle-name">{cat}</span>
                        <span className="category-toggle-count">{catProducts.length} products</span>
                      </div>
                        <span className={`category-status ${isVisible ? 'status-on' : 'status-off'}`}>
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </label>
                      <button className="btn-dev" onClick={() => handleDeleteCategory(cat)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                        <FaTrash />
                      </button>
                    </div>
                );
              })}
            </div>
            <div className="categories-summary">
              <p>✅ <strong>{(settings.visibleCategories || activeCategories).length}</strong> of {activeCategories.length} categories visible</p>
              <div className="categories-actions">
                <button className="btn-dev btn-show-all" onClick={() => { const ns = { ...settings, visibleCategories: [...activeCategories] }; setSettings(ns); saveSettings(ns); showToast('All categories enabled ✅'); }}>Show All</button>
                <button className="btn-dev btn-hide-all" onClick={() => { const ns = { ...settings, visibleCategories: [] }; setSettings(ns); saveSettings(ns); showToast('All categories hidden 🚫'); }}>Hide All</button>
              </div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>✨ Add New Category</h4>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px' }}>
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Gift Boxes" style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }} />
                <button type="submit" className="btn-dev btn-add-new" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaPlus /> Add Category</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Navbar & Footer Tab */}
      {activeTab === 'navigation' && (
        <div className="dev-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Size Adjustments Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Navbar Size Adjust */}
            <div className="theme-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div className="theme-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FaStore className="theme-card-icon" style={{ color: 'var(--primary)', fontSize: '20px' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Navbar Height</h4>
                  <p className="settings-note" style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Adjust the height of the navigation bar across all pages</p>
                </div>
              </div>
              <div className="font-size-control" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-label-small" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thin</span>
                <input
                  type="range"
                  min="48"
                  max="120"
                  step="4"
                  value={settings.navbarSize || 64}
                  onChange={(e) => updateSettingLive('navbarSize', Number(e.target.value))}
                  className="font-slider"
                  style={{ flex: 1 }}
                />
                <span className="font-label-large" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thick</span>
                <span className="font-size-value" style={{ fontWeight: 'bold', minWidth: '45px', textAlign: 'right', fontSize: '13px' }}>{settings.navbarSize || 64}px</span>
              </div>
            </div>

            {/* Footer Size Adjust */}
            <div className="theme-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <div className="theme-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FaLayerGroup className="theme-card-icon" style={{ color: 'var(--accent-light)', fontSize: '20px' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>Footer Size (Padding)</h4>
                  <p className="settings-note" style={{ margin: '2px 0 0 0', fontSize: '12px' }}>Adjust the vertical padding of the footer across pages</p>
                </div>
              </div>
              <div className="font-size-control" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-label-small" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Compact</span>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="4"
                  value={settings.footerSize || 40}
                  onChange={(e) => updateSettingLive('footerSize', Number(e.target.value))}
                  className="font-slider"
                  style={{ flex: 1 }}
                />
                <span className="font-label-large" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Spacious</span>
                <span className="font-size-value" style={{ fontWeight: 'bold', minWidth: '45px', textAlign: 'right', fontSize: '13px' }}>{settings.footerSize || 40}px</span>
              </div>
            </div>
          </div>

          {/* Footer Controls & Quick Links */}
          <div className="settings-form" style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', marginBottom: '8px' }}>
              <FaLayerGroup /> Footer Settings & Column Layout
            </h3>
            <p className="settings-note">Configure what content blocks and links are rendered in the site footer.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', marginBottom: '24px' }}>
              {[
                { key: 'showFooterBrand', label: 'Show Brand Info' },
                { key: 'showFooterContact', label: 'Show Contact details' },
                { key: 'showFooterCategories', label: 'Show Categories list' },
                { key: 'showFooterLinks', label: 'Show Quick Links' },
              ].map((toggle) => (
                <div key={toggle.key} className="setting-item setting-toggle">
                  <label>{toggle.label}</label>
                  <button
                    className={`toggle-btn ${settings[toggle.key] !== false ? 'on' : 'off'}`}
                    onClick={() => updateSettingLive(toggle.key, settings[toggle.key] !== false ? false : true)}
                  >
                    {settings[toggle.key] !== false ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Custom Links CRUD */}
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-primary)' }}>🔗 Footer Quick Links (CRUD)</h4>
            <p className="settings-note" style={{ marginBottom: '16px' }}>Configure custom links for the Quick Links column in the footer.</p>
            
            <div className="dev-table-wrap" style={{ marginBottom: '20px' }}>
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Path / URL</th>
                    <th>Icon or Emoji</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.footerLinks || [
                    { id: '1', label: 'About Us', path: '#about', icon: 'FaInfoCircle' },
                    { id: '2', label: 'Privacy & Terms', path: '#privacy', icon: 'FaFileContract' }
                  ]).map((link) => (
                    <tr key={link.id}>
                      <td>
                        <input
                          className="edit-input"
                          value={link.label}
                          onChange={(e) => updateFooterLink(link.id, { label: e.target.value })}
                          style={{ minWidth: '120px' }}
                        />
                      </td>
                      <td>
                        <input
                          className="edit-input"
                          value={link.path}
                          onChange={(e) => updateFooterLink(link.id, { path: e.target.value })}
                          style={{ minWidth: '150px' }}
                        />
                      </td>
                      <td>
                        <input
                          className="edit-input"
                          value={link.icon}
                          onChange={(e) => updateFooterLink(link.id, { icon: e.target.value })}
                          placeholder="e.g. FaLink or Emoji 🔗"
                          style={{ minWidth: '100px' }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn-icon btn-del"
                          onClick={() => deleteFooterLink(link.id)}
                          title="Delete link"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Add Footer Link Form */}
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>✨ Add New Footer Link</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Label</label>
                  <input
                    type="text"
                    id="new-foot-label"
                    placeholder="e.g. Terms of Use"
                    className="edit-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Path</label>
                  <input
                    type="text"
                    id="new-foot-path"
                    placeholder="e.g. #terms"
                    className="edit-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Icon / Emoji</label>
                  <input
                    type="text"
                    id="new-foot-icon"
                    placeholder="e.g. FaFileContract or 📄"
                    className="edit-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <button
                  type="button"
                  className="btn-dev btn-add-new"
                  style={{ height: '38px', padding: '0 16px', display: 'flex', justifyContent: 'center' }}
                  onClick={() => {
                    const labelInput = document.getElementById('new-foot-label');
                    const pathInput = document.getElementById('new-foot-path');
                    const iconInput = document.getElementById('new-foot-icon');
                    if (!labelInput.value || !pathInput.value) {
                      showToast('Label and Path are required!', 'error');
                      return;
                    }
                    addFooterLink({
                      label: labelInput.value,
                      path: pathInput.value,
                      icon: iconInput.value || 'FaLink'
                    });
                    labelInput.value = '';
                    pathInput.value = '';
                    iconInput.value = '';
                  }}
                >
                  <FaPlus /> Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Accounts Tab */}
      {activeTab === 'users' && (
        <div className="dev-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="settings-form" style={{ background: 'var(--bg-card)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-light)', marginBottom: '8px' }}>
              <FaUser /> User Accounts Management
            </h3>
            <p className="settings-note">View, edit, or delete usernames and passwords for all roles (Customer, Admin, Developer).</p>

            <div className="dev-table-wrap" style={{ marginBottom: '24px' }}>
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = JSON.parse(localStorage.getItem('crackers_current_user') || '{}').username?.toLowerCase() === u.username.toLowerCase();
                    return (
                      <tr key={u.username} className={editingUserId === u.username ? 'editing-row' : ''}>
                        <td>
                          <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {u.username}
                            {isSelf && <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>You</span>}
                          </span>
                        </td>
                        <td>
                          {editingUserId === u.username ? (
                            <input
                              className="edit-input"
                              value={userEditForm.password}
                              onChange={(e) => setUserEditForm({ ...userEditForm, password: e.target.value })}
                              style={{ maxWidth: '200px' }}
                            />
                          ) : (
                            <span style={{ fontFamily: 'monospace' }}>{u.password}</span>
                          )}
                        </td>
                        <td>
                          {editingUserId === u.username ? (
                            <select
                              className="edit-input"
                              value={userEditForm.role}
                              onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value })}
                              style={{ maxWidth: '150px' }}
                            >
                              <option value="customer">customer</option>
                              <option value="admin">admin</option>
                              <option value="developer">developer</option>
                            </select>
                          ) : (
                            <span className="td-cat" style={{ background: u.role === 'developer' ? 'rgba(124, 58, 237, 0.15)' : u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', color: u.role === 'developer' ? 'var(--accent-light)' : u.role === 'admin' ? 'var(--danger)' : 'var(--success)' }}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="td-actions">
                          {editingUserId === u.username ? (
                            <>
                              <button className="btn-icon btn-save" onClick={saveEditUser} title="Save"><FaSave /></button>
                              <button className="btn-icon btn-cancel" onClick={cancelEditUser} title="Cancel"><FaTimes /></button>
                            </>
                          ) : (
                            <>
                              <button className="btn-icon btn-edit" onClick={() => startEditUser(u)} title="Edit Password / Role"><FaEdit /></button>
                              <button
                                className="btn-icon btn-del"
                                onClick={() => handleDeleteUser(u.username)}
                                disabled={isSelf}
                                style={isSelf ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                title={isSelf ? "You cannot delete yourself" : "Delete User"}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Add User Form */}
            <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)' }}>✨ Create New User Account</h4>
              <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    className="edit-input"
                    value={userAddForm.username}
                    onChange={(e) => setUserAddForm({ ...userAddForm, username: e.target.value })}
                    style={{ padding: '8px 12px' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Password</label>
                  <input
                    type="text"
                    placeholder="Enter password"
                    className="edit-input"
                    value={userAddForm.password}
                    onChange={(e) => setUserAddForm({ ...userAddForm, password: e.target.value })}
                    style={{ padding: '8px 12px' }}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</label>
                  <select
                    className="edit-input"
                    value={userAddForm.role}
                    onChange={(e) => setUserAddForm({ ...userAddForm, role: e.target.value })}
                    style={{ padding: '8px 12px', height: '37px' }}
                  >
                    <option value="customer">Customer 🛒</option>
                    <option value="admin">Administrator 🛡️</option>
                    <option value="developer">Developer ⚙️</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-dev btn-add-new"
                  style={{ height: '37px', padding: '0 16px', display: 'flex', justifyContent: 'center' }}
                >
                  <FaPlus /> Add User
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3><FaPlus /> Add New Product</h3><button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button></div>
            <div style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
              <AddProductForm 
                categories={activeCategories} 
                settings={settings} 
                onAdd={handleAdd} 
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default DeveloperPage;
