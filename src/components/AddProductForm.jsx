import React, { useState } from 'react';
import { FaPlus, FaUpload, FaLink } from 'react-icons/fa';

function AddProductForm({ categories, settings, onAdd, onCancel }) {
  const [imageType, setImageType] = useState('upload');
  const [form, setForm] = useState({ name: '', category: categories[0] || 'Sparklers', price: '', stock: '', image: '', description: '', rating: 4.0, featured: false });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        alert('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return alert('Fill name & price!');
    onAdd({ ...form, price: Number(form.price), stock: Number(form.stock), rating: Number(form.rating) });
    setForm({ name: '', category: categories[0] || 'Sparklers', price: '', stock: '', image: '', description: '', rating: 4.0, featured: false });
    setImageType('upload');
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Choose Image Method</label>
        <div className="image-type-selector" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button type="button" className={`btn-type-selector ${imageType === 'upload' ? 'active' : ''}`} onClick={() => { setImageType('upload'); setForm({ ...form, image: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: imageType === 'upload' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}><FaUpload /> Upload Image</button>
          <button type="button" className={`btn-type-selector ${imageType === 'url' ? 'active' : ''}`} onClick={() => { setImageType('url'); setForm({ ...form, image: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: imageType === 'url' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}><FaLink /> Image URL</button>
        </div>

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

      <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}><label>Product Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sky Rocket" /></div>
        {settings?.enableCategories !== false && (
          <div className="form-group" style={{ flex: 1 }}><label>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
        )}
      </div>
      
      <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}><label>Price (₹) *</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150" /></div>
        {settings?.enableStock !== false && (
          <div className="form-group" style={{ flex: 1 }}><label>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="100" /></div>
        )}
        <div className="form-group" style={{ flex: 1 }}><label>Rating</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
      </div>
      
      <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the product..." rows={3} /></div>
      
      <div className="form-group form-check">
        <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured Product</label>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button type="submit" className="btn-submit" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}><FaPlus /> Add Product</button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '0 24px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default AddProductForm;
