import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

export default function QuickManageModal({ isOpen, onClose, category, categoryLabel, onUpdate, triggerRect, defaultOptions = [] }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [steelLbsLf, setSteelLbsLf] = useState('');
  const [shopLaborMhLf, setShopLaborMhLf] = useState('');
  const [fieldLaborMhLf, setFieldLaborMhLf] = useState('');
  const [description, setDescription] = useState('');

  const hasBenchmarkFields = category && (
    category.toLowerCase().includes('rail_type') || 
    category === 'stair_type' || 
    category === 'platform_type' || 
    category === 'grating_type' ||
    category === 'stringer_size'
  );

  // Calculate position based on triggerRect
  const getModalStyle = () => {
    if (!triggerRect) return {};
    const margin = 10;
    const modalWidth = 900;
    const modalHeight = 500; // Estimated max height
    let left = triggerRect.left;
    let top = triggerRect.bottom + margin;
    if (left + modalWidth > window.innerWidth) left = window.innerWidth - modalWidth - 20;
    if (top + modalHeight > window.innerHeight) top = triggerRect.top - modalHeight - margin;
    left = Math.max(20, left);
    top = Math.max(20, top);
    return { position: 'fixed', top: `${top}px`, left: `${left}px`, margin: 0 };
  };

  const modalStyle = getModalStyle();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/dictionary/${category}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (e) {
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchEntries();
  }, [isOpen]);

  // Merge database entries with defaults if defaults aren't already represented in entries
  const allDisplayEntries = [...entries];
  const dbLabels = new Set(entries.map(e => e.label));
  
  // Only show defaults if database is empty for this category
  // OR optionally: show unique ones. Let's stick to showing defaults if DB is empty for now to match user expectation of "having its existing list"
  const showDefaults = entries.length === 0 && defaultOptions.length > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel) return toast.error('Enter a Display Name');
    
    // Auto-generate value from label
    const autoValue = newLabel.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/dictionary`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          label: newLabel,
          value: autoValue,
          order: entries.length + defaultOptions.length + 1,
          steelLbsLf: hasBenchmarkFields ? parseFloat(steelLbsLf) || 0 : null,
          shopLaborMhLf: hasBenchmarkFields ? parseFloat(shopLaborMhLf) || 0 : null,
          fieldLaborMhLf: hasBenchmarkFields ? parseFloat(fieldLaborMhLf) || 0 : null,
          description: (category === 'platform_type') ? description : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Added successfully');
        setNewLabel('');
        setSteelLbsLf('');
        setShopLaborMhLf('');
        setFieldLaborMhLf('');
        setDescription('');
        fetchEntries();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Error adding option');
      }
    } catch (e) {
      toast.error('Connection error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/dictionary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        fetchEntries();
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-modal-overlay" onClick={onClose}>
      <div className="quick-modal" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="quick-modal-header">
          <h3>Manage {categoryLabel}</h3>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>
        
        <div className="quick-modal-body">
          <form onSubmit={handleAdd} className="quick-add-form">
            <input 
              className="form-input"
              style={{ gridColumn: hasBenchmarkFields ? 'span 3' : 'span 2' }}
              placeholder="Enter New Option (Display Name)"
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)}
              autoFocus
            />
            
            {hasBenchmarkFields && (
              <>
                <input 
                  type="number" step="0.001"
                  placeholder="STEEL (+10% SCRAP) LBS" 
                  value={steelLbsLf} 
                  onChange={e => setSteelLbsLf(e.target.value)}
                  className="form-input"
                  title="Steel Weight with Scrap"
                />
                <input 
                  type="number" step="0.001"
                  placeholder="SHOP HOURS" 
                  value={shopLaborMhLf} 
                  onChange={e => setShopLaborMhLf(e.target.value)}
                  className="form-input"
                  title="Shop Labor (MH/LF)"
                />
                <input 
                  type="number" step="0.001"
                  placeholder="FIELD HOURS" 
                  value={fieldLaborMhLf} 
                  onChange={e => setFieldLaborMhLf(e.target.value)}
                  className="form-input"
                  title="Field Labor (MH/LF)"
                />
                {category === 'platform_type' && (
                  <input 
                    type="number" step="0.001"
                    placeholder="PAN RISER LB/FT" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    className="form-input"
                    title="Pan Riser Weight (LB/FT)"
                  />
                )}
              </>
            )}

            <button type="submit" className="add-btn" style={{ gridColumn: (hasBenchmarkFields && category !== 'platform_type') ? 'span 3' : 'auto' }}>
              <Plus size={16} /> Add {categoryLabel.replace(' Types', '')}
            </button>
          </form>

          <div className="quick-entries-list">
            <div className="list-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: category === 'platform_type' ? '40px 1fr 100px 100px 100px 100px 40px' : '40px 1fr 140px 140px 140px 40px', 
              padding: '0 14px', 
              fontSize: '10px' 
            }}>
              <span>S.No.</span>
              <span>Description</span>
              {hasBenchmarkFields && (
                <>
                  <span style={{ textAlign: 'center' }}>STEEL ({category === 'platform_type' ? 'LBS/SF' : '+10% SCRAP'})</span>
                  <span style={{ textAlign: 'center' }}>SHOP HOURS</span>
                  <span style={{ textAlign: 'center' }}>FIELD HOURS</span>
                  {category === 'platform_type' && <span style={{ textAlign: 'center' }}>PAN RISER</span>}
                </>
              )}
              <span></span>
            </div>
            {loading ? <div className="loading-txt">Loading...</div> : (
              <>
                {entries.map((entry, index) => (
                  <div key={entry.id || entry._id || index} className="quick-entry-item" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: category === 'platform_type' ? '40px 1fr 100px 100px 100px 100px 40px' : '40px 1fr 140px 140px 140px 40px', 
                    fontSize: '12px' 
                  }}>
                    <div className="sno" style={{ opacity: 0.5, fontWeight: 700 }}>{index + 1}.</div>
                    <div className="entry-label" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.label}</div>
                    
                    {hasBenchmarkFields ? (
                      <>
                        <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{parseFloat(entry.steelLbsLf || 0).toFixed(3)}</div>
                        <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{parseFloat(entry.shopLaborMhLf || 0).toFixed(3)}</div>
                        <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{parseFloat(entry.fieldLaborMhLf || 0).toFixed(3)}</div>
                        {category === 'platform_type' && (
                          <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{parseFloat(entry.description || 0).toFixed(3)}</div>
                        )}
                      </>
                    ) : <><div></div><div></div><div></div>{category === 'platform_type' && <div></div>}</>}

                    <button onClick={() => handleDelete(entry.id || entry._id)} className="del-btn" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                {showDefaults && defaultOptions.map((opt, idx) => (
                  <div key={`def-${idx}`} className="quick-entry-item default-item">
                    <div className="entry-info">
                      <span className="entry-label">
                        <span style={{ marginRight: '8px', opacity: 0.4, fontSize: '11px', fontWeight: 600 }}>{entries.length + idx + 1}.</span>
                        {opt}
                      </span>
                      <span className="default-badge" style={{ marginLeft: '12px' }}>System Default</span>
                    </div>
                    <div className="del-placeholder" title="System defaults cannot be deleted. Add as custom to manage.">
                      <Trash2 size={14} style={{ opacity: 0.3 }} />
                    </div>
                  </div>
                ))}

                {entries.length === 0 && defaultOptions.length === 0 && (
                  <div className="empty-txt">No custom options found.</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .quick-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.2); z-index: 2100;
          backdrop-filter: blur(2px);
        }
        .quick-modal {
          background: white; width: 900px; border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          overflow: hidden; animation: modalPop 0.2s ease-out;
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .quick-modal-header {
          padding: 14px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          background: #f8fafc;
        }
        .quick-modal-header h3 { font-size: 15px; font-weight: 700; margin: 0; color: #1e293b; }
        .close-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .close-btn:hover { color: #ef4444; }
        
        .quick-modal-body { padding: 20px; }
        .quick-add-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .quick-add-form .form-input { padding: 10px 14px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; width: 100%; }
        .quick-add-form .form-input:focus { border-color: var(--color-primary-500); outline: none; box-shadow: 0 0 0 2px var(--color-primary-50); }
        .add-btn { 
          background: var(--color-primary-600); color: white; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 4px;
          transition: all 0.2s;
        }
        .add-btn:hover { background: var(--color-primary-700); transform: translateY(-1px); shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

        .list-header { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.025em; }
        .quick-entries-list { max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
        .quick-entry-item { 
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; border-bottom: 1px solid #f1f5f9;
        }
        .quick-entry-item:last-child { border-bottom: none; }
        .quick-entry-item:hover { background: #f8fafc; }
        .entry-info { display: flex; flex-direction: column; }
        .entry-label { font-size: 14px; font-weight: 500; color: #334155; }
        .default-badge { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .del-btn { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .del-btn:hover { color: #ef4444; background: #fee2e2; border-radius: 6px; }
        .del-placeholder { padding: 6px; cursor: help; }
        .loading-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
        .empty-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
      `}</style>
    </div>
  );
}
