import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Save, Edit2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const [widthMax, setWidthMax] = useState('');
  const [spanMin, setSpanMin] = useState('');
  const [spanMax, setSpanMax] = useState('');
  const [price, setPrice] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', steelLbsLf: '', shopLaborMhLf: '', fieldLaborMhLf: '', description: '', widthMax: '', spanMin: '', spanMax: '', price: '' });

  const hasBenchmarkFields = category && (
    category.toLowerCase().includes('rail_type') || 
    category === 'stair_type' || 
    category === 'platform_type' || 
    category === 'grating_type' ||
    category === 'stringer_size'
  );
  
  const getGridColumns = () => {
    if (category === 'platform_type') return '40px 1fr 100px 100px 100px 100px 100px 80px';
    if (category === 'stringer_size') return '40px 1fr 100px 80px 80px 80px 80px 80px 80px 80px';
    if (hasBenchmarkFields) return '40px 1fr 100px 100px 100px 100px 80px';
    return '40px 1fr 80px';
  };
  const gridColumns = getGridColumns();

  const [dragPos, setDragPos] = useState(() => {
    const saved = localStorage.getItem('quickModalPos');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });

  // Calculate position based on triggerRect or remembered dragPos
  const getModalStyle = () => {
    const modalWidth = 900;
    const modalHeight = 500;
    
    // 1. If we have a dragged position, use it
    if (dragPos) {
      return { 
        position: 'fixed', 
        top: `${dragPos.y}px`, 
        left: `${dragPos.x}px`, 
        margin: 0 
      };
    }

    // 2. Default positioning relative to triggerRect
    if (!triggerRect) return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const margin = 10;
    let left = triggerRect.left;
    let top = triggerRect.bottom + margin;

    // Boundary checks for initial placement
    if (left + modalWidth > window.innerWidth) left = window.innerWidth - modalWidth - 20;
    if (top + modalHeight > window.innerHeight) top = triggerRect.top - modalHeight - margin;
    
    left = Math.max(20, left);
    top = Math.max(20, top);

    return { position: 'fixed', top: `${top}px`, left: `${left}px`, margin: 0 };
  };

  const onMouseDown = (e) => {
    // Only drag from header, not from close button
    if (e.target.closest('.close-btn')) return;
    
    const rect = e.currentTarget.closest('.quick-modal').getBoundingClientRect();
    dragStartOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newPos = {
        x: e.clientX - dragStartOffset.current.x,
        y: e.clientY - dragStartOffset.current.y
      };
      
      // Boundaries
      newPos.x = Math.max(0, Math.min(newPos.x, window.innerWidth - 100));
      newPos.y = Math.max(0, Math.min(newPos.y, window.innerHeight - 100));
      
      setDragPos(newPos);
      localStorage.setItem('quickModalPos', JSON.stringify(newPos));
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const modalStyle = getModalStyle();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${category}?all=true`, { credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        console.log(`[QuickManage] Fetched ${data.data?.length} entries for ${category}:`, data.data);
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

  // Merge database entries with defaults
  const dbLabels = new Set(entries.map(e => (e.label || '').toLowerCase()));
  const mergedDefaults = defaultOptions
    .filter(opt => !dbLabels.has((opt.label || opt.value || opt).toString().toLowerCase()))
    .map(opt => ({
      label: opt.label || opt.value || opt,
      value: opt.value || opt.label || opt,
      isDefault: true
    }));

  const allEntries = [...entries, ...mergedDefaults];
  const showDefaults = entries.length === 0 && defaultOptions.length > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newLabel) return toast.error('Enter a Display Name');
    
    // Auto-generate value from label
    const autoValue = newLabel.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary`, { credentials: 'include',
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
          description: (category === 'platform_type') ? description : null,
          widthMax: category === 'stringer_size' && widthMax !== '' ? parseFloat(widthMax) : null,
          spanMin: category === 'stringer_size' && spanMin !== '' ? parseFloat(spanMin) : null,
          spanMax: category === 'stringer_size' && spanMax !== '' ? parseFloat(spanMax) : null,
          price: price !== '' ? parseFloat(price) : null
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
        setWidthMax('');
        setSpanMin('');
        setSpanMax('');
        setPrice('');
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
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${id}`, { credentials: 'include',
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

  const handleEditClick = (entry) => {
    setEditingId(entry.id || entry._id);
    setEditForm({
      label: entry.label || '',
      steelLbsLf: entry.steelLbsLf || '',
      shopLaborMhLf: entry.shopLaborMhLf || '',
      fieldLaborMhLf: entry.fieldLaborMhLf || '',
      description: entry.description || '',
      widthMax: entry.widthMax ?? '',
      spanMin: entry.spanMin ?? '',
      spanMax: entry.spanMax ?? '',
      price: entry.price || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.label) return toast.error('Label is required');
    try {
      const token = localStorage.getItem('steel_token');
      const res = await fetch(`${API_BASE_URL}/api/v1/dictionary/${id}`, { credentials: 'include',
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          widthMax: editForm.widthMax !== '' ? parseFloat(editForm.widthMax) : null,
          spanMin: editForm.spanMin !== '' ? parseFloat(editForm.spanMin) : null,
          spanMax: editForm.spanMax !== '' ? parseFloat(editForm.spanMax) : null,
          category,
          value: editForm.label.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'),
          price: editForm.price !== '' ? parseFloat(editForm.price) : null,
          isActive: true
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Updated successfully');
        setEditingId(null);
        fetchEntries();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (e) {
      toast.error('Update failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="quick-modal-overlay" onClick={onClose}>
      <div className="quick-modal" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="quick-modal-header" onMouseDown={onMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
          <h3>Manage {categoryLabel}</h3>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>
        
        <div className="quick-modal-body">
          <form onSubmit={handleAdd} className="quick-add-form">
            <input 
              className="form-input"
              style={{ gridColumn: hasBenchmarkFields ? (category === 'stringer_size' ? 'span 5' : 'span 2') : 'span 2' }}
              placeholder="Enter New Option (Display Name)"
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)}
              autoFocus
            />
            
            {hasBenchmarkFields && (
              <>
                <input 
                  type="number" step="0.001"
                  placeholder="STEEL LBS/LF" 
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
                <input 
                  type="number" step="0.01"
                  placeholder="PRICE ($)" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)}
                  className="form-input"
                  title="Fixed Unit Price ($)"
                />
                {category === 'stringer_size' && (
                  <>
                    <input 
                      type="number" step="0.01"
                      placeholder="MAX WIDTH (FT)" 
                      value={widthMax} 
                      onChange={e => setWidthMax(e.target.value)}
                      className="form-input"
                      title="Max Stair Width (ft) for this stringer"
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="MIN SPAN (FT)" 
                      value={spanMin} 
                      onChange={e => setSpanMin(e.target.value)}
                      className="form-input"
                      title="Min Stringer Length Span (ft)"
                    />
                    <input 
                      type="number" step="0.01"
                      placeholder="MAX SPAN (FT)" 
                      value={spanMax} 
                      onChange={e => setSpanMax(e.target.value)}
                      className="form-input"
                      title="Max Stringer Length Span (ft)"
                    />
                  </>
                )}
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

            <button type="submit" className="add-btn" style={{ gridColumn: (hasBenchmarkFields && category !== 'platform_type') ? (category === 'stringer_size' ? 'span 6' : 'span 2') : 'auto' }}>
              <Plus size={16} /> Add {categoryLabel.replace(' Types', '')}
            </button>
          </form>

          <div className="quick-entries-list">
            <div className="list-header" style={{ 
              display: 'grid', 
              gridTemplateColumns: gridColumns, 
              padding: '8px 14px', 
              fontSize: '10px',
              position: 'sticky',
              top: 0,
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              zIndex: 10,
              marginBottom: 0
            }}>
              <span>S.No.</span>
              <span>Description</span>
              {hasBenchmarkFields && (
                <>
                  <span style={{ textAlign: 'center' }}>STEEL ({category === 'platform_type' ? 'LBS/SF' : 'LBS/LF'})</span>
                  <span style={{ textAlign: 'center' }}>SHOP HOURS</span>
                  <span style={{ textAlign: 'center' }}>FIELD HOURS</span>
                  <span style={{ textAlign: 'center' }}>PRICE ($)</span>
                  {category === 'platform_type' && <span style={{ textAlign: 'center' }}>PAN RISER</span>}
                  {category === 'stringer_size' && (
                    <>
                      <span style={{ textAlign: 'center' }}>W. MAX(FT)</span>
                      <span style={{ textAlign: 'center' }}>S. MIN(FT)</span>
                      <span style={{ textAlign: 'center' }}>S. MAX(FT)</span>
                    </>
                  )}
                </>
              )}
              <span></span>
            </div>
            {loading ? <div className="loading-txt">Loading...</div> : (
              <>
                {allEntries.map((entry, index) => {
                  const isEditing = editingId === (entry.id || entry._id);
                  const isDefault = entry.isDefault || entry.isGlobalDefault;
                  return (
                    <div key={entry.id || entry._id || `idx-${index}`} className={`quick-entry-item ${isEditing ? 'is-editing' : ''} ${isDefault ? 'default-item' : ''}`} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: gridColumns, 
                      fontSize: '12px',
                      alignItems: 'center',
                      opacity: isDefault ? 0.7 : 1
                    }}>
                      <div className="sno" style={{ opacity: 0.5, fontWeight: 700 }}>{index + 1}.</div>
                      
                      {isEditing ? (
                        <>
                          <input 
                            className="edit-input"
                            value={editForm.label}
                            onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                            autoFocus
                          />
                          {hasBenchmarkFields && (
                            <>
                              <input 
                                className="edit-input center"
                                type="number" step="0.001"
                                value={editForm.steelLbsLf}
                                onChange={e => setEditForm({ ...editForm, steelLbsLf: e.target.value })}
                              />
                              <input 
                                className="edit-input center"
                                type="number" step="0.001"
                                value={editForm.shopLaborMhLf}
                                onChange={e => setEditForm({ ...editForm, shopLaborMhLf: e.target.value })}
                              />
                              <input 
                                className="edit-input center"
                                type="number" step="0.001"
                                value={editForm.fieldLaborMhLf}
                                onChange={e => setEditForm({ ...editForm, fieldLaborMhLf: e.target.value })}
                              />
                              <input 
                                className="edit-input center"
                                type="number" step="0.01"
                                value={editForm.price}
                                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                              />
                              {category === 'platform_type' && (
                                <input 
                                  className="edit-input center"
                                  type="number" step="0.001"
                                  value={editForm.description}
                                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                />
                              )}
                              {category === 'stringer_size' && (
                                <>
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.widthMax}
                                    onChange={e => setEditForm({ ...editForm, widthMax: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMin}
                                    onChange={e => setEditForm({ ...editForm, spanMin: e.target.value })}
                                  />
                                  <input 
                                    className="edit-input center"
                                    type="number" step="0.01"
                                    value={editForm.spanMax}
                                    onChange={e => setEditForm({ ...editForm, spanMax: e.target.value })}
                                  />
                                </>
                              )}
                            </>
                          )}
                          {!hasBenchmarkFields && <div></div>}
                        </>
                      ) : (
                        <>
                          <div className="entry-label" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.label}
                            {(entry.isGlobalDefault || entry.isDefault) && <span className="default-badge" style={{ marginLeft: '8px' }}>System Default</span>}
                          </div>
                          {hasBenchmarkFields ? (
                            <>
                              <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{Number(entry.steelLbsLf || 0)}</div>
                              <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{Number(entry.shopLaborMhLf || 0)}</div>
                              <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{Number(entry.fieldLaborMhLf || 0)}</div>
                              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{entry.price != null ? `$${Number(entry.price).toFixed(2)}` : '-'}</div>
                              {category === 'platform_type' && (
                                <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{Number(entry.description || 0)}</div>
                              )}
                              {category === 'stringer_size' && (
                                <>
                                  <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{entry.widthMax !== null ? entry.widthMax : '-'}</div>
                                  <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{entry.spanMin !== null ? entry.spanMin : '-'}</div>
                                  <div style={{ textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{entry.spanMax !== null ? entry.spanMax : '-'}</div>
                                </>
                              )}
                            </>
                          ) : <><div></div><div></div><div></div>{category === 'platform_type' && <div></div>}</>}
                        </>
                      )}
  
                      <div className="entry-actions" style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(entry.id || entry._id)} className="save-edit-btn" title="Save">
                              <Check size={14} />
                            </button>
                            <button onClick={handleCancelEdit} className="cancel-edit-btn" title="Cancel">
                              <X size={14} />
                            </button>
                          </>
                        ) : (isDefault && !entry.id && !entry._id) ? (
                          <div className="del-placeholder" title="Hardcoded defaults cannot be deleted. Add as custom to manage.">
                            <Trash2 size={14} style={{ opacity: 0.3 }} />
                          </div>
                        ) : (
                          <>
                            <button onClick={() => {
                              if (isDefault && !window.confirm('This is a System Default. Are you sure you want to edit it? It may affect global calculations.')) return;
                              handleEditClick(entry);
                            }} className="edit-btn" title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => {
                              if (isDefault && !window.confirm('This is a System Default. Deleting it may affect global calculations and existing projects. Proceed?')) return;
                              handleDelete(entry.id || entry._id);
                            }} className="del-btn" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                
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
        .quick-add-form { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
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
        .edit-btn { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .edit-btn:hover { color: #3b82f6; background: #dbeafe; border-radius: 6px; }
        .save-edit-btn { color: #10b981; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .save-edit-btn:hover { background: #d1fae5; border-radius: 6px; }
        .cancel-edit-btn { color: #f43f5e; background: none; border: none; cursor: pointer; padding: 6px; transition: all 0.2s; }
        .cancel-edit-btn:hover { background: #ffe4e6; border-radius: 6px; }
        .edit-input { width: 90%; background: #fff; border: 1px solid #3b82f6; border-radius: 4px; padding: 4px 8px; font-size: 13px; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .edit-input.center { text-align: center; width: 80%; margin: 0 auto; }
        .quick-entry-item.is-editing { background: #eff6ff; }
        .loading-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
        .empty-txt { text-align: center; font-size: 13px; color: #94a3b8; padding: 30px; }
      `}</style>
    </div>
  );
}

