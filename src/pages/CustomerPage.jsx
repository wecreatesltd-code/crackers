import { useState, useEffect } from 'react';
import defaultProducts from '../data/products.json';
import defaultSettings from '../data/settings.json';
import { FaStar, FaShoppingCart, FaSearch, FaFire, FaPhone, FaEnvelope, FaMapMarkerAlt, FaLink, FaHome, FaUserShield, FaCode, FaInfoCircle, FaFileContract, FaQuestionCircle, FaShoppingBag, FaStore, FaList, FaThLarge, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import './CustomerPage.css';

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

const DEFAULT_CATEGORIES = ['Sparklers', 'Ground', 'Aerial', 'Loud', 'Fountain', 'Novelty'];

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

function renderProductImage(image, type) {
  if (image && (image.startsWith('http') || image.startsWith('data:image') || image.startsWith('/'))) {
    const sizeStyle = type === 'featured'
      ? { width: '80px', height: '80px', margin: '0 auto 12px', borderRadius: '8px', objectFit: 'cover', display: 'block' }
      : type === 'list'
        ? { width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', display: 'block' }
        : { width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', display: 'block' };
    return <img src={image} alt="Product" style={sizeStyle} />;
  }

  const emojiStyle = type === 'featured' ? { fontSize: '48px', display: 'block', marginBottom: '12px' } : {};
  return <span style={emojiStyle}>{image || '🎆'}</span>;
}

function CustomerPage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = () => {
    setProducts(getProducts());
    setSettings(getSettings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('store-updated', loadData);
    return () => window.removeEventListener('store-updated', loadData);
  }, []);

  // Only show categories enabled by developer
  const activeCategories = settings.categories || DEFAULT_CATEGORIES;
  const visibleCats = settings.visibleCategories || activeCategories;
  const activeCats = activeCategories.filter((c) => visibleCats.includes(c));

  // Price range boundaries
  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-50', label: 'Under ₹50', min: 0, max: 50 },
    { value: '50-100', label: '₹50 - ₹100', min: 50, max: 100 },
    { value: '100-250', label: '₹100 - ₹250', min: 100, max: 250 },
    { value: '250-500', label: '₹250 - ₹500', min: 250, max: 500 },
    { value: '500-1000', label: '₹500 - ₹1000', min: 500, max: 1000 },
    { value: '1000+', label: 'Above ₹1000', min: 1000, max: Infinity },
  ];

  // Filter products: must be in a visible category
  const filteredProducts = products.filter((p) => {
    const inVisible = visibleCats.includes(p.category);
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    let matchPrice = true;
    if (priceRange !== 'all') {
      const range = priceRanges.find(r => r.value === priceRange);
      if (range) matchPrice = p.price >= range.min && p.price < range.max;
    }
    return inVisible && matchSearch && matchCategory && matchPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    if (sortBy === 'name-za') return b.name.localeCompare(a.name);
    return 0;
  });

  const featuredProducts = products.filter((p) => p.featured && visibleCats.includes(p.category));

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === product.id);
      if (exists) {
        if (settings.enableStock !== false && exists.qty >= product.stock) {
          alert('Cannot add more than available stock');
          return prev;
        }
        return prev.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleCheckout = () => {
    if (settings.minOrder && cartTotal < settings.minOrder) {
      alert(`Minimum order is ₹${settings.minOrder}`);
      return;
    }

    const method = settings.bookingMethod || 'whatsapp';
    const orderData = { id: Date.now(), items: cart, total: cartTotal, date: new Date().toISOString() };

    if (method === 'whatsapp') {
      let text = `*New Order* %0A`;
      cart.forEach(item => { text += `${item.name} x ${item.qty} = ₹${item.price * item.qty} %0A`; });
      text += `%0ATotal: ₹${cartTotal}`;
      const phone = settings.contactPhone || '919999999999';
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
      setCart([]);
      setShowCart(false);
      alert('Order sent via WhatsApp!');
    } else if (method === 'local') {
      const orders = JSON.parse(localStorage.getItem('crackers_orders') || '[]');
      orders.push(orderData);
      localStorage.setItem('crackers_orders', JSON.stringify(orders));
      setCart([]);
      setShowCart(false);
      alert('Order placed successfully (Saved locally)!');
    } else if (method === 'db') {
      fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })
        .then(() => { setCart([]); setShowCart(false); alert('Order placed successfully (Saved to DB)!'); })
        .catch((e) => { console.error(e); alert('Failed to place order in DB. Continuing with local.'); });
    }
  };

  const renderQuantityControl = (product, showTotal = true) => {
    const cartItem = cart.find(c => c.id === product.id);
    const qty = cartItem ? cartItem.qty : 0;
    const total = qty * product.price;

    return (
      <div className="qty-control-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: '110px' }}>
        <div className="qty-selector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '4px 8px' }}>
          <button
            onClick={() => {
              if (qty === 1) removeFromCart(product.id);
              else if (qty > 1) setCart(prev => prev.map(c => c.id === product.id ? { ...c, qty: c.qty - 1 } : c));
            }}
            disabled={qty === 0}
            style={{ background: 'transparent', border: 'none', color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: qty === 0 ? 'not-allowed' : 'pointer', padding: '4px 12px', fontSize: '18px', fontWeight: 'bold' }}
          >-</button>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>{qty}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={settings.enableStock !== false && (product.stock === 0 || qty >= product.stock)}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px 12px', fontSize: '18px', fontWeight: 'bold' }}
          >+</button>
        </div>
        {showTotal && qty > 0 && (
          <div className="qty-total" style={{ fontSize: '13px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Total: <strong style={{ color: 'var(--primary)' }}>₹{total}</strong>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="customer-page">
      {settings.showBanner && (
        <section className="hero-banner" style={{ minHeight: `${settings.bannerHeight || 380}px`, padding: `${(settings.bannerHeight || 380) * 0.15}px 24px` }}>
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s`,
              }} />
            ))}
          </div>
          <div className="hero-content">
            <h1 className="hero-title">{settings.siteName || 'Sri Murugan Crackers'}</h1>
            <p className="hero-tagline">{settings.tagline}</p>
            <div className="hero-sale-badge"><FaFire /> {settings.bannerText}</div>
            <p className="hero-delivery">{settings.deliveryNote}</p>
          </div>
        </section>
      )}

      <section className="filter-section">
        <div className="filter-inner">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search crackers..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: showFilters ? 'var(--primary)' : 'transparent', color: showFilters ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
            <FaFilter /> Filters {(priceRange !== 'all' || sortBy !== 'default') && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>!</span>}
          </button>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><FaList /> Table</button>
            <button className={`view-btn ${viewMode === 'card' ? 'active' : ''}`} onClick={() => setViewMode('card')}><FaThLarge /> Card</button>
          </div>
        </div>
        {showFilters && (
          <div className="filter-expanded" style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 24px 0', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {settings.enableCategories !== false && (
              <div className="category-tabs">
                <button className={`cat-tab ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>All</button>
                {activeCats.map((cat) => (
                  <button key={cat} className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                ))}
              </div>
            )}
            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              {priceRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="name-az">Name: A → Z</option>
              <option value="name-za">Name: Z → A</option>
            </select>
            {(priceRange !== 'all' || sortBy !== 'default' || selectedCategory !== 'All') && (
              <button onClick={() => { setPriceRange('all'); setSortBy('default'); setSelectedCategory('All'); }} style={{ padding: '6px 14px', background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 'var(--radius-full)', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Clear All</button>
            )}
          </div>
        )}
      </section>

      {selectedCategory === 'All' && !search && featuredProducts.length > 0 && (
        <section className="section featured-section">
          <h2 className="section-title"><FaFire className="title-icon" /> Featured Products</h2>
          <div className="featured-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="featured-card">
                <div className="featured-badge">⭐ Featured</div>
                <div className="product-emoji" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80px' }}>
                  {renderProductImage(product.image, 'featured')}
                </div>
                <h3>{product.name}</h3>
                {settings.enableCategories !== false && <p className="product-category">{product.category}</p>}
                {settings.enableReview !== false && <div className="product-rating"><FaStar /> {product.rating}</div>}
                <div className="product-price">₹{product.price}</div>
                {renderQuantityControl(product)}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section products-section">
        <h2 className="section-title">
          {selectedCategory === 'All' ? '🎆 All Products' : `${selectedCategory} Crackers`}
          <span className="product-count">{filteredProducts.length} items</span>
        </h2>
        {filteredProducts.length === 0 ? (
          <div className="empty-state"><span className="empty-icon">🔍</span><p>No products found</p></div>
        ) : viewMode === 'table' ? (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Name</th>
                  <th>Price</th>
                  {settings.enableStock !== false && <th>Stock</th>}
                  <th>Action</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="td-img">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px' }}>
                        {renderProductImage(product.image, 'list')}
                      </div>
                    </td>
                    <td className="td-name">
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>{product.name}</div>
                      {product.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{product.description}</div>}
                    </td>
                    <td className="td-price">₹{product.price}</td>
                    {settings.enableStock !== false && <td><span className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span></td>}
                    <td>
                      {renderQuantityControl(product, false)}
                    </td>
                    <td className="td-price" style={{ minWidth: '80px' }}>
                      {cart.find(c => c.id === product.id)?.qty > 0 ? `₹${cart.find(c => c.id === product.id).qty * product.price}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-emoji-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px' }}>
                  {renderProductImage(product.image, 'list')}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-meta">
                    {settings.enableCategories !== false && <span className="product-category-tag">{product.category}</span>}
                    {settings.enableReview !== false && <span className="product-rating-sm"><FaStar /> {product.rating}</span>}
                  </div>
                  <div className="product-bottom">
                    <span className="product-price-lg">₹{product.price}</span>
                    {settings.enableStock !== false && (
                      <span className="product-stock">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                    )}
                  </div>
                  {renderQuantityControl(product)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="cart-fab" onClick={() => setShowCart(!showCart)}>
        <FaShoppingCart />{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>

      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header"><h3>🛒 Your Cart</h3><button className="cart-close" onClick={() => setShowCart(false)}>✕</button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><span>🛒</span><p>Cart is empty</p></div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item" style={{ flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <span className="cart-item-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', flexShrink: 0 }}>
                          {renderProductImage(item.image, 'cart')}
                        </span>
                        <div className="cart-item-info" style={{ flex: 1 }}>
                          <span className="cart-item-name">{item.name}</span>
                          <span className="cart-item-price">₹{item.price} each</span>
                        </div>
                        <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingLeft: '52px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <button
                            onClick={() => {
                              if (item.qty === 1) removeFromCart(item.id);
                              else setCart(prev => prev.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c));
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px 12px', fontSize: '16px', fontWeight: 'bold' }}
                          >−</button>
                          <span style={{ fontWeight: '700', fontSize: '14px', minWidth: '28px', textAlign: 'center' }}>{item.qty}</span>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={settings.enableStock !== false && item.qty >= item.stock}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px 12px', fontSize: '16px', fontWeight: 'bold' }}
                          >+</button>
                        </div>
                        <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '15px' }}>₹{item.price * item.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  {settings.minOrder && cartTotal < settings.minOrder && <p className="cart-min-warning">⚠️ Min order: ₹{settings.minOrder}</p>}
                  <div className="cart-total"><span>Total</span><span className="cart-total-amount">₹{cartTotal}</span></div>
                  <button className="btn-checkout" onClick={handleCheckout}>Checkout</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="customer-footer" style={{ '--footer-size': `${settings.footerSize || 40}px` }}>
        <div className="footer-inner">
          {settings.showFooterBrand !== false && (
            <div className="footer-brand">
              {settings.logo ? (
                <img src={settings.logo} alt="Footer Logo" style={{ maxHeight: '50px', marginBottom: '12px', objectFit: 'contain', display: 'block' }} />
              ) : (
                <span className="footer-logo">🎆</span>
              )}
              <h3>{settings.siteName}</h3>
              <p>{settings.tagline}</p>
            </div>
          )}

          {settings.showFooterContact !== false && (
            <div className="footer-contact">
              <h4>Contact Us</h4>
              {settings.contactPhone && <p><FaPhone /> {settings.contactPhone}</p>}
              {settings.contactEmail && <p><FaEnvelope /> {settings.contactEmail}</p>}
              {settings.address && <p><FaMapMarkerAlt /> {settings.address}</p>}
            </div>
          )}

          {settings.showFooterCategories !== false && (
            <div className="footer-categories">
              <h4>Categories</h4>
              {activeCats.map((cat) => (
                <p key={cat} className="footer-cat-link" onClick={() => setSelectedCategory(cat)}>{cat}</p>
              ))}
            </div>
          )}

          {settings.showFooterLinks !== false && settings.footerLinks && settings.footerLinks.length > 0 && (
            <div className="footer-categories">
              <h4>Quick Links</h4>
              {settings.footerLinks.map((link) => (
                <p key={link.id} className="footer-cat-link">
                  <a href={link.path} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'inherit' }}>
                    {getIcon(link.icon || 'FaLink')}
                    <span>{link.label}</span>
                  </a>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="footer-bottom"><p>© 2024 {settings.siteName}. Made by &nbsp;
          <a href="https://www.wecreates.ltd" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "Arial", fontSize: "14px", color: "inherit" }}>
            <h2 style={{ color: "var(--primary-dark)" }}>wecreates.ltd</h2>
          </a>
          <h4>📞 +91 8015223596  | 📧 wecreates.ltd@gmail.com</h4></p>
        </div>
      </footer>
    </div>
  );
}

export default CustomerPage;
