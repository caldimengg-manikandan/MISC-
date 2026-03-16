import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, RefreshCw, Layers, CheckCircle, XCircle } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const CATEGORIES = [
  { value: 'stair_type',     label: 'Stair Types' },
  { value: 'grating_type',   label: 'Grating Tread Types' },
  { value: 'stringer_size',  label: 'Stringer Sizes' },
  { value: 'finish_option',  label: 'Finish Options' },
  { value: 'connection_type',label: 'Connection Types' },
  { value: 'platform_type',  label: 'Platform Types' },
  { value: 'mounting_type',  label: 'Mounting Types' }
];

export default function DictionaryManager() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('stair_type');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form, setForm] = useState({
    category: 'stair_type', label: '', value: '', description: '', order: 0, isActive: true
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/dictionary/all/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (e) {
      toast.error('Failed to load dictionary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setForm(entry);
    } else {
      setEditingEntry(null);
      setForm({
        category: activeCategory, label: '', value: '', description: '', order: entries.filter(e => e.category === activeCategory).length + 1, isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('steel_token');
      const method = editingEntry ? 'PUT' : 'POST';
      const url = editingEntry 
        ? `${API_BASE_URL}/api/dictionary/${editingEntry._id}`
        : `${API_BASE_URL}/api/dictionary`;

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingEntry ? 'Entry updated' : 'Entry added');
        setIsModalOpen(false);
        fetchEntries();
      } else {
        toast.error(data.message || 'Save failed');
      }
    } catch (e) {
      toast.error('Error connecting to server');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this option?')) return;
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/dictionary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if ((await res.json()).success) {
        toast.success('Entry deleted');
        fetchEntries();
      }
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const seedData = async () => {
    if (!window.confirm('This will populate the database with default options. Continue?')) return;
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/dictionary/seed/initial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Seeded ${data.count} entries`);
        fetchEntries();
      }
    } catch (e) {
      toast.error('Seed utility failed');
    }
  };

  const filteredEntries = entries.filter(e => e.category === activeCategory);

  return (
    <div className="fade-in" style={{ padding: '0 20px 40px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dictionary Management</h1>
            <p className="page-subtitle">Configure dropdown options and system-wide lookup values</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="header-btn" onClick={seedData} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <RefreshCw size={16} /> Seed Default Lists
            </button>
            <button className="header-btn header-btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={16} /> Add New Entry
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Sidebar Categories */}
        <div className="eng-card" style={{ height: 'fit-content' }}>
          <div className="eng-card-header">
            <span className="eng-card-title"><Layers size={18} /> Categories</span>
          </div>
          <div className="eng-card-body" style={{ padding: '8px' }}>
            {CATEGORIES.map(cat => (
              <div 
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  fontSize: '13.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: activeCategory === cat.value ? 'var(--color-primary-50)' : 'transparent',
                  color: activeCategory === cat.value ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  fontWeight: activeCategory === cat.value ? 600 : 400,
                  transition: 'all 0.2s'
                }}
              >
                {cat.label}
                <span style={{ fontSize: '11px', opacity: 0.6 }}>
                  {entries.filter(e => e.category === cat.value).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data List */}
        <div className="eng-card">
          <div className="eng-card-header" style={{ background: '#f8fafc' }}>
            <span className="eng-card-title">
              {CATEGORIES.find(c => c.value === activeCategory)?.label} Entry List
            </span>
          </div>
          <div className="eng-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading entries...</div>
            ) : filteredEntries.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No entries found for this category. Click "Add New" to begin.
              </div>
            ) : (
              <table className="eng-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Order</th>
                    <th>Label</th>
                    <th>Technical Value</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => (
                    <tr key={entry._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{entry.order}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{entry.label}</div>
                        {entry.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.description}</div>}
                      </td>
                      <td><code>{entry.value}</code></td>
                      <td>
                        {entry.isActive ? (
                          <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(entry)} className="action-btn" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(entry._id)} className="action-btn" style={{ color: '#ef4444' }} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select" 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Label (Display Text)</label>
                  <input 
                    className="form-input" 
                    value={form.label} 
                    onChange={e => setForm({...form, label: e.target.value})}
                    placeholder="e.g. Pan Plate — Concrete Filled"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Value (Technical Key)</label>
                  <input 
                    className="form-input" 
                    value={form.value} 
                    onChange={e => setForm({...form, value: e.target.value})}
                    placeholder="e.g. pan-concrete"
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Sort Order</label>
                  <input 
                    type="number"
                    className="form-input" 
                    value={form.order} 
                    onChange={e => setForm({...form, order: parseInt(e.target.value)})}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <input 
                    type="checkbox" 
                    id="is-active"
                    checked={form.isActive} 
                    onChange={e => setForm({...form, isActive: e.target.checked})}
                   />
                   <label htmlFor="is-active" style={{ fontSize: '13px' }}>Option is Active</label>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="header-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="header-btn header-btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center;
          justify-content: center; z-index: 1000; backdrop-filter: blur(2px);
        }
        .modal-content {
          background: white; border-radius: var(--radius-lg);
          width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .modal-header {
          padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
        .eng-table { width: 100%; border-collapse: collapse; }
        .eng-table th { 
          padding: 12px 20px; text-align: left; font-size: 11px; 
          text-transform: uppercase; color: #64748b; font-weight: 700;
          border-bottom: 2px solid #f1f5f9;
        }
        .eng-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
        .action-btn {
          padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0;
          background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; }
      `}</style>
    </div>
  );
}
