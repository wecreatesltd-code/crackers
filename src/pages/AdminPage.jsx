import { useState, useEffect } from 'react';
import defaultProducts from '../data/products.json';
import defaultSettings from '../data/settings.json';
import defaultUsers from '../data/users.json';
import { FaPlus, FaTrash, FaBox, FaChartBar, FaEye, FaUpload, FaLink, FaSmile } from 'react-icons/fa';
import AddProductForm from '../components/AddProductForm';
import './AdminPage.css';

const getProducts = () => {
  const data = localStorage.getItem('crackers_db');
  if (!data) {
    localStorage.setItem('crackers_db', JSON.stringify(defaultProducts));
    return [...defaultProducts];
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

const addProduct = (product) => {
  const products = getProducts();
  const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { ...product, id: newId };
  products.push(newProduct);
  localStorage.setItem('crackers_db', JSON.stringify(products));
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ products });
  return newProduct;
};

const deleteProduct = (id) => {
  const products = getProducts().filter((p) => p.id !== id);
  localStorage.setItem('crackers_db', JSON.stringify(products));
  window.dispatchEvent(new Event('store-updated'));
  syncWithServer({ products });
};

const DEFAULT_CATEGORIES = ['Sparklers', 'Ground', 'Aerial', 'Loud', 'Fountain', 'Novelty'];

function renderProductImage(image) {
  if (image && (image.startsWith('http') || image.startsWith('data:image') || image.startsWith('/'))) {
    return <img src={image} alt="Product" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px' }} />;
  }
  return <span style={{ fontSize: '24px' }}>{image || '🎆'}</span>;
}

function AdminPage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('view');
  const [toast, setToast] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  const loadData = () => {
    setProducts(getProducts());
    setSettings(getSettings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('store-updated', loadData);
    return () => window.removeEventListener('store-updated', loadData);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Only show categories enabled by developer
  const activeCategories = settings.categories || DEFAULT_CATEGORIES;
  const visibleCats = settings.visibleCategories || activeCategories;
  const activeCats = activeCategories.filter((c) => visibleCats.includes(c));

  // Filter products to only visible categories
  const visibleProducts = products.filter((p) => visibleCats.includes(p.category));

  const handleAdd = (product) => {
    addProduct(product);
    showToast('Product added! ✅');
    setActiveTab('view');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const cat = newCategory.trim();
    if (activeCategories.includes(cat)) return showToast('Category already exists!', 'error');
    const updated = [...activeCategories, cat];
    const ns = { ...settings, categories: updated, visibleCategories: [...(settings.visibleCategories || activeCategories), cat] };
    setSettings(ns);
    localStorage.setItem('crackers_settings', JSON.stringify(ns));
    window.dispatchEvent(new Event('store-updated'));
    syncWithServer({ settings: ns });
    setNewCategory('');
    showToast(`Category "${cat}" added successfully! ✅`);
  };

  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Are you sure you want to delete the category "${cat}"?`)) {
      const updated = activeCategories.filter(c => c !== cat);
      const updatedVisible = (settings.visibleCategories || activeCategories).filter(c => c !== cat);
      const ns = { ...settings, categories: updated, visibleCategories: updatedVisible };
      setSettings(ns);
      localStorage.setItem('crackers_settings', JSON.stringify(ns));
      window.dispatchEvent(new Event('store-updated'));
      syncWithServer({ settings: ns });
      showToast(`Category "${cat}" deleted! 🗑️`);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteProduct(id);
      showToast(`"${name}" deleted 🗑️`);
    }
  };

  const totalValue = visibleProducts.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" style={{ maxHeight: '40px', objectFit: 'contain' }} />
          ) : (
            <FaBox />
          )}
          <span>{settings.siteName || 'Admin Panel'} — Admin</span>
        </h1>
        <p>Manage your crackers inventory</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card"><span className="stat-value">{visibleProducts.length}</span><span className="stat-label">Products</span></div>
        {settings.enableCategories !== false && (
          <div className="stat-card"><span className="stat-value">{activeCats.length}</span><span className="stat-label">Categories</span></div>
        )}
        {settings.enableStock !== false && (
          <>
            <div className="stat-card"><span className="stat-value">{visibleProducts.reduce((s, p) => s + p.stock, 0)}</span><span className="stat-label">Total Stock</span></div>
            <div className="stat-card"><span className="stat-value">₹{totalValue.toLocaleString()}</span><span className="stat-label">Inventory Value</span></div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}><FaEye /> View Products</button>
        <button className={`admin-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}><FaPlus /> Add Product</button>
        <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><FaChartBar /> Statistics</button>
        <button className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}><FaBox /> Categories</button>
      </div>

      {/* View Products */}
      {activeTab === 'view' && (
        <div className="admin-content">
          {visibleProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button 
                className="btn-delete" 
                onClick={() => {
                  if(window.confirm('Are you sure you want to delete ALL products? This action cannot be undone.')) {
                    localStorage.setItem('crackers_db', JSON.stringify([]));
                    window.dispatchEvent(new Event('store-updated'));
                  }
                }} 
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <FaTrash /> Delete All Products
              </button>
            </div>
          )}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Icon / Image</th><th>Name</th>{settings.enableCategories !== false && <th>Category</th>}<th>Price</th>{settings.enableStock !== false && <th>Stock</th>}<th>Rating</th><th>Featured</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="td-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                      {renderProductImage(p.image)}
                    </td>
                    <td className="td-name">{p.name}</td>
                    {settings.enableCategories !== false && <td><span className="td-category">{p.category}</span></td>}
                    <td className="td-price">₹{p.price}</td>
                    {settings.enableStock !== false && <td>{p.stock}</td>}
                    <td className="td-rating">⭐ {p.rating}</td>
                    <td>{p.featured ? '✅' : '—'}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDelete(p.id, p.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product */}
      {activeTab === 'add' && (
        <div className="admin-content">
          <AddProductForm 
            categories={activeCats} 
            settings={settings} 
            onAdd={handleAdd} 
          />
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <div className="admin-content">
          <div className="stats-grid">
            {activeCats.map((cat) => {
              const catProducts = visibleProducts.filter((p) => p.category === cat);
              return (
                <div key={cat} className="stats-card">
                  <h3>{cat}</h3>
                  <div className="stats-info">
                    <p><strong>{catProducts.length}</strong> products</p>
                    {settings.enableStock !== false && (
                      <p><strong>{catProducts.reduce((s, p) => s + p.stock, 0)}</strong> stock</p>
                    )}
                    <p><strong>₹{catProducts.reduce((s, p) => s + p.price, 0)}</strong> total price</p>
                  </div>
                  <div className="stats-bar">
                    <div className="stats-bar-fill" style={{ width: `${visibleProducts.length > 0 ? (catProducts.length / visibleProducts.length) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast */}
      {/* Categories */}
      {activeTab === 'categories' && (
        <div className="admin-content">
          <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FaPlus /> Add New Category</h4>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px' }}>
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Gift Boxes" style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }} />
              <button type="submit" className="btn-submit" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaPlus /> Add</button>
            </form>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Category Name</th><th>Products Count</th><th>Action</th></tr>
              </thead>
              <tbody>
                {activeCategories.map((cat) => {
                  const catProducts = products.filter((p) => p.category === cat);
                  return (
                    <tr key={cat}>
                      <td className="td-name"><strong>{cat}</strong></td>
                      <td>{catProducts.length}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDeleteCategory(cat)} style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaTrash /> Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default AdminPage;
