import { useState, useEffect } from 'react';
import defaultStore from '../data/store.json';
import { FaPlus, FaTrash, FaBox, FaChartBar, FaEye, FaUpload, FaLink, FaSmile } from 'react-icons/fa';
import './AdminPage.css';

const getProducts = () => {
  const data = localStorage.getItem('crackers_db');
  if (!data) {
    localStorage.setItem('crackers_db', JSON.stringify(defaultStore.products));
    return [...defaultStore.products];
  }
  return JSON.parse(data);
};

const getSettings = () => {
  const data = localStorage.getItem('crackers_settings');
  if (!data) {
    localStorage.setItem('crackers_settings', JSON.stringify(defaultStore.settings));
    return { ...defaultStore.settings };
  }
  return JSON.parse(data);
};

const syncWithServer = async (updatedFields = {}) => {
  try {
    const products = updatedFields.products || JSON.parse(localStorage.getItem('crackers_db')) || defaultStore.products;
    const settings = updatedFields.settings || JSON.parse(localStorage.getItem('crackers_settings')) || defaultStore.settings;
    const users = updatedFields.users || JSON.parse(localStorage.getItem('crackers_users')) || defaultStore.users;
    
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

const CATEGORIES = ['Sparklers', 'Ground', 'Aerial', 'Loud', 'Fountain', 'Novelty'];

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
  const [imageType, setImageType] = useState('emoji'); // 'emoji', 'upload', 'url'
  const [form, setForm] = useState({ name: '', category: 'Sparklers', price: '', stock: '', image: '🎆', description: '', rating: 4.0, featured: false });
  const [toast, setToast] = useState(null);

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
  const visibleCats = settings.visibleCategories || CATEGORIES;
  const activeCats = CATEGORIES.filter((c) => visibleCats.includes(c));

  // Filter products to only visible categories
  const visibleProducts = products.filter((p) => visibleCats.includes(p.category));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return showToast('Fill name & price!', 'error');
    addProduct({ ...form, price: Number(form.price), stock: Number(form.stock), rating: Number(form.rating) });
    setForm({ name: '', category: activeCats[0] || 'Sparklers', price: '', stock: '', image: '🎆', description: '', rating: 4.0, featured: false });
    setImageType('emoji');
    showToast('Product added! ✅');
    setActiveTab('view');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteProduct(id);
      showToast(`"${name}" deleted 🗑️`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        showToast('Image must be under 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const totalValue = visibleProducts.reduce((s, p) => s + p.price * p.stock, 0);
  const emojis = ['🎆', '🎇', '🚀', '💥', '🧨', '🌺', '🎡', '⛲', '💨', '⭐', '🦋', '✏️', '🔥', '✨', '🎉'];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><FaBox /> {settings.siteName || 'Admin Panel'} — Admin</h1>
        <p>Manage your crackers inventory</p>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card"><span className="stat-value">{visibleProducts.length}</span><span className="stat-label">Products</span></div>
        <div className="stat-card"><span className="stat-value">{activeCats.length}</span><span className="stat-label">Categories</span></div>
        <div className="stat-card"><span className="stat-value">{visibleProducts.reduce((s, p) => s + p.stock, 0)}</span><span className="stat-label">Total Stock</span></div>
        <div className="stat-card"><span className="stat-value">₹{totalValue.toLocaleString()}</span><span className="stat-label">Inventory Value</span></div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}><FaEye /> View Products</button>
        <button className={`admin-tab ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}><FaPlus /> Add Product</button>
        <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><FaChartBar /> Statistics</button>
      </div>

      {/* View Products */}
      {activeTab === 'view' && (
        <div className="admin-content">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Icon / Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Featured</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="td-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                      {renderProductImage(p.image)}
                    </td>
                    <td className="td-name">{p.name}</td>
                    <td><span className="td-category">{p.category}</span></td>
                    <td className="td-price">₹{p.price}</td>
                    <td>{p.stock}</td>
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
          <form className="add-form" onSubmit={handleAdd}>
            <div className="form-group">
              <label>Choose Image Method</label>
              <div className="image-type-selector" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button type="button" className={`btn-type-selector ${imageType === 'emoji' ? 'active' : ''}`} onClick={() => { setImageType('emoji'); setForm({ ...form, image: '🎆' }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: imageType === 'emoji' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}><FaSmile /> Emoji Icon</button>
                <button type="button" className={`btn-type-selector ${imageType === 'upload' ? 'active' : ''}`} onClick={() => { setImageType('upload'); setForm({ ...form, image: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: imageType === 'upload' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}><FaUpload /> Upload Image</button>
                <button type="button" className={`btn-type-selector ${imageType === 'url' ? 'active' : ''}`} onClick={() => { setImageType('url'); setForm({ ...form, image: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: imageType === 'url' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}><FaLink /> Image URL</button>
              </div>

              {imageType === 'emoji' && (
                <div className="emoji-picker">
                  {emojis.map((e) => (
                    <button type="button" key={e} className={`emoji-btn ${form.image === e ? 'active' : ''}`} onClick={() => setForm({ ...form, image: e })}>{e}</button>
                  ))}
                </div>
              )}

              {imageType === 'upload' && (
                <div className="file-uploader-wrap" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ cursor: 'pointer' }} />
                  {form.image && (
                    <div className="upload-preview" style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              )}

              {imageType === 'url' && (
                <div className="url-uploader-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" placeholder="https://example.com/cracker.jpg" value={form.image.startsWith('data:') ? '' : form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }} />
                  {form.image && !form.image.startsWith('data:') && (
                    <div className="upload-preview" style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '8px' }}>
                      <img src={form.image} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group"><label>Product Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sky Rocket" /></div>
              <div className="form-group"><label>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{activeCats.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150" /></div>
              <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="100" /></div>
              <div className="form-group"><label>Rating</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the product..." rows={3} /></div>
            <div className="form-group form-check">
              <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured Product</label>
            </div>
            <button type="submit" className="btn-submit"><FaPlus /> Add Product</button>
          </form>
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
                    <p><strong>{catProducts.reduce((s, p) => s + p.stock, 0)}</strong> stock</p>
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
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default AdminPage;
